output "table_names" {
  value = {
    users    = aws_dynamodb_table.users.name
    loops    = aws_dynamodb_table.loops.name
    sessions = aws_dynamodb_table.sessions.name
  }
}

output "table_arns" {
  value = {
    users    = aws_dynamodb_table.users.arn
    loops    = aws_dynamodb_table.loops.arn
    sessions = aws_dynamodb_table.sessions.arn
  }
}

output "index_arns" {
  description = "GSI ARNs (used in IAM policies that scope dynamodb:Query to a specific index)."
  value = {
    users_email = "${aws_dynamodb_table.users.arn}/index/gsi_email"
    loops_public = "${aws_dynamodb_table.loops.arn}/index/gsi_public"
  }
}
