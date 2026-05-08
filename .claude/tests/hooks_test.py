#!/usr/bin/env python3
"""Unit tests for hook modules.

Run via `.claude/tests/run.sh`, or directly:
    python3 .claude/tests/hooks_test.py
"""

import io
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from modules import common, secrets, stop, memory, lifecycle, python_tooling, wiki  # noqa: E402


def write_jsonl(lines: list[dict]) -> str:
    fd, path = tempfile.mkstemp(suffix=".jsonl")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        for line in lines:
            f.write(json.dumps(line) + "\n")
    return path


class TokenEstimateTests(unittest.TestCase):
    def test_empty_file_returns_zero(self):
        path = write_jsonl([])
        self.addCleanup(os.unlink, path)
        self.assertEqual(stop._estimate_transcript_tokens(path), 0)

    def test_missing_file_returns_none(self):
        self.assertIsNone(stop._estimate_transcript_tokens("/no/such/path.jsonl"))

    def test_chars_summed_then_divided_by_four(self):
        path = write_jsonl([
            {"role": "user", "content": "x" * 40},
            {"role": "assistant", "content": "y" * 80},
        ])
        self.addCleanup(os.unlink, path)
        # 40 + 80 chars of leaf strings + role keys ("user"=4, "assistant"=9, "content"x2 = 14) = 147 chars / 4 = 36
        # We only assert lower bound + that it's deterministic & non-trivial.
        result = stop._estimate_transcript_tokens(path)
        self.assertGreaterEqual(result, (40 + 80) // 4)

    def test_bad_json_lines_skipped(self):
        path = tempfile.mktemp(suffix=".jsonl")
        Path(path).write_text("not json\n{\"role\":\"u\",\"content\":\"abcd\"}\n", encoding="utf-8")
        self.addCleanup(os.unlink, path)
        self.assertGreater(stop._estimate_transcript_tokens(path), 0)


class LastMessagesExcerptTests(unittest.TestCase):
    def test_returns_most_recent_n(self):
        events = [{"role": "user", "content": f"msg-{i}"} for i in range(20)]
        path = write_jsonl(events)
        self.addCleanup(os.unlink, path)
        excerpt = common._last_messages_excerpt(path, max_messages=5, max_chars=10_000)
        self.assertIn("msg-19", excerpt)
        self.assertIn("msg-15", excerpt)
        self.assertNotIn("msg-14", excerpt)

    def test_respects_max_chars_tail(self):
        events = [{"role": "user", "content": "x" * 200} for _ in range(30)]
        path = write_jsonl(events)
        self.addCleanup(os.unlink, path)
        excerpt = common._last_messages_excerpt(path, max_messages=30, max_chars=500)
        self.assertLessEqual(len(excerpt), 500)


class BuildDriftPromptTests(unittest.TestCase):
    def test_includes_usage_pct_and_excerpt_and_action_choices(self):
        prompt = stop._build_drift_prompt(excerpt="EXCERPT_MARK", usage_pct=42.0)
        for needle in ("EXCERPT_MARK", "42%", "nothing", "compact", "clear", "JSON"):
            self.assertIn(needle, prompt)


class ParseDriftVerdictTests(unittest.TestCase):
    def test_valid_compact(self):
        v = stop._parse_drift_verdict('Sure: {"action":"compact","reason":"too long"} done.')
        self.assertEqual(v, {"action": "compact", "reason": "too long"})

    def test_valid_clear(self):
        v = stop._parse_drift_verdict('{"action":"clear","reason":"new topic"}')
        self.assertEqual(v["action"], "clear")

    def test_valid_nothing(self):
        v = stop._parse_drift_verdict('{"action":"nothing","reason":"fine"}')
        self.assertEqual(v["action"], "nothing")

    def test_invalid_action_rejected(self):
        self.assertIsNone(stop._parse_drift_verdict('{"action":"bogus","reason":"x"}'))

    def test_no_json_rejected(self):
        self.assertIsNone(stop._parse_drift_verdict("just words, no json here"))

    def test_empty_input_rejected(self):
        self.assertIsNone(stop._parse_drift_verdict(""))


class StopHookFlowTests(unittest.TestCase):
    """End-to-end drift_check with the LLM call mocked."""

    def setUp(self):
        self.transcript = write_jsonl([
            {"role": "user", "content": "x" * 4000},
            {"role": "assistant", "content": "y" * 4000},
        ])
        self.addCleanup(os.unlink, self.transcript)

    def _run(self, env_overrides: dict, llm_response: str | None) -> str:
        env = {
            "LLM_BACKEND": "ollama",
            "LLM_MODEL": "gemma4:e4b",
            "CLAUDE_CONTEXT_TOKENS": "2000",  # small to force gate to trip
            "STOP_HOOK_DRIFT_GATE": "30",
            **env_overrides,
        }
        captured_stderr = io.StringIO()
        with mock.patch.dict(os.environ, env, clear=False), \
             mock.patch.object(stop, "_ask_local_llm", return_value=llm_response), \
             mock.patch.object(sys, "stderr", captured_stderr):
            stop.drift_check({"transcript_path": self.transcript})
        return captured_stderr.getvalue()

    def test_unconfigured_backend_is_silent(self):
        out = self._run({"LLM_BACKEND": ""}, llm_response='{"action":"compact","reason":"x"}')
        self.assertEqual(out, "")

    def test_below_drift_gate_skips_llm(self):
        # huge context_max → usage% << gate
        out = self._run({"CLAUDE_CONTEXT_TOKENS": "10000000"},
                        llm_response='{"action":"compact","reason":"x"}')
        self.assertEqual(out, "")

    def test_compact_verdict_prints_to_stderr(self):
        out = self._run({}, llm_response='{"action":"compact","reason":"context filling"}')
        self.assertIn("/compact", out)
        self.assertIn("context filling", out)

    def test_clear_verdict_prints_to_stderr(self):
        out = self._run({}, llm_response='{"action":"clear","reason":"new task"}')
        self.assertIn("/clear", out)
        self.assertIn("new task", out)

    def test_nothing_verdict_silent(self):
        out = self._run({}, llm_response='{"action":"nothing","reason":"fine"}')
        self.assertEqual(out, "")

    def test_llm_unreachable_silent(self):
        out = self._run({}, llm_response=None)
        self.assertEqual(out, "")

    def test_garbage_response_silent(self):
        out = self._run({}, llm_response="i refuse to comply")
        self.assertEqual(out, "")

    def test_excerpt_bounded_by_llm_context(self):
        """A small local model must not be force-fed a 1M-char transcript."""
        captured = {}

        def fake_ask(_backend, prompt):
            captured["len"] = len(prompt)
            return '{"action":"nothing","reason":"x"}'

        big = write_jsonl([{"role": "user", "content": "x" * 100_000}])
        self.addCleanup(os.unlink, big)

        env = {
            "LLM_BACKEND": "ollama",
            "LLM_MODEL": "gemma4:e4b",
            "CLAUDE_CONTEXT_TOKENS": "200000",
            "STOP_HOOK_DRIFT_GATE": "0",  # force the LLM call
            "LLM_CONTEXT_TOKENS": "4000",  # tiny local model
        }
        with mock.patch.dict(os.environ, env, clear=False), \
             mock.patch.object(stop, "_ask_local_llm", side_effect=fake_ask):
            stop.drift_check({"transcript_path": big})

        # Excerpt budget = (4000 - 500) * 4 / 2 = 7000 chars; prompt template
        # adds ~500 chars on top. Assert the prompt is comfortably below the
        # local context window in chars-equivalent (4000 tokens * 4 chars).
        self.assertLess(captured["len"], 4000 * 4)


class ReadMemoryIndexTests(unittest.TestCase):
    def test_missing_file_returns_none(self):
        with mock.patch.object(memory, "_MEMORY_INDEX", Path("/no/such/MEMORY.md")):
            self.assertIsNone(memory._read_memory_index())

    def test_returns_content_when_present(self):
        fd, path = tempfile.mkstemp(suffix=".md")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write("# Project Memory\n\n## Index\n")
        self.addCleanup(os.unlink, path)
        with mock.patch.object(memory, "_MEMORY_INDEX", Path(path)):
            result = memory._read_memory_index()
        self.assertIn("# Project Memory", result)

    def test_truncates_at_200_lines(self):
        fd, path = tempfile.mkstemp(suffix=".md")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            for i in range(250):
                f.write(f"line-{i}\n")
        self.addCleanup(os.unlink, path)
        with mock.patch.object(memory, "_MEMORY_INDEX", Path(path)):
            result = memory._read_memory_index()
        self.assertIn("truncated", result)
        self.assertNotIn("line-220", result)


class UserPromptSubmitTests(unittest.TestCase):
    def _run(self, prompt: str) -> str:
        payload = {"prompt": prompt}
        captured = io.StringIO()
        with mock.patch.object(sys, "stdout", captured):
            memory.user_prompt_submit(payload)
        return captured.getvalue()

    def test_trigger_we_decided_emits_hint(self):
        out = self._run("we decided to use ulid for loop ids")
        self.assertTrue(out)
        data = json.loads(out)
        self.assertIn("project-memory hint", data["hookSpecificOutput"]["additionalContext"])

    def test_trigger_remember_emits_hint(self):
        out = self._run("remember the presigned URL TTL is 60s")
        self.assertTrue(out)
        data = json.loads(out)
        self.assertIn("additionalContext", data["hookSpecificOutput"])

    def test_trigger_always_emits_hint(self):
        out = self._run("always use node:test not jest in this project")
        self.assertTrue(out)

    def test_trigger_from_now_on_emits_hint(self):
        out = self._run("from now on prefix env vars with LOOPER_")
        self.assertTrue(out)

    def test_neutral_prompt_silent(self):
        out = self._run("can you explain the auth middleware")
        self.assertEqual(out, "")

    def test_empty_prompt_silent(self):
        out = self._run("")
        self.assertEqual(out, "")

    def test_hint_points_to_project_memory(self):
        out = self._run("the team prefers presigned urls over proxy")
        data = json.loads(out)
        ctx = data["hookSpecificOutput"]["additionalContext"]
        self.assertIn("project-memory", ctx)
        self.assertIn(".claude/memory/", ctx)


class SessionStartMemoryTests(unittest.TestCase):
    def _run_session_start(self, memory_content: str | None) -> tuple[str, str]:
        captured_out = io.StringIO()
        captured_err = io.StringIO()

        if memory_content is not None:
            fd_mem, mem_path = tempfile.mkstemp(suffix=".md")
            with os.fdopen(fd_mem, "w", encoding="utf-8") as f:
                f.write(memory_content)
            index_path = Path(mem_path)
        else:
            index_path = Path("/no/such/MEMORY.md")

        with mock.patch.object(memory, "_MEMORY_INDEX", index_path), \
             mock.patch.object(sys, "stdout", captured_out), \
             mock.patch.object(sys, "stderr", captured_err), \
             mock.patch("subprocess.run") as mock_run, \
             mock.patch.object(lifecycle, "PROJECT_ROOT", Path(tempfile.gettempdir())):
            mock_run.return_value = mock.Mock(stdout=".claude/scripts/git-hooks\n", returncode=0)
            memory.inject_memory_index({})
            lifecycle.check_setup_status({})

        if memory_content is not None:
            os.unlink(mem_path)

        return captured_out.getvalue(), captured_err.getvalue()

    def test_memory_index_injected_when_present(self):
        out, _ = self._run_session_start("# Project Memory\n\n## Index\n- [Foo](foo.md) — a decision\n")
        self.assertTrue(out.strip())
        data = json.loads(out.strip())
        ctx = data["hookSpecificOutput"]["additionalContext"]
        self.assertIn("Project memory", ctx)
        self.assertIn("# Project Memory", ctx)

    def test_no_output_when_memory_file_missing(self):
        out, _ = self._run_session_start(None)
        self.assertEqual(out.strip(), "")

    def test_hook_event_name_correct(self):
        out, _ = self._run_session_start("# Project Memory\n")
        data = json.loads(out.strip())
        self.assertEqual(data["hookSpecificOutput"]["hookEventName"], "SessionStart")


class ProjectMemoryFlushNudgeTests(unittest.TestCase):
    def _run_nudge(self, transcript_lines: list[dict], memory_files: list[tuple[str, float]]) -> str:
        fd, transcript_path = tempfile.mkstemp(suffix=".jsonl")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            for line in transcript_lines:
                f.write(json.dumps(line) + "\n")

        memory_dir = Path(tempfile.mkdtemp())
        for name, age_offset in memory_files:
            fpath = memory_dir / name
            fpath.write_text("content", encoding="utf-8")
            now = Path(transcript_path).stat().st_mtime
            os.utime(fpath, (now + age_offset, now + age_offset))

        captured_err = io.StringIO()
        with mock.patch.object(memory, "PROJECT_ROOT", memory_dir.parent), \
             mock.patch.object(sys, "stderr", captured_err):
            # Redirect PROJECT_ROOT so that .claude/memory points to our temp dir
            temp_claude = memory_dir.parent / ".claude" / "memory"
            temp_claude.parent.mkdir(parents=True, exist_ok=True)
            if not temp_claude.exists():
                temp_claude.symlink_to(memory_dir)
            memory.flush_nudge_on_stop({"transcript_path": transcript_path})

        os.unlink(transcript_path)
        import shutil
        shutil.rmtree(str(memory_dir.parent / ".claude"), ignore_errors=True)
        return captured_err.getvalue()

    def test_triggers_no_writes_emits_nudge(self):
        lines = [
            {"role": "user", "content": "we decided to store audio in S3"},
            {"role": "assistant", "content": "Got it."},
        ]
        out = self._run_nudge(lines, memory_files=[])
        self.assertIn("project-memory", out)
        self.assertIn("/remember", out)

    def test_triggers_with_recent_write_silent(self):
        lines = [
            {"role": "user", "content": "we decided to use ulid"},
            {"role": "assistant", "content": "Saved."},
        ]
        out = self._run_nudge(lines, memory_files=[("decision_foo.md", 0)])
        self.assertEqual(out, "")

    def test_no_triggers_silent(self):
        lines = [
            {"role": "user", "content": "what does the auth route do"},
            {"role": "assistant", "content": "It validates JWTs."},
        ]
        out = self._run_nudge(lines, memory_files=[])
        self.assertEqual(out, "")


class AreaForPathTests(unittest.TestCase):
    """Lock the post-rewrite path → wiki-area contract."""

    def test_packages_returns_package_name(self):
        self.assertEqual(common.area_for_path("packages/shared/src/schemas.ts"), "shared")

    def test_infra_terraform(self):
        self.assertEqual(common.area_for_path("infra/terraform/main.tf"), "infra-terraform")

    def test_infra_docker(self):
        self.assertEqual(common.area_for_path("infra/docker/docker-compose.yml"), "infra-docker")

    def test_web_audio_lib(self):
        self.assertEqual(common.area_for_path("apps/web/lib/audio/engine.ts"), "web-audio")

    def test_web_components_studio(self):
        self.assertEqual(common.area_for_path("apps/web/components/studio/PadGrid.tsx"), "web-studio")

    def test_web_components_ui(self):
        self.assertEqual(common.area_for_path("apps/web/components/ui/Slider.tsx"), "web-ui")

    def test_web_app_pages(self):
        self.assertEqual(common.area_for_path("apps/web/app/(app)/studio/page.tsx"), "web-pages")

    def test_web_hooks(self):
        self.assertEqual(common.area_for_path("apps/web/hooks/useAudioEngine.ts"), "web-hooks")

    def test_api_routes(self):
        self.assertEqual(common.area_for_path("apps/api/src/routes/auth.ts"), "api-routes")

    def test_api_db(self):
        self.assertEqual(common.area_for_path("apps/api/src/db/users.ts"), "api-db")

    def test_api_tests_dir(self):
        self.assertEqual(common.area_for_path("apps/api/tests/auth.test.ts"), "api-tests")

    def test_unknown_top_level_returns_none(self):
        self.assertIsNone(common.area_for_path("README.md"))
        self.assertIsNone(common.area_for_path("docs/wiki/index.md"))


class IsTrackedTests(unittest.TestCase):
    def test_tracked_roots(self):
        self.assertTrue(common.is_tracked("apps/web/app/page.tsx"))
        self.assertTrue(common.is_tracked("packages/shared/src/index.ts"))
        self.assertTrue(common.is_tracked("infra/terraform/main.tf"))

    def test_untracked(self):
        self.assertFalse(common.is_tracked("README.md"))
        self.assertFalse(common.is_tracked("scripts/dev.sh"))
        self.assertFalse(common.is_tracked("src/old.js"))  # legacy path no longer tracked


class CheckNoSecretsTests(unittest.TestCase):
    def _make_payload(self, file_path: str, content: str) -> dict:
        return {"tool_input": {"file_path": file_path, "content": content}}

    def test_allowlist_skips_test_file(self):
        # A test file with a fixture password must not be blocked.
        payload = self._make_payload(
            "apps/api/tests/auth.test.ts",
            'const PASSWORD = "supersecret123";',
        )
        # Should not call sys.exit — no SystemExit raised.
        secrets.check_no_secrets(payload)

    def test_eval_pattern_caught_in_source_file(self):
        payload = self._make_payload(
            "apps/api/src/routes/auth.ts",
            "const result = eval(userInput);",
        )
        with self.assertRaises(SystemExit) as cm:
            secrets.check_no_secrets(payload)
        self.assertEqual(cm.exception.code, 2)

    def test_fixture_password_in_spec_file_not_blocked(self):
        # *.spec.ts files are also in the allowlist.
        payload = self._make_payload(
            "apps/web/lib/auth.spec.ts",
            'password: "mypassword123", token: "abc123token456"',
        )
        secrets.check_no_secrets(payload)  # must not raise


class CheckUvOverPipTests(unittest.TestCase):
    """Mirrors .claude/rules/python-tooling.md. P = lower 'PIP' avoids tripping the
    rule on this very file when self-scanned by editors / linters."""

    P = "PIP".lower()

    def _bash(self, cmd: str) -> dict:
        return {"tool_name": "Bash", "tool_input": {"command": cmd}}

    def _edit(self, file_path: str, new_string: str) -> dict:
        return {"tool_name": "Edit", "tool_input": {"file_path": file_path, "new_string": new_string}}

    def _multi(self, file_path: str, new_strings: list) -> dict:
        return {
            "tool_name": "MultiEdit",
            "tool_input": {"file_path": file_path, "edits": [{"new_string": s} for s in new_strings]},
        }

    def _expect_block(self, payload: dict) -> None:
        with self.assertRaises(SystemExit) as cm:
            python_tooling.check_uv_over_pip(payload)
        self.assertEqual(cm.exception.code, 2)

    def test_bare_pip_install_blocks(self):
        self._expect_block(self._bash(f"{self.P} install semble"))

    def test_uv_pip_install_allowed(self):
        python_tooling.check_uv_over_pip(self._bash(f"uv {self.P} install --system semble"))

    def test_uv_pip_install_with_extra_whitespace_allowed(self):
        python_tooling.check_uv_over_pip(self._bash(f"uv   {self.P} install --system foo"))

    def test_uvx_allowed(self):
        python_tooling.check_uv_over_pip(self._bash("uvx semble"))

    def test_uv_tool_install_allowed(self):
        python_tooling.check_uv_over_pip(self._bash("uv tool install semble"))

    def test_python_dash_m_pip_install_blocks(self):
        self._expect_block(self._bash(f"python3 -m {self.P} install foo"))

    def test_pip_install_inside_quoted_string_allowed(self):
        python_tooling.check_uv_over_pip(self._bash(f'echo "{self.P} install is forbidden"'))

    def test_pip_install_inside_commit_message_allowed(self):
        python_tooling.check_uv_over_pip(self._bash(f'git commit -m "chore: forbid {self.P} install"'))

    def test_no_pip_substring_fast_path_allowed(self):
        python_tooling.check_uv_over_pip(self._bash("echo hello world"))

    def test_break_system_packages_blocks(self):
        self._expect_block(self._bash(f"uv {self.P} install --break-system-packages foo"))

    def test_edit_file_with_pip_install_blocks(self):
        self._expect_block(self._edit("/path/x.py", f"run {self.P} install foo"))

    def test_edit_exempt_scripts_path_allowed(self):
        # The hook's own source legitimately contains the literals it scans for.
        python_tooling.check_uv_over_pip(
            self._edit("/x/.claude/scripts/modules/python_tooling.py", f"run {self.P} install foo")
        )

    def test_edit_exempt_md_in_rules_dir_allowed(self):
        python_tooling.check_uv_over_pip(
            self._edit("/x/.claude/rules/python-tooling.md", f"do not run {self.P} install foo")
        )

    def test_edit_exempt_tests_path_allowed(self):
        python_tooling.check_uv_over_pip(
            self._edit("/x/.claude/tests/hooks_test.py", f"assert {self.P} install fails")
        )

    def test_multiedit_with_pip_install_blocks(self):
        self._expect_block(self._multi("/path/x.py", [f"run {self.P} install foo"]))

    def test_multiedit_clean_allowed(self):
        python_tooling.check_uv_over_pip(self._multi("/path/x.py", ["console.log('ok')"]))

    def test_unknown_tool_no_op(self):
        # Tools the hook doesn't gate on (e.g. Read, Glob) must be silent.
        python_tooling.check_uv_over_pip({"tool_name": "Read", "tool_input": {}})


class WikiTests(unittest.TestCase):
    """mark_anatomy_stale + check_anatomy_fresh under a temp PROJECT_ROOT."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self._orig_root = common.PROJECT_ROOT
        common.PROJECT_ROOT = Path(self.tmp)
        # wiki.py captured PROJECT_ROOT at import; rebind for the test.
        wiki.PROJECT_ROOT = Path(self.tmp)
        # Seed apps/web/lib/audio so is_tracked() returns True.
        (Path(self.tmp) / "apps" / "web" / "lib" / "audio").mkdir(parents=True)

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmp, ignore_errors=True)
        common.PROJECT_ROOT = self._orig_root
        wiki.PROJECT_ROOT = self._orig_root

    def test_mark_stale_appends_marker(self):
        wiki_path = Path(self.tmp) / "docs" / "wiki" / "web-audio.md"
        wiki_path.parent.mkdir(parents=True)
        wiki_path.write_text("# web-audio\n", encoding="utf-8")
        wiki.mark_anatomy_stale({
            "tool_input": {"file_path": str(Path(self.tmp) / "apps/web/lib/audio/padNode.ts")}
        })
        self.assertIn("<!-- stale:", wiki_path.read_text(encoding="utf-8"))

    def test_mark_stale_idempotent(self):
        wiki_path = Path(self.tmp) / "docs" / "wiki" / "web-audio.md"
        wiki_path.parent.mkdir(parents=True)
        wiki_path.write_text("# web-audio\n", encoding="utf-8")
        payload = {"tool_input": {"file_path": str(Path(self.tmp) / "apps/web/lib/audio/padNode.ts")}}
        wiki.mark_anatomy_stale(payload)
        wiki.mark_anatomy_stale(payload)
        body = wiki_path.read_text(encoding="utf-8")
        self.assertEqual(body.count("<!-- stale:"), 1)

    def test_mark_stale_skips_untracked_path(self):
        # docs/, infra/, .claude/ etc. are not tracked source areas — no wiki update.
        (Path(self.tmp) / "README.md").write_text("hi", encoding="utf-8")
        wiki.mark_anatomy_stale({"tool_input": {"file_path": str(Path(self.tmp) / "README.md")}})
        self.assertFalse((Path(self.tmp) / "docs" / "wiki").exists())

    def test_check_fresh_empty_dir_passes(self):
        # No wiki dir → silent pass (returns None, no SystemExit).
        wiki.check_anatomy_fresh({})  # must not raise

    def test_check_fresh_with_stale_marker_blocks(self):
        wiki_dir = Path(self.tmp) / "docs" / "wiki"
        wiki_dir.mkdir(parents=True)
        (wiki_dir / "web-audio.md").write_text(
            "# web-audio\n<!-- stale: apps/web/lib/audio/padNode.ts -->\n",
            encoding="utf-8",
        )
        with self.assertRaises(SystemExit) as cm:
            wiki.check_anatomy_fresh({})
        self.assertEqual(cm.exception.code, 1)


if __name__ == "__main__":
    unittest.main()
