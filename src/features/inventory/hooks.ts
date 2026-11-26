import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRecord, deleteRecord, listAll, updateRecord } from "./api";
import { getActiveLocale } from "../../lib/i18n/dictionary";
import { recordMovement } from "./stock";
import type { MovementRequest } from "./stock";
import type { InventorySchema, Product, StockLevel } from "./types";

const key = (schema: InventorySchema) => ["inventory", schema] as const;

export function useRecords<S extends InventorySchema>(schema: S) {
  return useQuery({ queryFn: () => listAll(schema), queryKey: key(schema) });
}

export function useRecordMutations(schema: InventorySchema) {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: key(schema) });

  return {
    create: useMutation({ mutationFn: (input: Record<string, unknown>) => createRecord(schema, input), onSuccess }),
    remove: useMutation({ mutationFn: (id: string) => deleteRecord(schema, id), onSuccess }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => updateRecord(schema, id, input),
      onSuccess
    })
  };
}

export function useRecordMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: MovementRequest) => recordMovement(request),
    onSettled: () => {
      // Settled, not success: a transfer can fail halfway, after the first leg was written.
      void queryClient.invalidateQueries({ queryKey: key("StockLevel") });
      void queryClient.invalidateQueries({ queryKey: key("StockMovement") });
    }
  });
}

export function byId<T extends { id: string }>(rows: T[] | undefined): Map<string, T> {
  return new Map((rows ?? []).map((row) => [row.id, row]));
}

export function onHandByProduct(levels: StockLevel[] | undefined): Map<string, number> {
  const totals = new Map<string, number>();
  for (const level of levels ?? []) totals.set(level.productId, (totals.get(level.productId) ?? 0) + (level.quantity ?? 0));
  return totals;
}

export function isLowStock(product: Product, onHand: number): boolean {
  return (product.reorderLevel ?? 0) > 0 && onHand <= (product.reorderLevel ?? 0);
}

export function formatQty(value: number | undefined): string {
  return (value ?? 0).toLocaleString(getActiveLocale(), { maximumFractionDigits: 3 });
}

export function formatMoney(value: number | undefined): string {
  return (value ?? 0).toLocaleString(getActiveLocale(), { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}
