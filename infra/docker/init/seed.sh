#!/bin/sh
# Idempotent: creates DynamoDB tables + S3 bucket, uploads bundled samples.
set -eu

DDB="--endpoint-url=http://dynamodb-local:8000"
S3="--endpoint-url=http://localstack:4566"
BUCKET="${S3_BUCKET:-looper-loops-dev}"

echo "[seed] creating DynamoDB tables (idempotent)"

create_table() {
  name="$1"
  schema="$2"
  if aws $DDB dynamodb describe-table --table-name "$name" >/dev/null 2>&1; then
    echo "  - $name already exists"
    return
  fi
  echo "  - creating $name"
  # shellcheck disable=SC2086
  aws $DDB dynamodb create-table \
    --table-name "$name" \
    --billing-mode PAY_PER_REQUEST \
    $schema >/dev/null
}

create_table looper_users '
  --attribute-definitions AttributeName=pk,AttributeType=S AttributeName=sk,AttributeType=S AttributeName=gsi_email_pk,AttributeType=S
  --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE
  --global-secondary-indexes [{"IndexName":"gsi_email","KeySchema":[{"AttributeName":"gsi_email_pk","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]
'

create_table looper_loops '
  --attribute-definitions AttributeName=pk,AttributeType=S AttributeName=sk,AttributeType=S AttributeName=gsi_public_pk,AttributeType=S AttributeName=createdAt,AttributeType=S
  --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE
  --global-secondary-indexes [{"IndexName":"gsi_public","KeySchema":[{"AttributeName":"gsi_public_pk","KeyType":"HASH"},{"AttributeName":"createdAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]
'

create_table looper_sessions '
  --attribute-definitions AttributeName=pk,AttributeType=S AttributeName=sk,AttributeType=S
  --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE
'

echo "[seed] creating S3 bucket $BUCKET (idempotent)"
if ! aws $S3 s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  aws $S3 s3api create-bucket --bucket "$BUCKET" >/dev/null
  echo "  - bucket created"
else
  echo "  - bucket already exists"
fi

aws $S3 s3api put-bucket-cors --bucket "$BUCKET" --cors-configuration '{
  "CORSRules":[{
    "AllowedOrigins":["http://localhost:3000"],
    "AllowedMethods":["GET","PUT","HEAD"],
    "AllowedHeaders":["*"],
    "ExposeHeaders":["ETag"],
    "MaxAgeSeconds":3000
  }]
}' >/dev/null

echo "[seed] uploading bundled samples (if present)"
if [ -d /samples ] && [ "$(ls -A /samples 2>/dev/null | grep -E '\.(webm|ogg|wav|mp3)$' | head -1)" ]; then
  for f in /samples/*.webm /samples/*.ogg /samples/*.wav /samples/*.mp3; do
    [ -f "$f" ] || continue
    fname=$(basename "$f")
    aws $S3 s3 cp "$f" "s3://$BUCKET/samples/$fname" >/dev/null
    echo "  - uploaded samples/$fname"
  done
else
  echo "  - no samples found in /samples; skipping"
fi

echo "[seed] done"
