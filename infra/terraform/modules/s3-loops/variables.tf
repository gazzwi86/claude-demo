variable "bucket_name" {
  description = "Bucket holding loop audio + metadata."
  type        = string
}

variable "web_origin" {
  description = "Origin allowed in the CORS policy."
  type        = string
}
