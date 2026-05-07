#!/usr/bin/env bash
set -euo pipefail

# Installs Graphify and wires its Claude Code integration. Graphify converts
# this codebase into a queryable knowledge graph that Claude can consult,
# reducing token usage on large-repo searches.
#
# Repo: https://github.com/safishamsi/graphify

if ! command -v uv >/dev/null 2>&1; then
  echo "setup-graphify: uv is required but not found." >&2
  echo "  Install uv first: https://docs.astral.sh/uv/getting-started/installation/" >&2
  exit 1
fi

echo "setup-graphify: installing graphifyy via uv ..."
uv tool install graphifyy

if ! command -v graphify >/dev/null 2>&1; then
  echo "setup-graphify: graphify CLI not on PATH after install." >&2
  echo "  Run 'uv tool update-shell' to add uv's tool bin dir to PATH, then re-run." >&2
  exit 1
fi

echo "setup-graphify: running 'graphify install' (one-time setup)..."
graphify install

echo "setup-graphify: wiring Claude Code integration..."
graphify claude install

echo "setup-graphify: indexing this repo..."
graphify index .

echo
echo "Done. Try in Claude:"
echo "  > Ask graphify which files reference parsePageParams"
