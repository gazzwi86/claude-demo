#!/usr/bin/env python3
"""Sibling unit tests for hooks.py.

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
import hooks  # noqa: E402


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
        self.assertEqual(hooks._estimate_transcript_tokens(path), 0)

    def test_missing_file_returns_none(self):
        self.assertIsNone(hooks._estimate_transcript_tokens("/no/such/path.jsonl"))

    def test_chars_summed_then_divided_by_four(self):
        path = write_jsonl([
            {"role": "user", "content": "x" * 40},
            {"role": "assistant", "content": "y" * 80},
        ])
        self.addCleanup(os.unlink, path)
        # 40 + 80 chars of leaf strings + role keys ("user"=4, "assistant"=9, "content"x2 = 14) = 147 chars / 4 = 36
        # We only assert lower bound + that it's deterministic & non-trivial.
        result = hooks._estimate_transcript_tokens(path)
        self.assertGreaterEqual(result, (40 + 80) // 4)

    def test_bad_json_lines_skipped(self):
        path = tempfile.mktemp(suffix=".jsonl")
        Path(path).write_text("not json\n{\"role\":\"u\",\"content\":\"abcd\"}\n", encoding="utf-8")
        self.addCleanup(os.unlink, path)
        self.assertGreater(hooks._estimate_transcript_tokens(path), 0)


class LastMessagesExcerptTests(unittest.TestCase):
    def test_returns_most_recent_n(self):
        events = [{"role": "user", "content": f"msg-{i}"} for i in range(20)]
        path = write_jsonl(events)
        self.addCleanup(os.unlink, path)
        excerpt = hooks._last_messages_excerpt(path, max_messages=5, max_chars=10_000)
        self.assertIn("msg-19", excerpt)
        self.assertIn("msg-15", excerpt)
        self.assertNotIn("msg-14", excerpt)

    def test_respects_max_chars_tail(self):
        events = [{"role": "user", "content": "x" * 200} for _ in range(30)]
        path = write_jsonl(events)
        self.addCleanup(os.unlink, path)
        excerpt = hooks._last_messages_excerpt(path, max_messages=30, max_chars=500)
        self.assertLessEqual(len(excerpt), 500)


class BuildDriftPromptTests(unittest.TestCase):
    def test_includes_usage_pct_and_excerpt_and_action_choices(self):
        prompt = hooks._build_drift_prompt(excerpt="EXCERPT_MARK", usage_pct=42.0)
        for needle in ("EXCERPT_MARK", "42%", "nothing", "compact", "clear", "JSON"):
            self.assertIn(needle, prompt)


class ParseDriftVerdictTests(unittest.TestCase):
    def test_valid_compact(self):
        v = hooks._parse_drift_verdict('Sure: {"action":"compact","reason":"too long"} done.')
        self.assertEqual(v, {"action": "compact", "reason": "too long"})

    def test_valid_clear(self):
        v = hooks._parse_drift_verdict('{"action":"clear","reason":"new topic"}')
        self.assertEqual(v["action"], "clear")

    def test_valid_nothing(self):
        v = hooks._parse_drift_verdict('{"action":"nothing","reason":"fine"}')
        self.assertEqual(v["action"], "nothing")

    def test_invalid_action_rejected(self):
        self.assertIsNone(hooks._parse_drift_verdict('{"action":"bogus","reason":"x"}'))

    def test_no_json_rejected(self):
        self.assertIsNone(hooks._parse_drift_verdict("just words, no json here"))

    def test_empty_input_rejected(self):
        self.assertIsNone(hooks._parse_drift_verdict(""))


class StopHookFlowTests(unittest.TestCase):
    """End-to-end Stop hook with the LLM call mocked."""

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
             mock.patch.object(hooks, "_ask_local_llm", return_value=llm_response), \
             mock.patch.object(sys, "stderr", captured_stderr):
            hooks.stop({"transcript_path": self.transcript})
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
             mock.patch.object(hooks, "_ask_local_llm", side_effect=fake_ask):
            hooks.stop({"transcript_path": big})

        # Excerpt budget = (4000 - 500) * 4 / 2 = 7000 chars; prompt template
        # adds ~500 chars on top. Assert the prompt is comfortably below the
        # local context window in chars-equivalent (4000 tokens * 4 chars).
        self.assertLess(captured["len"], 4000 * 4)


class ReadMemoryIndexTests(unittest.TestCase):
    def test_missing_file_returns_none(self):
        with mock.patch.object(hooks, "_MEMORY_INDEX", Path("/no/such/MEMORY.md")):
            self.assertIsNone(hooks._read_memory_index())

    def test_returns_content_when_present(self):
        fd, path = tempfile.mkstemp(suffix=".md")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write("# Project Memory\n\n## Index\n")
        self.addCleanup(os.unlink, path)
        with mock.patch.object(hooks, "_MEMORY_INDEX", Path(path)):
            result = hooks._read_memory_index()
        self.assertIn("# Project Memory", result)

    def test_truncates_at_200_lines(self):
        fd, path = tempfile.mkstemp(suffix=".md")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            for i in range(250):
                f.write(f"line-{i}\n")
        self.addCleanup(os.unlink, path)
        with mock.patch.object(hooks, "_MEMORY_INDEX", Path(path)):
            result = hooks._read_memory_index()
        self.assertIn("truncated", result)
        self.assertNotIn("line-220", result)


class UserPromptSubmitTests(unittest.TestCase):
    def _run(self, prompt: str) -> str:
        payload = {"prompt": prompt}
        captured = io.StringIO()
        with mock.patch.object(sys, "stdout", captured):
            hooks.user_prompt_submit(payload)
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
        fd_out, out_path = tempfile.mkstemp()
        os.close(fd_out)
        captured_out = io.StringIO()
        captured_err = io.StringIO()

        if memory_content is not None:
            fd_mem, mem_path = tempfile.mkstemp(suffix=".md")
            with os.fdopen(fd_mem, "w", encoding="utf-8") as f:
                f.write(memory_content)
            index_path = Path(mem_path)
        else:
            index_path = Path("/no/such/MEMORY.md")

        graphify_missing = Path("/no/such/graphify.json")

        with mock.patch.object(hooks, "_MEMORY_INDEX", index_path), \
             mock.patch.object(sys, "stdout", captured_out), \
             mock.patch.object(sys, "stderr", captured_err), \
             mock.patch("subprocess.run") as mock_run, \
             mock.patch.object(hooks, "PROJECT_ROOT", Path(tempfile.gettempdir())):
            mock_run.return_value = mock.Mock(stdout=".claude/scripts/git-hooks\n", returncode=0)
            hooks.session_start({})

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
        with mock.patch.object(hooks, "PROJECT_ROOT", memory_dir.parent), \
             mock.patch.object(sys, "stderr", captured_err):
            # Redirect PROJECT_ROOT so that .claude/memory points to our temp dir
            temp_claude = memory_dir.parent / ".claude" / "memory"
            temp_claude.parent.mkdir(parents=True, exist_ok=True)
            if not temp_claude.exists():
                temp_claude.symlink_to(memory_dir)
            hooks._project_memory_flush_nudge(transcript_path)

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
        self.assertEqual(hooks.area_for_path("packages/shared/src/schemas.ts"), "shared")

    def test_infra_terraform(self):
        self.assertEqual(hooks.area_for_path("infra/terraform/main.tf"), "infra-terraform")

    def test_infra_docker(self):
        self.assertEqual(hooks.area_for_path("infra/docker/docker-compose.yml"), "infra-docker")

    def test_web_audio_lib(self):
        self.assertEqual(hooks.area_for_path("apps/web/lib/audio/engine.ts"), "web-audio")

    def test_web_components_studio(self):
        self.assertEqual(hooks.area_for_path("apps/web/components/studio/PadGrid.tsx"), "web-studio")

    def test_web_components_ui(self):
        self.assertEqual(hooks.area_for_path("apps/web/components/ui/Slider.tsx"), "web-ui")

    def test_web_app_pages(self):
        self.assertEqual(hooks.area_for_path("apps/web/app/(app)/studio/page.tsx"), "web-pages")

    def test_web_hooks(self):
        self.assertEqual(hooks.area_for_path("apps/web/hooks/useAudioEngine.ts"), "web-hooks")

    def test_api_routes(self):
        self.assertEqual(hooks.area_for_path("apps/api/src/routes/auth.ts"), "api-routes")

    def test_api_db(self):
        self.assertEqual(hooks.area_for_path("apps/api/src/db/users.ts"), "api-db")

    def test_api_tests_dir(self):
        self.assertEqual(hooks.area_for_path("apps/api/tests/auth.test.ts"), "api-tests")

    def test_unknown_top_level_returns_none(self):
        self.assertIsNone(hooks.area_for_path("README.md"))
        self.assertIsNone(hooks.area_for_path("docs/wiki/index.md"))


class IsTrackedTests(unittest.TestCase):
    def test_tracked_roots(self):
        self.assertTrue(hooks.is_tracked("apps/web/app/page.tsx"))
        self.assertTrue(hooks.is_tracked("packages/shared/src/index.ts"))
        self.assertTrue(hooks.is_tracked("infra/terraform/main.tf"))

    def test_untracked(self):
        self.assertFalse(hooks.is_tracked("README.md"))
        self.assertFalse(hooks.is_tracked("scripts/dev.sh"))
        self.assertFalse(hooks.is_tracked("src/old.js"))  # legacy path no longer tracked


if __name__ == "__main__":
    unittest.main()
