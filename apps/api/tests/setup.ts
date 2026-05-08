// Vitest globalSetup. Runs once before any test file.
// Forces the in-process DynamoDB / S3 stubs and a tiny bcrypt cost so
// tests run without Docker and don't take seconds to hash passwords.

process.env.DDB_USE_STUB = process.env.DDB_USE_STUB ?? "1";
process.env.S3_USE_STUB = process.env.S3_USE_STUB ?? "1";
process.env.BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS ?? "4";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret-not-for-production-use-only-in-vitest";
process.env.SILENT = process.env.SILENT ?? "1";
