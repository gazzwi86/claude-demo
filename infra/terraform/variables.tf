variable "env_name" {
  description = "Environment name (dev / staging / prod). Pinned into resource tags + table prefix."
  type        = string
  default     = "dev"
}

variable "region" {
  description = "AWS region."
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "S3 bucket holding loop audio + metadata."
  type        = string
  default     = "looper-loops-dev"
}

variable "web_origin" {
  description = "Origin allowed by the bucket's CORS policy (the web app's URL)."
  type        = string
  default     = "http://localhost:3000"
}

variable "table_prefix" {
  description = "Prefix for DynamoDB table names. Three tables: <prefix>users, <prefix>loops, <prefix>sessions."
  type        = string
  default     = "looper_"
}

variable "enable_cdn" {
  description = "If true, the cloudfront module creates a distribution in front of the bucket. Off by default — most demos don't need a CDN."
  type        = bool
  default     = false
}
