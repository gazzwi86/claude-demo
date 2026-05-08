#!/usr/bin/env bash
# bootstrap.sh — idempotent, transactional Claude Code config scaffolder.
#
# Modes:
#   (default)  plan-only: print the diff bundle, write nothing.
#   --dry-run  print diff, write nothing (synonym for default; explicit).
#   --apply    apply changes with per-cluster confirmation.
#   --force    re-apply all template versions, ignoring .applied.json.
#   --lite     solo/throwaway profile (lighter deny list, no PII guard).
#
# Run from the target repo root or pass the path as the last positional arg.

set -euo pipefail

# ---- arg parse -----------------------------------------------------------
APPLY=false
DRY_RUN=false
FORCE=false
LITE=false
YES=false
CLUSTER=""
TARGET="${PWD}"

for arg in "$@"; do
  case "$arg" in
    --apply)        APPLY=true ;;
    --dry-run)      DRY_RUN=true ;;
    --force)        FORCE=true ;;
    --lite)         LITE=true ;;
    --yes|-y)       YES=true ;;
    --cluster=*)    CLUSTER="${arg#--cluster=}" ;;
    --help|-h)
      sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    -*)
      echo "bootstrap: unknown flag: $arg" >&2
      exit 64 ;;
    *)
      TARGET="$arg" ;;
  esac
done

if [[ ! -d "$TARGET" ]]; then
  echo "bootstrap: target not a directory: $TARGET" >&2
  exit 64
fi

TARGET="$(cd "$TARGET" && pwd)"
TEMPLATES="$(cd "$(dirname "$0")/templates" && pwd)"
TS="$(date -u +%Y%m%dT%H%M%SZ)"

# ---- detect --------------------------------------------------------------
HAS_GIT=false; [[ -d "$TARGET/.git" ]] && HAS_GIT=true
HAS_LICENSE=false; [[ -f "$TARGET/LICENSE" ]] && HAS_LICENSE=true
HAS_CI=false; [[ -d "$TARGET/.github/workflows" ]] && HAS_CI=true
IS_MONOREPO=false
for marker in pnpm-workspace.yaml lerna.json nx.json apps packages services; do
  [[ -e "$TARGET/$marker" ]] && IS_MONOREPO=true
done
HAS_HUSKY=false
if $HAS_GIT; then
  if (cd "$TARGET" && git config core.hooksPath 2>/dev/null | grep -q '\.husky'); then
    HAS_HUSKY=true
  fi
fi
MANAGED_DIR=""
case "$(uname -s)" in
  Darwin)  MANAGED_DIR="/Library/Application Support/ClaudeCode" ;;
  Linux)   MANAGED_DIR="/etc/claude-code" ;;
esac
HAS_MANAGED=false
[[ -n "$MANAGED_DIR" && -d "$MANAGED_DIR" ]] && HAS_MANAGED=true

# ---- helpers -------------------------------------------------------------
say()   { printf '%s\n' "$*" >&2; }
loud()  { printf '\n>>> %s\n\n' "$*" >&2; }
sha256_of() { shasum -a 256 "$1" 2>/dev/null | awk '{print $1}'; }

confirm() {
  $APPLY || return 0
  $YES && return 0
  printf '%s [y/N]: ' "$1" >&2
  read -r ans
  [[ "$ans" =~ ^[Yy]$ ]]
}

ensure_dir() {
  local d="$1"
  if $DRY_RUN || ! $APPLY; then
    [[ -d "$d" ]] || say "  + mkdir $d"
    return 0
  fi
  mkdir -p "$d"
}

# Stage area for transactional writes.
STAGE="$TARGET/.claude.tmp-$TS"
BACKUP="$TARGET/.claude/backup-$TS"

stage_file() {
  local src="$1" rel="$2"
  local dest="$STAGE/$rel"
  if $DRY_RUN || ! $APPLY; then
    if [[ -f "$TARGET/$rel" ]] && ! diff -q "$src" "$TARGET/$rel" >/dev/null 2>&1; then
      say "  ~ $rel (modified)"
    elif [[ ! -f "$TARGET/$rel" ]]; then
      say "  + $rel (new)"
    fi
    return 0
  fi
  mkdir -p "$(dirname "$dest")"
  cp "$src" "$dest"
}

# ---- transactional commit -----------------------------------------------
commit_stage() {
  $APPLY || return 0
  $DRY_RUN && return 0
  if [[ ! -d "$STAGE" ]]; then
    say "nothing staged"
    return 0
  fi

  loud "BACKING UP existing files to: $BACKUP"
  mkdir -p "$BACKUP"
  for staged in $(find "$STAGE" -type f 2>/dev/null); do
    rel="${staged#$STAGE/}"
    if [[ -f "$TARGET/$rel" ]]; then
      mkdir -p "$BACKUP/$(dirname "$rel")"
      cp "$TARGET/$rel" "$BACKUP/$rel"
    fi
  done

  loud "APPLYING staged changes"
  for staged in $(find "$STAGE" -type f 2>/dev/null); do
    rel="${staged#$STAGE/}"
    mkdir -p "$TARGET/$(dirname "$rel")"
    cp "$staged" "$TARGET/$rel"
    case "$rel" in
      .claude/scripts/*.sh|.claude/scripts/*/*.sh|.claude/scripts/*.py)
        chmod +x "$TARGET/$rel" 2>/dev/null || true
        ;;
    esac
  done

  rm -rf "$STAGE"
  loud "DONE. backup at $BACKUP"
}

# ---- manifest (.applied.json) -------------------------------------------
APPLIED="$TARGET/.claude/best-practises/.applied.json"

manifest_get_sha() {
  local key="$1"
  [[ -f "$APPLIED" ]] || { echo ""; return; }
  python3 - "$APPLIED" "$key" <<'PY' 2>/dev/null || echo ""
import json, sys
try:
    data = json.load(open(sys.argv[1]))
except Exception:
    sys.exit(0)
print(data.get("templates", {}).get(sys.argv[2], {}).get("sha256", ""))
PY
}

manifest_write() {
  $APPLY || return 0
  $DRY_RUN && return 0
  ensure_dir "$(dirname "$APPLIED")"
  python3 - "$APPLIED" "$STAGE" "$TEMPLATES" "$LITE" <<'PY'
import json, os, sys, hashlib, datetime
applied_path, stage, templates, lite = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4] == "True"
data = {"schema": "1.0.0",
        "applied_at": datetime.datetime.utcnow().isoformat() + "Z",
        "templates": {},
        "profile": "lite" if lite else "strict-by-default",
        "lite": lite}
if os.path.isfile(applied_path):
    try:
        data["templates"] = json.load(open(applied_path)).get("templates", {})
    except Exception:
        pass
for root, _, files in os.walk(stage if os.path.isdir(stage) else templates):
    for f in files:
        p = os.path.join(root, f)
        rel = os.path.relpath(p, stage if os.path.isdir(stage) else templates)
        h = hashlib.sha256(open(p, "rb").read()).hexdigest()
        data["templates"][rel] = {"version": "1.0.0", "sha256": h}
tmp = applied_path + ".tmp"
open(tmp, "w").write(json.dumps(data, indent=2))
os.rename(tmp, applied_path)
PY
}

# ---- core scaffolding ---------------------------------------------------
say "cc-audit bootstrap"
say "  target:        $TARGET"
say "  templates:     $TEMPLATES"
say "  apply:         $APPLY"
say "  dry-run:       $DRY_RUN"
say "  lite:          $LITE"
say "  has-git:       $HAS_GIT"
say "  has-license:   $HAS_LICENSE"
say "  has-ci:        $HAS_CI"
say "  is-monorepo:   $IS_MONOREPO"
say "  husky:         $HAS_HUSKY"
say "  managed:       $HAS_MANAGED"
say ""

if $HAS_HUSKY; then
  loud "WARNING: core.hooksPath is set to a Husky directory. cc-audit will NOT silently overwrite it."
  if ! confirm "Migrate Husky hooks into .claude/scripts/git-hooks/ (chain via wrapper)?"; then
    say "  skipping git-hooks cluster"
    HAS_GIT=false
  fi
fi

if $HAS_MANAGED; then
  say "managed-policy detected at $MANAGED_DIR — settings/permissions findings will defer where locked"
fi

# Cluster: settings + scripts
if [[ -z "$CLUSTER" || "$CLUSTER" == "settings" ]]; then
  say "cluster: settings + scripts"
  stage_file "$TEMPLATES/settings.baseline.json" ".claude/settings.json"
  stage_file "$TEMPLATES/hooks.py" ".claude/scripts/hooks.py"
  stage_file "$TEMPLATES/statusline.sh" ".claude/scripts/statusline.sh"
  for g in secret-scan pii-mask iac-deny no-verify-deny; do
    stage_file "$TEMPLATES/guards/${g}.sh" ".claude/scripts/guards/${g}.sh"
  done
fi

# Cluster: rules
if [[ -z "$CLUSTER" || "$CLUSTER" == "rules" ]]; then
  say "cluster: rules"
  for r in code-style testing security; do
    if [[ ! -f "$TARGET/.claude/rules/${r}.md" ]]; then
      stage_file "$TEMPLATES/rules/${r}.md" ".claude/rules/${r}.md"
    fi
  done
fi

# Cluster: CLAUDE.md skeleton (only if missing)
if [[ -z "$CLUSTER" || "$CLUSTER" == "claude-md" ]]; then
  if [[ ! -f "$TARGET/CLAUDE.md" ]]; then
    say "cluster: CLAUDE.md (new)"
    stage_file "$TEMPLATES/claude-md.template" "CLAUDE.md"
  fi
fi

# Cluster: best-practises docs
if [[ -z "$CLUSTER" || "$CLUSTER" == "best-practises" ]]; then
  say "cluster: best-practises"
  if [[ -d "$TEMPLATES/best-practises" ]]; then
    for f in "$TEMPLATES/best-practises"/*.md; do
      [[ -f "$f" ]] || continue
      stage_file "$f" ".claude/best-practises/$(basename "$f")"
    done
  fi
fi

# Cluster: git hooks (only if .git/ present)
if $HAS_GIT && [[ -z "$CLUSTER" || "$CLUSTER" == "git-hooks" ]]; then
  say "cluster: git-hooks"
  for h in pre-commit pre-push; do
    stage_file "$TEMPLATES/git-hooks/${h}" ".claude/scripts/git-hooks/${h}"
  done
  if $APPLY && ! $DRY_RUN; then
    confirm "Set core.hooksPath to .claude/scripts/git-hooks?" \
      && (cd "$TARGET" && git config core.hooksPath .claude/scripts/git-hooks)
  fi
fi

# Cluster: logs/ + reports/ + plans/ scaffolding
if [[ -z "$CLUSTER" || "$CLUSTER" == "scaffolding" ]]; then
  ensure_dir "$TARGET/.claude/logs"
  ensure_dir "$TARGET/.claude/reports"
  ensure_dir "$TARGET/.claude/plans"
fi

# .gitignore for settings.local.json
if $APPLY && ! $DRY_RUN && $HAS_GIT; then
  GI="$TARGET/.gitignore"
  if [[ -f "$GI" ]] && ! grep -qF '.claude/settings.local.json' "$GI"; then
    echo '.claude/settings.local.json' >> "$GI"
    say "  appended .claude/settings.local.json to .gitignore"
  fi
fi

commit_stage
manifest_write

if $APPLY && ! $DRY_RUN; then
  loud "cc-audit applied. report: $TARGET/.claude/reports/CLAUDE-CONFIGURATION-AUDIT.md"
else
  loud "cc-audit plan complete (no files written). use --apply to scaffold."
fi
