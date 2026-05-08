# infra-docker

_Area: `infra/docker/`_

_Last full refresh: 2026-05-08T14:00:00Z_

## infra/docker/docker-compose.yml

**Description:** Brings up DynamoDB Local (port 8000) and LocalStack S3 (port 4566) for local development. The `localstack` service is pinned to image tag `3` and exposes only the `s3` service with `us-east-1` as the default region. Both services have health checks (`curl` probes) before the `init` service starts. The `init` service mounts `./init` (read-only) and `apps/web/public/samples` (read-only as `/samples`) then executes `seed.sh` once and exits (`restart: "no"`). Local data is persisted under `.data/ddb` and `.data/ls` respectively.

---

## infra/docker/init/seed.sh

**Description:** Idempotent init script run by the `init` docker-compose service. Uses the native `aws` CLI pointed at DynamoDB Local (`:8000`) and LocalStack (`:4566`) — not the `awslocal` wrapper. Creates three DynamoDB tables if they do not already exist:

- **`looper_users`** — hash key `pk` (S) + range key `sk` (S); GSI `gsi_email` on `gsi_email_pk` (HASH)
- **`looper_loops`** — hash key `pk` (S) + range key `sk` (S); GSI `gsi_public` on `gsi_public_pk` (HASH) + `createdAt` (RANGE)
- **`looper_sessions`** — hash key `pk` (S) + range key `sk` (S); no GSI

Creates the S3 bucket (name from `S3_BUCKET` env var, default `looper-loops-dev`) and applies a CORS rule allowing `GET`, `PUT`, `HEAD` from `http://localhost:3000`. Seeds one test user (`test@test.com` / `testtest`, bcrypt-hashed) with a fixed UUID `00000000-0000-0000-0000-000000000001`. If `/samples` contains any `.webm`, `.ogg`, `.wav`, or `.mp3` files, uploads them to `s3://$BUCKET/samples/`.
