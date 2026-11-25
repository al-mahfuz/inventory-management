import { createRecord, listAll, updateRecord } from "./api";
import type { MovementType, StockLevel } from "./types";

export type MovementKind = "IN" | "OUT" | "ADJUSTMENT" | "TRANSFER";

export type MovementRequest = {
  kind: MovementKind;
  productId: string;
  warehouseId: string;
  /** Destination warehouse, TRANSFER only. */
  toWarehouseId?: string;
  /** Units moved. For ADJUSTMENT this is the counted on-hand quantity, not a delta. */
  quantity: number;
  unitCost?: number;
  reference?: string;
  note?: string;
};

async function findLevel(productId: string, warehouseId: string): Promise<StockLevel | undefined> {
  const [level] = await listAll("StockLevel", { productId, warehouseId });
  return level;
}

async function applyDelta(
  request: MovementRequest,
  warehouseId: string,
  movementType: MovementType,
  delta: number,
  level: StockLevel | undefined
) {
  const current = level?.quantity ?? 0;
  const next = current + delta;
  if (next < 0) throw new Error(`Not enough stock: ${current} on hand, ${-delta} requested.`);

  if (level) await updateRecord("StockLevel", level.id, { quantity: next });
  else await createRecord("StockLevel", { productId: request.productId, quantity: next, warehouseId });

  await createRecord("StockMovement", {
    balanceAfter: next,
    movementDate: new Date().toISOString(),
    movementType,
    note: request.note ?? "",
    productId: request.productId,
    quantity: delta,
    reference: request.reference ?? "",
    unitCost: request.unitCost ?? 0,
    warehouseId
  });
}

/**
 * Records a stock movement and updates the on-hand quantity it affects.
 *
 * This runs in the browser as separate Data Gateway calls, so two people moving
 * the same product in the same warehouse at the same moment can overwrite each
 * other's StockLevel. Move this into a Blocks function when that matters.
 */
export async function recordMovement(request: MovementRequest) {
  if (!Number.isFinite(request.quantity) || request.quantity < 0) throw new Error("Quantity must be zero or more.");
  if (request.kind !== "ADJUSTMENT" && request.quantity === 0) throw new Error("Quantity must be more than zero.");

  const source = await findLevel(request.productId, request.warehouseId);

  switch (request.kind) {
    case "IN":
      return applyDelta(request, request.warehouseId, "IN", request.quantity, source);
    case "OUT":
      return applyDelta(request, request.warehouseId, "OUT", -request.quantity, source);
    case "ADJUSTMENT": {
      const delta = request.quantity - (source?.quantity ?? 0);
      if (delta === 0) throw new Error("Counted quantity matches stock on hand; nothing to adjust.");
      return applyDelta(request, request.warehouseId, "ADJUSTMENT", delta, source);
    }
    case "TRANSFER": {
      const to = request.toWarehouseId;
      if (!to || to === request.warehouseId) throw new Error("Pick a different destination warehouse.");
      if ((source?.quantity ?? 0) < request.quantity) {
        throw new Error(`Not enough stock: ${source?.quantity ?? 0} on hand, ${request.quantity} requested.`);
      }
      await applyDelta(request, request.warehouseId, "TRANSFER_OUT", -request.quantity, source);
      return applyDelta(request, to, "TRANSFER_IN", request.quantity, await findLevel(request.productId, to));
    }
  }
}
