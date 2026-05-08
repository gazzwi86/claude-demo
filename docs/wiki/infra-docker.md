# infra-docker

_Area: `infra/docker/`_

_Last full refresh: 2026-05-08T14:00:00Z_

## infra/docker/docker-compose.yml

**Description:** Brings up DynamoDB Local (port 8000) and LocalStack S3 (port 4566) for local development. An `init` service runs `seed.sh` after both dependencies are healthy, creating all tables and the audio bucket. A shared bridge network connects all services. Volumes persist DynamoDB data between restarts.

---

## infra/docker/init/seed.sh

**Description:** Idempotent init script run by the `init` docker-compose service on first start. Uses `awslocal` (LocalStack CLI wrapper) to create the three DynamoDB tables (users, loops, sessions with their GSIs) and the S3 audio-loops bucket. Safe to re-run — ignores "ResourceInUseException" errors from already-existing resources.
