---
description: Start the API server, hit the health endpoint, report status, and stop the server.
---

# /check-health

Verifies the API server boots and responds to a health check. Useful as
a smoke test before starting a session of work or after a dependency
change.

## Steps

1. Ensure any required local infrastructure is running ({{INFRA_BOOT_COMMAND}}).
   If unreachable, run {{INFRA_SEED_COMMAND}} to bootstrap.
2. Start the API server in the background: `{{API_DEV_COMMAND}} &` and remember the PID.
3. Wait up to 5 seconds for boot (poll `curl -fsS {{HEALTH_URL}}`).
4. Report the response. A healthy response looks like `{{HEALTHY_RESPONSE_EXAMPLE}}`.
5. Kill the background server (`kill <pid>`).
6. If the health endpoint did not return 200 within 5 seconds, surface the last 30 lines of server stdout as the failure reason.

## Configuration

- `INFRA_BOOT_COMMAND`, `INFRA_SEED_COMMAND` — set by `cc-scaffold`
  during the `commands` cluster, based on what was detected in the
  repo (docker-compose, devbox, nix-shell, none).
- `API_DEV_COMMAND` — the package-scoped dev script for the API.
- `HEALTH_URL` — the health endpoint URL.
- `HEALTHY_RESPONSE_EXAMPLE` — the expected response shape.

If any placeholder is unfilled, run `/cc-scaffold --cluster=commands`
to refresh.
