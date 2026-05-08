resource "aws_cloudfront_origin_access_control" "loops" {
  count = var.enabled ? 1 : 0

  name                              = "${var.bucket_id}-oac"
  description                       = "OAC for the loops bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "loops" {
  count = var.enabled ? 1 : 0

  enabled             = true
  default_root_object = ""
  comment             = "Looper loops CDN"
  price_class         = "PriceClass_100"

  origin {
    domain_name              = var.bucket_regional_domain
    origin_id                = "loops-bucket"
    origin_access_control_id = aws_cloudfront_origin_access_control.loops[0].id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "loops-bucket"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
