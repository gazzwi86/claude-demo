module "loops_bucket" {
  source = "./modules/s3-loops"

  bucket_name = var.bucket_name
  web_origin  = var.web_origin
}

module "tables" {
  source = "./modules/dynamodb"

  table_prefix = var.table_prefix
}

module "app_role" {
  source = "./modules/iam"

  role_name   = "${var.env_name}-looper-app"
  bucket_arn  = module.loops_bucket.bucket_arn
  table_arns  = module.tables.table_arns
  index_arns  = module.tables.index_arns
}

module "cdn" {
  source = "./modules/cloudfront"

  enabled               = var.enable_cdn
  bucket_regional_domain = module.loops_bucket.bucket_regional_domain
  bucket_id             = module.loops_bucket.bucket_id
}
