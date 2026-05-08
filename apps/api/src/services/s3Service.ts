// Presigned S3 helpers. Real impl uses @aws-sdk/s3-request-presigner;
// stub impl (S3_USE_STUB=1) returns deterministic fake URLs so tests
// can run without LocalStack.

import { S3Client, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../config.js";

const useStub = process.env.S3_USE_STUB === "1";

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: config.awsRegion,
      endpoint: config.s3Endpoint,
      forcePathStyle: config.s3ForcePathStyle,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local",
      },
    });
  }
  return client;
}

export async function getPresignedPutUrl(
  s3Key: string,
  mimeType: string,
  sizeBytes: number,
  expiresIn = 300,
): Promise<string> {
  if (useStub) {
    return `http://stub.local/${config.s3Bucket}/${s3Key}?op=put&exp=${expiresIn}`;
  }
  if (sizeBytes < 1 || sizeBytes > 52_428_800) {
    throw new Error(`sizeBytes must be 1–52428800 (got ${sizeBytes})`);
  }
  const command = new PutObjectCommand({
    Bucket: config.s3Bucket,
    Key: s3Key,
    ContentType: mimeType,
    ContentLength: sizeBytes,
  });
  return await getSignedUrl(getClient(), command, { expiresIn });
}

export async function getPresignedGetUrl(s3Key: string, expiresIn = 120): Promise<string> {
  if (useStub) {
    return `http://stub.local/${config.s3Bucket}/${s3Key}?op=get&exp=${expiresIn}`;
  }
  const command = new GetObjectCommand({
    Bucket: config.s3Bucket,
    Key: s3Key,
  });
  return await getSignedUrl(getClient(), command, { expiresIn });
}

export async function deleteObject(s3Key: string): Promise<void> {
  if (useStub) return;
  await getClient().send(new DeleteObjectCommand({ Bucket: config.s3Bucket, Key: s3Key }));
}
