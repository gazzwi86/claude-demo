"""PostToolUse + Stop — apply the PII-mask regex guard. Non-blocking."""

from modules.common import run_guard


def mask_pii_post(payload: dict) -> None:
    run_guard("pii-mask.sh", payload)


def stop_pii_mask(payload: dict) -> None:
    run_guard("pii-mask.sh", payload)
