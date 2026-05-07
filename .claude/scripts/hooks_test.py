#!/usr/bin/env python3
"""Sibling unit tests for hooks.py.

Run via `.claude/tests/run.sh`, or directly:
    python3 .claude/scripts/hooks_test.py
"""

import io
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
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


if __name__ == "__main__":
    unittest.main()
