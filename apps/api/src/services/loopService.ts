// Orchestrates the loops table + S3 presigned URLs into the shapes the
// HTTP routes return.

import { ForbiddenError, NotFoundError } from "../errors.js";
import {
  createLoop,
  deleteLoop,
  getLoopOrThrow,
  listPublicLoops,
  listUserLoops,
  updateLoop,
  type LoopRow,
  type NewLoopInput,
} from "../db/loops.js";
import { deleteObject, getPresignedGetUrl, getPresignedPutUrl } from "./s3Service.js";
import type { CreateLoop, LoopMeta, UpdateLoop } from "@looper/shared";

export interface CreateLoopResult {
  loop: LoopMeta;
  uploadUrl: string;
}

export async function createLoopWithUploadUrl(
  ownerId: string,
  input: CreateLoop,
): Promise<CreateLoopResult> {
  const params: NewLoopInput = {
    ownerId,
    name: input.name,
    durationMs: input.durationMs,
    sampleRate: input.sampleRate,
    bpm: input.bpm ?? null,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
  };
  const row = await createLoop(params);
  const uploadUrl = await getPresignedPutUrl(row.s3Key, row.mimeType, row.sizeBytes);
  return { loop: rowToPublic(row), uploadUrl };
}

export async function listLoopsForUser(ownerId: string): Promise<LoopMeta[]> {
  const rows = await listUserLoops(ownerId);
  return rows.map(rowToPublic);
}

export async function listPublicLoopsView(): Promise<LoopMeta[]> {
  const rows = await listPublicLoops();
  return rows.map(rowToPublic);
}

export async function getLoopForViewer(
  viewerId: string,
  ownerId: string,
  loopId: string,
): Promise<LoopMeta> {
  const row = await getLoopOrThrow(ownerId, loopId);
  if (row.ownerId !== viewerId && !row.isPublic) {
    throw new ForbiddenError("This loop is private.");
  }
  return rowToPublic(row);
}

export async function getLoopWithDownloadUrl(
  viewerId: string,
  loopId: string,
): Promise<{ loop: LoopMeta; downloadUrl: string }> {
  const row = await getLoopOrThrow(viewerId, loopId);
  const downloadUrl = await getPresignedGetUrl(row.s3Key);
  return { loop: rowToPublic(row), downloadUrl };
}

export async function updateLoopMeta(
  ownerId: string,
  loopId: string,
  patch: UpdateLoop,
): Promise<LoopMeta> {
  await getLoopOrThrow(ownerId, loopId);
  const updated = await updateLoop(ownerId, loopId, patch);
  return rowToPublic(updated);
}

export async function deleteLoopAndObject(ownerId: string, loopId: string): Promise<void> {
  let row: LoopRow;
  try {
    row = await getLoopOrThrow(ownerId, loopId);
  } catch (err) {
    if (err instanceof NotFoundError) return; // delete is idempotent
    throw err;
  }
  await deleteLoop(ownerId, loopId);
  await deleteObject(row.s3Key);
}

function rowToPublic(row: LoopRow): LoopMeta {
  const { pk: _pk, sk: _sk, gsi_public_pk: _gsi, ...rest } = row;
  void _pk;
  void _sk;
  void _gsi;
  return rest;
}
