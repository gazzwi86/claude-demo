output "bucket_name" {
  description = "S3 bucket holding loop audio + metadata."
  value       = module.loops_bucket.bucket_name
}

output "table_names" {
  description = "Map of role -> DynamoDB table name."
  value       = module.tables.table_names
}

output "role_arn" {
  description = "IAM role ARN that the app process should assume."
  value       = module.app_role.role_arn
}

output "cdn_domain_name" {
  description = "CloudFront domain (only set when enable_cdn = true)."
  value       = module.cdn.domain_name
}
