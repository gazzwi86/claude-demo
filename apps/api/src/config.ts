function required(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() ? value : fallback;
}

export const config = {
  port: Number.parseInt(optional("API_PORT", "3001"), 10),
  webOrigin: optional("WEB_ORIGIN", "http://localhost:3000"),
  jwtSecret: required("JWT_SECRET"),
  awsRegion: optional("AWS_REGION", "us-east-1"),
  dynamodbEndpoint: optional("DYNAMODB_ENDPOINT", "http://localhost:8000"),
  s3Endpoint: optional("S3_ENDPOINT", "http://localhost:4566"),
  s3Bucket: optional("S3_BUCKET", "looper-loops-dev"),
  s3ForcePathStyle: optional("S3_FORCE_PATH_STYLE", "true") === "true",
  tables: {
    users: optional("DDB_USERS_TABLE", "looper_users"),
    loops: optional("DDB_LOOPS_TABLE", "looper_loops"),
    sessions: optional("DDB_SESSIONS_TABLE", "looper_sessions"),
  },
  isProd: process.env.NODE_ENV === "production",
} as const;

export type Config = typeof config;
