// User table wrappers. Single-table pattern:
//   pk = "USER#<userId>", sk = "PROFILE", gsi_email_pk = "EMAIL#<email>"
// Email lookup via gsi_email GSI keyed on gsi_email_pk.

import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { storage, ConditionFailed } from "./storage.js";
import { DuplicateEmailError } from "../errors.js";

export interface UserRow {
  pk: string;
  sk: "PROFILE";
  gsi_email_pk: string;
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  displayName: string;
  passwordHash: string;
}

const TABLE = config.tables.users;

export function userKey(id: string): { pk: string; sk: "PROFILE" } {
  return { pk: `USER#${id}`, sk: "PROFILE" };
}

export async function createUser(input: CreateUserInput): Promise<UserRow> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const row: UserRow = {
    pk: `USER#${id}`,
    sk: "PROFILE",
    gsi_email_pk: `EMAIL#${input.email}`,
    id,
    email: input.email,
    displayName: input.displayName,
    passwordHash: input.passwordHash,
    createdAt: now,
  };
  try {
    await storage.put(TABLE, row as unknown as Record<string, unknown>, {
      unique: { attribute: "gsi_email_pk" },
    });
  } catch (err) {
    if (err instanceof ConditionFailed) throw new DuplicateEmailError();
    throw err;
  }
  return row;
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const item = await storage.get(TABLE, userKey(id));
  return (item as UserRow | null) ?? null;
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const items = await storage.queryByGsi(
    TABLE,
    "gsi_email",
    "gsi_email_pk",
    `EMAIL#${email}`,
    { limit: 1 },
  );
  return (items[0] as UserRow | undefined) ?? null;
}

/** Test helper. Truncates the users table. */
export async function _truncateUsers(): Promise<void> {
  await storage.truncate(TABLE);
}
