variable "role_name" {
  description = "IAM role name to create."
  type        = string
}

variable "bucket_arn" {
  description = "S3 bucket ARN — the role gets Get/Put/Delete on objects within."
  type        = string
}

variable "table_arns" {
  description = "Map of DynamoDB table name -> ARN. The role gets CRUD on each."
  type        = map(string)
}

variable "index_arns" {
  description = "Map of index name -> ARN. The role gets Query on each."
  type        = map(string)
}
