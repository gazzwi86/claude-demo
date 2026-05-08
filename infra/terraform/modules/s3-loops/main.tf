resource "aws_s3_bucket" "loops" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_public_access_block" "loops" {
  bucket = aws_s3_bucket.loops.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "loops" {
  bucket = aws_s3_bucket.loops.id

  cors_rule {
    allowed_origins = [var.web_origin]
    allowed_methods = ["GET", "PUT", "HEAD"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_versioning" "loops" {
  bucket = aws_s3_bucket.loops.id

  versioning_configuration {
    status = "Suspended"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "loops" {
  bucket = aws_s3_bucket.loops.id

  rule {
    id     = "expire-incomplete-multipart-uploads"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}
