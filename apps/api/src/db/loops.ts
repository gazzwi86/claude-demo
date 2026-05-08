// Loop table wrappers. Single-table pattern:
//   pk = "USER#<userId>", sk = "LOOP#<loopId>"
// Public loops also set gsi_public_pk = "PUBLIC#1" so listPublicLoops can
// query the gsi_public GSI ordered by createdAt.

import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { storage } from "./storage.js";
import { NotFoundError } from "../errors.js";
import type { LoopMeta } from "@looper/shared";

export interface LoopRow extends LoopMeta {
  pk: string;
  sk: string;
  gsi_public_pk?: string;
}

const TABLE = config.tables.loops;

export interface NewLoopInput {
  ownerId: string;
  name: string;
  durationMs: number;
  sampleRate: number;
  bpm: number | null;
  mimeType: string;
  sizeBytes: number;
}

export function loopKey(ownerId: string, loopId: string): { pk: string; sk: string } {
  return { pk: `USER#${ownerId}`, sk: `LOOP#${loopId}` };
}

export function s3KeyFor(ownerId: string, loopId: string, mimeType: string): string {
  const ext = mimeType === "audio/webm" ? "webm" : mimeType.split("/")[1] || "bin";
  return `users/${ownerId}/loops/${loopId}.${ext}`;
}

export async function createLoop(input: NewLoopInput): Promise<LoopRow> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const row: LoopRow = {
    pk: `USER#${input.ownerId}`,
    sk: `LOOP#${id}`,
    id,
    ownerId: input.ownerId,
    name: input.name,
    s3Key: s3KeyFor(input.ownerId, id, input.mimeType),
    durationMs: input.durationMs,
    sampleRate: input.sampleRate,
    bpm: input.bpm,
    isPublic: false,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    createdAt: now,
    updatedAt: now,
  };
  await storage.put(TABLE, row as unknown as Record<string, unknown>);
  return row;
}

export async function getLoop(ownerId: string, loopId: string): Promise<LoopRow | null> {
  const item = await storage.get(TABLE, loopKey(ownerId, loopId));
  return (item as LoopRow | null) ?? null;
}

export async function getLoopOrThrow(ownerId: string, loopId: string): Promise<LoopRow> {
  const row = await getLoop(ownerId, loopId);
  if (!row) throw new NotFoundError("Loop not found");
  return row;
}

export async function listUserLoops(ownerId: string, limit = 50): Promise<LoopRow[]> {
  const items = await storage.queryByPartition(TABLE, `USER#${ownerId}`, {
    skBeginsWith: "LOOP#",
    limit,
    sort: "desc",
  });
  return items as unknown as LoopRow[];
}

export async function listPublicLoops(limit = 50): Promise<LoopRow[]> {
  const items = await storage.queryByGsi(
    TABLE,
    "gsi_public",
    "gsi_public_pk",
    "PUBLIC#1",
    { limit, sort: "desc" },
  );
  return items as unknown as LoopRow[];
}

export async function updateLoop(
  ownerId: string,
  loopId: string,
  updates: { name?: string; bpm?: number | null; isPublic?: boolean },
): Promise<LoopRow> {
  const next: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (updates.name !== undefined) next.name = updates.name;
  if (updates.bpm !== undefined) next.bpm = updates.bpm;
  if (updates.isPublic !== undefined) {
    next.isPublic = updates.isPublic;
    if (updates.isPublic) next.gsi_public_pk = "PUBLIC#1";
    else next.gsi_public_pk = undefined; // intentionally unset
  }
  // Prune undefined to avoid DynamoDB SET errors.
  const cleaned = Object.fromEntries(
    Object.entries(next).filter(([, v]) => v !== undefined),
  );
  const updated = await storage.update(TABLE, loopKey(ownerId, loopId), cleaned);
  return updated as unknown as LoopRow;
}

export async function deleteLoop(ownerId: string, loopId: string): Promise<void> {
  await storage.delete(TABLE, loopKey(ownerId, loopId));
}

/** Test helper. Truncates the loops table. */
export async function _truncateLoops(): Promise<void> {
  await storage.truncate(TABLE);
}
