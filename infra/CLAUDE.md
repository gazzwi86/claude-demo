# infra — conventions

Two halves:

- `infra/terraform/` — Terraform modules for the AWS shape this app would
  take in cloud (S3 bucket for loops, three DynamoDB tables, IAM role,
  optional CloudFront). **Validate-only**: `pnpm infra:validate` runs
  `terraform init -backend=false && terraform validate`. Never `apply`'d
  in this demo — real AWS is out of scope.
- `infra/docker/` — `docker-compose.yml` standing up DynamoDB Local
  (`amazon/dynamodb-local:latest`, port 8000) and LocalStack
  (`localstack/localstack:latest`, port 4566, S3 only) for dev/test, plus
  a one-shot `init` service that creates tables + bucket and uploads the
  bundled CC0 sample loops. All idempotent.

## Conventions

- Terraform: 2-space indent, snake_case resources, modules under `modules/`.
  Every module exposes its own `variables.tf` + `outputs.tf`.
- No state backend configured (validate-only). `providers.tf` pins versions.
- docker-compose service names are stable — `dynamodb-local`, `localstack`,
  `init` — and used as hostnames inside the network.
- Local data persisted under `infra/docker/.data/` (gitignored).
