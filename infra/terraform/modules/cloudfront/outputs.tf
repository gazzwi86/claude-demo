output "domain_name" {
  description = "CloudFront distribution domain. Empty when the module is disabled."
  value       = try(aws_cloudfront_distribution.loops[0].domain_name, "")
}
