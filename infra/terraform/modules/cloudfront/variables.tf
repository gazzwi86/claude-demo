variable "enabled" {
  description = "Set to true to provision the distribution. Off by default."
  type        = bool
  default     = false
}

variable "bucket_regional_domain" {
  description = "Regional domain of the S3 bucket origin."
  type        = string
}

variable "bucket_id" {
  description = "Bucket id (used to namespace the OAC)."
  type        = string
}
