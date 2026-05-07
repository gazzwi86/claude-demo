---
description: Start the apps/api server, hit /health, and report status. Stops the server afterwards.
---

1. Ensure DynamoDB Local + LocalStack are up by running `pnpm localstack:up`. If they aren't reachable, run `pnpm localstack:seed` to create tables + bucket.
2. Start the api server in the background: `pnpm -F @looper/api dev &` and remember the PID.
3. Wait up to 5 seconds for it to boot (poll `curl -fsS http://localhost:3001/health`).
4. Report the JSON response. A healthy response looks like `{"ok":true,"ts":"..."}`.
5. Kill the background server (`kill <pid>`).
6. If `/health` did not return 200 within 5 seconds, surface the last 30 lines of server stdout as the failure reason.
