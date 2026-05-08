# IaC best practices

## Plan before apply

`terraform apply`, `cdk deploy`, `pulumi up` should refuse to run without a recent plan/diff/preview.

Implementation: `.claude/logs/.iac-plan-marker` is `touch`ed when:
- `terraform plan` or `terraform validate`
- `cdk diff`
- `pulumi preview`

Apply commands check the marker via `guards/iac-deny.sh`. If missing or older than 10 min, exit 2.

## Hard denies

```
Bash(terraform destroy *)
Bash(terraform apply -auto-approve *)
Bash(cdk destroy *)
Bash(pulumi destroy *)
Bash(kubectl delete *)
Bash(helm delete *)
Bash(helm uninstall *)
Bash(aws * delete*)
Bash(aws s3 rb *)
Bash(gcloud * delete *)
Bash(az * delete *)
```

## Asks

```
Bash(terraform apply *)   # without -auto-approve
```

## State files

Never commit `*.tfstate`. Treat as secret-equivalent.

## CDK / Pulumi

Same plan-before-apply pattern. CDK: `cdk diff` → marker. Pulumi: `pulumi preview` → marker.

## Local-only safeguards

CI/CD pipelines may legitimately apply without re-planning (the plan is the artifact). Audit at the developer-machine level, not in CI.
