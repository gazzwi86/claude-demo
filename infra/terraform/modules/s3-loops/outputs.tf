output "bucket_name" {
  value = aws_s3_bucket.loops.bucket
}

output "bucket_id" {
  value = aws_s3_bucket.loops.id
}

output "bucket_arn" {
  value = aws_s3_bucket.loops.arn
}

output "bucket_regional_domain" {
  value = aws_s3_bucket.loops.bucket_regional_domain_name
}
