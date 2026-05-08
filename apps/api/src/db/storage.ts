// Tiny storage abstraction over DynamoDB. Two implementations:
// (1) real — DynamoDBDocumentClient against DynamoDB Local or AWS;
// (2) stub — in-process Map keyed by `${pk}|${sk}` per table.
//
// Selected once at module load via the DDB_USE_STUB env var so tests
// can run without Docker.

import {
  DynamoDBClient,
  ScanCommand as RawScanCommand,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { config } from "../config.js";

export type Item = Record<string, unknown>;

export interface Storage {
  put(table: string, item: Item, opts?: { unique?: { attribute: string } }): Promise<void>;
  get(table: string, key: { pk: string; sk: string }): Promise<Item | null>;
  queryByGsi(
    table: string,
    indexName: string,
    keyAttr: string,
    keyValue: string,
    opts?: { limit?: number; sort?: "asc" | "desc" },
  ): Promise<Item[]>;
  queryByPartition(
    table: string,
    pk: string,
    opts?: { skBeginsWith?: string; limit?: number; sort?: "asc" | "desc" },
  ): Promise<Item[]>;
  update(table: string, key: { pk: string; sk: string }, attrs: Item): Promise<Item>;
  delete(table: string, key: { pk: string; sk: string }): Promise<void>;
  /** Test/dev helper. Not used by production code paths. */
  scanAll(table: string): Promise<Item[]>;
  /** Test/dev helper. Truncates a table. */
  truncate(table: string): Promise<void>;
}

function createDdbStorage(): Storage {
  const client = new DynamoDBClient({
    region: config.awsRegion,
    endpoint: config.dynamodbEndpoint,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local",
    },
  });
  const ddb = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });

  return {
    async put(table, item, opts) {
      const command = new PutCommand({
        TableName: table,
        Item: item,
        ConditionExpression: opts?.unique
          ? "attribute_not_exists(#u)"
          : undefined,
        ExpressionAttributeNames: opts?.unique ? { "#u": opts.unique.attribute } : undefined,
      });
      try {
        await ddb.send(command);
      } catch (err) {
        const name = (err as { name?: string }).name ?? "";
        if (name === "ConditionalCheckFailedException") {
          throw new ConditionFailed();
        }
        throw err;
      }
    },
    async get(table, key) {
      const out = await ddb.send(new GetCommand({ TableName: table, Key: key }));
      return (out.Item as Item | undefined) ?? null;
    },
    async queryByGsi(table, indexName, keyAttr, keyValue, opts) {
      const out = await ddb.send(
        new QueryCommand({
          TableName: table,
          IndexName: indexName,
          KeyConditionExpression: "#k = :v",
          ExpressionAttributeNames: { "#k": keyAttr },
          ExpressionAttributeValues: { ":v": keyValue },
          Limit: opts?.limit,
          ScanIndexForward: opts?.sort !== "desc",
        }),
      );
      return (out.Items as Item[] | undefined) ?? [];
    },
    async queryByPartition(table, pk, opts) {
      const expr: { name: string; value: string }[] = [{ name: "pk", value: pk }];
      let cond = "#pk = :pk";
      const exprNames: Record<string, string> = { "#pk": "pk" };
      const exprValues: Record<string, string> = { ":pk": pk };
      if (opts?.skBeginsWith) {
        cond += " AND begins_with(#sk, :skp)";
        exprNames["#sk"] = "sk";
        exprValues[":skp"] = opts.skBeginsWith;
      }
      void expr;
      const out = await ddb.send(
        new QueryCommand({
          TableName: table,
          KeyConditionExpression: cond,
          ExpressionAttributeNames: exprNames,
          ExpressionAttributeValues: exprValues,
          Limit: opts?.limit,
          ScanIndexForward: opts?.sort !== "desc",
        }),
      );
      return (out.Items as Item[] | undefined) ?? [];
    },
    async update(table, key, attrs) {
      const entries = Object.entries(attrs);
      if (entries.length === 0) {
        const got = await this.get(table, key);
        if (!got) throw new NotFoundInStore();
        return got;
      }
      const sets = entries.map(([k], i) => `#a${i} = :v${i}`).join(", ");
      const exprNames = Object.fromEntries(entries.map(([k], i) => [`#a${i}`, k]));
      const exprValues = Object.fromEntries(entries.map(([, v], i) => [`:v${i}`, v]));
      const out = await ddb.send(
        new UpdateCommand({
          TableName: table,
          Key: key,
          UpdateExpression: `SET ${sets}`,
          ExpressionAttributeNames: exprNames,
          ExpressionAttributeValues: exprValues,
          ReturnValues: "ALL_NEW",
          ConditionExpression: "attribute_exists(pk)",
        }),
      );
      return (out.Attributes as Item | undefined) ?? {};
    },
    async delete(table, key) {
      await ddb.send(new DeleteCommand({ TableName: table, Key: key }));
    },
    async scanAll(table) {
      const out = await ddb.send(new ScanCommand({ TableName: table }));
      return (out.Items as Item[] | undefined) ?? [];
    },
    async truncate(table) {
      const items = await this.scanAll(table);
      for (const item of items) {
        const pk = String(item.pk ?? "");
        const sk = String(item.sk ?? "");
        if (pk && sk) await this.delete(table, { pk, sk });
      }
      void RawScanCommand;
    },
  };
}

function createStubStorage(): Storage {
  // table -> Map<"pk|sk", Item>
  const tables = new Map<string, Map<string, Item>>();
  const tableOf = (name: string) => {
    let t = tables.get(name);
    if (!t) {
      t = new Map();
      tables.set(name, t);
    }
    return t;
  };
  const compositeKey = (pk: unknown, sk: unknown) => `${String(pk)}|${String(sk)}`;

  return {
    async put(table, item, opts) {
      const t = tableOf(table);
      if (opts?.unique) {
        const attr = opts.unique.attribute;
        const value = item[attr];
        if (value !== undefined) {
          for (const existing of t.values()) {
            if (existing[attr] === value) {
              const sameKey =
                existing.pk === item.pk && existing.sk === item.sk;
              if (!sameKey) throw new ConditionFailed();
            }
          }
        }
      }
      t.set(compositeKey(item.pk, item.sk), { ...item });
    },
    async get(table, key) {
      const v = tableOf(table).get(compositeKey(key.pk, key.sk));
      return v ? { ...v } : null;
    },
    async queryByGsi(table, _indexName, keyAttr, keyValue, opts) {
      const items = Array.from(tableOf(table).values()).filter(
        (i) => i[keyAttr] === keyValue,
      );
      const sorted = items.sort((a, b) => {
        const av = String(a.createdAt ?? "");
        const bv = String(b.createdAt ?? "");
        return opts?.sort === "desc" ? bv.localeCompare(av) : av.localeCompare(bv);
      });
      return opts?.limit ? sorted.slice(0, opts.limit) : sorted;
    },
    async queryByPartition(table, pk, opts) {
      const all = Array.from(tableOf(table).values()).filter((i) => i.pk === pk);
      const filtered = opts?.skBeginsWith
        ? all.filter((i) => String(i.sk ?? "").startsWith(opts.skBeginsWith!))
        : all;
      const sorted = filtered.sort((a, b) => {
        const av = String(a.sk ?? "");
        const bv = String(b.sk ?? "");
        return opts?.sort === "desc" ? bv.localeCompare(av) : av.localeCompare(bv);
      });
      return opts?.limit ? sorted.slice(0, opts.limit) : sorted;
    },
    async update(table, key, attrs) {
      const t = tableOf(table);
      const k = compositeKey(key.pk, key.sk);
      const existing = t.get(k);
      if (!existing) throw new NotFoundInStore();
      const next = { ...existing, ...attrs };
      t.set(k, next);
      return { ...next };
    },
    async delete(table, key) {
      tableOf(table).delete(compositeKey(key.pk, key.sk));
    },
    async scanAll(table) {
      return Array.from(tableOf(table).values()).map((i) => ({ ...i }));
    },
    async truncate(table) {
      tableOf(table).clear();
    },
  };
}

export class ConditionFailed extends Error {
  constructor() {
    super("Condition failed (item already exists)");
    this.name = "ConditionFailed";
  }
}

export class NotFoundInStore extends Error {
  constructor() {
    super("Item not found");
    this.name = "NotFoundInStore";
  }
}

const useStub = process.env.DDB_USE_STUB === "1";
export const storage: Storage = useStub ? createStubStorage() : createDdbStorage();
export const isStubStorage = useStub;
