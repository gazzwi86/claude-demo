"""PreToolUse:Edit|Write — scan written content for secrets via the secret-scan guard."""

from modules.common import run_guard


def check_secrets(payload: dict) -> None:
    run_guard("secret-scan.sh", payload)
