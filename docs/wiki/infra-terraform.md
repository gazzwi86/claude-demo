# infra-terraform

_Area: `infra/terraform/` — validate-only Terraform modules_

_Last full refresh: 2026-05-08T14:00:00Z_

## infra/terraform/main.tf

**Description:** Root Terraform configuration. Calls the four child modules (`s3-loops`, `dynamodb`, `iam`, `cloudfront`) and passes outputs between them. CloudFront is toggled off by default via `var.enable_cloudfront`. Validate-only in CI — never `apply`'d against real AWS.

---

## infra/terraform/providers.tf

**Description:** AWS provider block. Sets `region = var.aws_region`. Uses no backend — state stays local for this validate-only setup.

---

## infra/terraform/variables.tf

**Description:** Root input variables: `aws_region` (default `ap-southeast-2`), `environment` (default `dev`), `project_name` (default `looper`), `enable_cloudfront` (default `false`).

---

## infra/terraform/outputs.tf

**Description:** Aggregates and exposes child module outputs: S3 bucket name and ARN, DynamoDB table names, IAM role ARN, and CloudFront distribution ID (only when enabled).

---

## infra/terraform/modules/s3-loops/

**Description:** S3 module. Creates the audio-loops bucket with versioning disabled, a CORS policy permitting `PUT` and `GET` from the configured origins, and a lifecycle rule to abort incomplete multipart uploads after 7 days.

- `main.tf` — bucket + CORS configuration + lifecycle rule resources
- `variables.tf` — `bucket_name`, `environment`, `allowed_origins` (list)
- `outputs.tf` — `bucket_name`, `bucket_arn`

---

## infra/terraform/modules/dynamodb/

**Description:** DynamoDB module. Creates three tables (users, loops, sessions) with PAY_PER_REQUEST billing. The users table has a GSI on `gsi_email_pk` for email lookups. The loops table has a GSI on `gsi_public_pk` for querying public loops across all owners.

- `main.tf` — three `aws_dynamodb_table` resources with GSI definitions
- `variables.tf` — `environment`, table name prefix variables
- `outputs.tf` — table names and ARNs for IAM scoping

---

## infra/terraform/modules/iam/

**Description:** IAM module. Creates an ECS task execution role with least-privilege inline policies scoped to the specific S3 bucket and DynamoDB table ARNs from the other modules.

- `main.tf` — `aws_iam_role`, `aws_iam_policy`, `aws_iam_role_policy_attachment`
- `variables.tf` — `s3_bucket_arn`, `dynamodb_table_arns`, `environment`
- `outputs.tf` — `role_arn`

---

## infra/terraform/modules/cloudfront/

**Description:** Optional CloudFront distribution fronting the S3 bucket and API origin. Off by default. Configures HTTPS, custom cache behaviours per path pattern (`/api/*` bypasses cache; `/samples/*` caches aggressively), and geo-restriction controls.

- `main.tf` — `aws_cloudfront_distribution` with origin groups and cache behaviours
- `variables.tf` — `s3_bucket_name`, `api_origin_domain`, `environment`
- `outputs.tf` — `distribution_id`, `domain_name`
