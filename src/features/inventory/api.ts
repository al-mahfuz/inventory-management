import { blocksClient } from "../../lib/blocks/client";
import type { InventorySchema, SchemaRecord } from "./types";

// GraphQL selection per schema. Mirrors blocks/data/schemas/*.json -- keep them in step.
const FIELDS: { [K in InventorySchema]: string[] } = {
  Category: ["name", "code", "description", "isActive"],
  Product: ["sku", "name", "description", "barcode", "categoryId", "supplierId", "unit", "costPrice", "sellingPrice", "reorderLevel", "isActive"],
  StockLevel: ["productId", "warehouseId", "quantity"],
  StockMovement: ["productId", "warehouseId", "movementType", "quantity", "balanceAfter", "unitCost", "reference", "note", "movementDate", "CreatedDate"],
  Supplier: ["name", "contactName", "email", "phone", "address", "isActive"],
  Warehouse: ["name", "code", "address", "isActive"]
};

const PAGE_SIZE = 200;
const MAX_PAGES = 50;

type GatewayPage = { items?: Array<Record<string, unknown>>; hasNextPage?: boolean };
type GatewayResponse = { data?: Record<string, GatewayPage | MutationResult | undefined>; errors?: Array<{ message?: string }> };
type MutationResult = { acknowledged?: boolean; itemId?: string; message?: string };

function collection(schema: InventorySchema) {
  return blocksClient.data.collection(schema, { fields: FIELDS[schema] });
}

// The gateway answers GraphQL errors with HTTP 200, so they have to be surfaced by hand.
function unwrap(response: unknown, field: string) {
  const body = response as GatewayResponse;
  if (body?.errors?.length) {
    throw new Error(body.errors.map((error) => error.message ?? "Data Gateway error").join("; "));
  }
  return body?.data?.[field];
}

function toRecord<S extends InventorySchema>(raw: Record<string, unknown>): SchemaRecord<S> {
  const { ItemId, ...rest } = raw;
  return { ...rest, id: String(ItemId) } as unknown as SchemaRecord<S>;
}

/** Reads every record of a schema, page by page. Fine for small catalogues; switch to server paging as data grows. */
export async function listAll<S extends InventorySchema>(schema: S, filter?: Record<string, unknown>): Promise<SchemaRecord<S>[]> {
  const records: SchemaRecord<S>[] = [];
  for (let pageNo = 1; pageNo <= MAX_PAGES; pageNo += 1) {
    const page = unwrap(await collection(schema).list({ filter, pageNo, pageSize: PAGE_SIZE }), `get${schema}s`) as GatewayPage | undefined;
    records.push(...(page?.items ?? []).map((item) => toRecord<S>(item)));
    if (!page?.hasNextPage) break;
  }
  return records;
}

function checkMutation(response: unknown, field: string): string | undefined {
  const result = unwrap(response, field) as MutationResult | undefined;
  if (result && result.acknowledged === false) throw new Error(result.message || `${field} was not acknowledged`);
  return result?.itemId;
}

export async function createRecord<S extends InventorySchema>(schema: S, input: Record<string, unknown>) {
  return checkMutation(await collection(schema).create(input), `insert${schema}`);
}

export async function updateRecord<S extends InventorySchema>(schema: S, id: string, input: Record<string, unknown>) {
  const { id: _ignored, CreatedDate: _created, ...payload } = input;
  return checkMutation(await collection(schema).update(id, payload), `update${schema}`);
}

export async function deleteRecord(schema: InventorySchema, id: string) {
  return checkMutation(await collection(schema).delete(id), `delete${schema}`);
}
