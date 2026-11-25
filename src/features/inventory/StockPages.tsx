import { ArrowLeftRight, History, PackageCheck, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ActionButton } from "../../shared/ui/ActionButton";
import { Alert } from "../../shared/ui/Alert";
import { DataTable } from "../../shared/ui/DataTable";
import { EmptyState } from "../../shared/ui/EmptyState";
import { ErrorState } from "../../shared/ui/ErrorState";
import { FormField } from "../../shared/ui/FormField";
import { Modal } from "../../shared/ui/Modal";
import { PageHeader } from "../../shared/ui/PageHeader";
import { SelectField } from "../../shared/ui/SelectField";
import { Skeleton } from "../../shared/ui/Skeleton";
import { StatusPill } from "../../shared/ui/StatusPill";
import { byId, formatMoney, formatQty, isLowStock, onHandByProduct, useRecordMovement, useRecords } from "./hooks";
import type { MovementKind } from "./stock";
import { MOVEMENT_TYPES } from "./types";
import type { StockMovement } from "./types";

const KIND_LABELS: Record<MovementKind, string> = {
  ADJUSTMENT: "Adjust (stock count)",
  IN: "Receive (stock in)",
  OUT: "Issue (stock out)",
  TRANSFER: "Transfer between warehouses"
};

function Loading() {
  return <div className="panel"><Skeleton className="skeleton-line-lg" /><Skeleton className="skeleton-line" /><Skeleton className="skeleton-line" /></div>;
}

export function StockPage() {
  const products = useRecords("Product");
  const warehouses = useRecords("Warehouse");
  const levels = useRecords("StockLevel");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const productById = byId(products.data);
  const warehouseById = byId(warehouses.data);
  const totals = onHandByProduct(levels.data);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (levels.data ?? [])
      .filter((level) => !warehouseFilter || level.warehouseId === warehouseFilter)
      .filter((level) => {
        if (!term) return true;
        const product = productById.get(level.productId);
        return `${product?.sku ?? ""} ${product?.name ?? ""}`.toLowerCase().includes(term);
      })
      .sort((a, b) => (productById.get(a.productId)?.name ?? "").localeCompare(productById.get(b.productId)?.name ?? ""));
  }, [levels.data, warehouseFilter, search, productById]);

  const loading = products.isLoading || warehouses.isLoading || levels.isLoading;
  const error = products.error ?? warehouses.error ?? levels.error;

  return (
    <section>
      <PageHeader
        title="Stock"
        subtitle="On-hand quantity per product and warehouse."
        actions={<ActionButton icon={<ArrowLeftRight size={16} />} onClick={() => setFormOpen(true)}>Record movement</ActionButton>}
      />

      <div className="filter-grid">
        <label className="search-box">
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search SKU or name" aria-label="Search stock" />
        </label>
        <SelectField
          label="Warehouse"
          placeholder="All warehouses"
          value={warehouseFilter}
          onChange={(event) => setWarehouseFilter(event.target.value)}
          options={(warehouses.data ?? []).map((w) => ({ label: `${w.code} · ${w.name}`, value: w.id }))}
        />
      </div>

      {loading ? <Loading /> : error ? (
        <ErrorState message={error.message} onRetry={() => { void products.refetch(); void warehouses.refetch(); void levels.refetch(); }} />
      ) : rows.length === 0 ? (
        <EmptyState icon={<PackageCheck size={28} />} title="No stock recorded" description="Receive stock into a warehouse to see it here." />
      ) : (
        <DataTable
          rows={rows}
          columns={[
            { header: "SKU", key: "sku", render: (row) => <span className="mono">{productById.get(row.productId)?.sku ?? "?"}</span> },
            { header: "Product", key: "product", render: (row) => productById.get(row.productId)?.name ?? "Deleted product" },
            { header: "Warehouse", key: "warehouse", render: (row) => warehouseById.get(row.warehouseId)?.name ?? "Deleted warehouse" },
            { header: "On hand", key: "quantity", render: (row) => <strong>{formatQty(row.quantity)} {productById.get(row.productId)?.unit ?? ""}</strong> },
            {
              header: "Status",
              key: "status",
              render: (row) => {
                const product = productById.get(row.productId);
                return product && isLowStock(product, totals.get(row.productId) ?? 0)
                  ? <StatusPill tone="warn">Below reorder level</StatusPill>
                  : <StatusPill tone="good">OK</StatusPill>;
              }
            }
          ]}
        />
      )}

      {formOpen ? <MovementForm onClose={() => setFormOpen(false)} /> : null}
    </section>
  );
}

function MovementForm({ onClose }: { onClose: () => void }) {
  const products = useRecords("Product");
  const warehouses = useRecords("Warehouse");
  const movement = useRecordMovement();
  const [kind, setKind] = useState<MovementKind>("IN");
  const [values, setValues] = useState({ note: "", productId: "", quantity: "", reference: "", toWarehouseId: "", unitCost: "", warehouseId: "" });
  const set = (name: keyof typeof values) => (event: { target: { value: string } }) => setValues({ ...values, [name]: event.target.value });

  const productOptions = (products.data ?? []).filter((p) => p.isActive !== false).map((p) => ({ label: `${p.sku} · ${p.name}`, value: p.id }));
  const warehouseOptions = (warehouses.data ?? []).filter((w) => w.isActive !== false).map((w) => ({ label: `${w.code} · ${w.name}`, value: w.id }));

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await movement.mutateAsync({
        kind,
        note: values.note.trim(),
        productId: values.productId,
        quantity: Number(values.quantity),
        reference: values.reference.trim(),
        toWarehouseId: kind === "TRANSFER" ? values.toWarehouseId : undefined,
        unitCost: values.unitCost === "" ? undefined : Number(values.unitCost),
        warehouseId: values.warehouseId
      });
      onClose();
    } catch {
      // Shown from movement.error below.
    }
  }

  return (
    <Modal title="Record stock movement" onClose={onClose}>
      <form className="form-grid" onSubmit={onSubmit}>
        <div style={{ gridColumn: "1 / -1" }}>
          <SelectField label="Movement" value={kind} onChange={(event) => setKind(event.target.value as MovementKind)} options={(Object.keys(KIND_LABELS) as MovementKind[]).map((value) => ({ label: KIND_LABELS[value], value }))} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <SelectField label="Product" required placeholder="Select a product" value={values.productId} onChange={set("productId")} options={productOptions} />
        </div>
        <SelectField label={kind === "TRANSFER" ? "From warehouse" : "Warehouse"} required placeholder="Select" value={values.warehouseId} onChange={set("warehouseId")} options={warehouseOptions} />
        {kind === "TRANSFER" ? (
          <SelectField label="To warehouse" required placeholder="Select" value={values.toWarehouseId} onChange={set("toWarehouseId")} options={warehouseOptions.filter((o) => o.value !== values.warehouseId)} />
        ) : null}
        <FormField label={kind === "ADJUSTMENT" ? "Counted quantity" : "Quantity"} type="number" min={0} step="any" required value={values.quantity} onChange={set("quantity")} />
        {kind === "IN" ? <FormField label="Unit cost" type="number" min={0} step="any" value={values.unitCost} onChange={set("unitCost")} /> : null}
        <FormField label="Reference" placeholder="PO / invoice / ticket no." value={values.reference} onChange={set("reference")} />
        <FormField label="Note" value={values.note} onChange={set("note")} />
        {movement.error ? <div style={{ gridColumn: "1 / -1" }}><Alert tone="error">{movement.error.message}</Alert></div> : null}
        <div className="form-actions">
          <button type="button" className="icon-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-button" disabled={movement.isPending}>{movement.isPending ? "Saving..." : "Record"}</button>
        </div>
      </form>
    </Modal>
  );
}

const movementDate = (m: StockMovement) => m.movementDate ?? m.CreatedDate ?? "";

export function MovementsPage() {
  const movements = useRecords("StockMovement");
  const products = useRecords("Product");
  const warehouses = useRecords("Warehouse");
  const [typeFilter, setTypeFilter] = useState("");
  const productById = byId(products.data);
  const warehouseById = byId(warehouses.data);

  const rows = useMemo(
    () => (movements.data ?? []).filter((m) => !typeFilter || m.movementType === typeFilter).sort((a, b) => movementDate(b).localeCompare(movementDate(a))),
    [movements.data, typeFilter]
  );

  return (
    <section>
      <PageHeader title="Movements" subtitle="Every stock change, newest first. Entries are never edited — correct mistakes with an adjustment." />
      <div className="filter-grid">
        <SelectField label="Type" placeholder="All types" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} options={MOVEMENT_TYPES.map((t) => ({ label: t, value: t }))} />
      </div>
      {movements.isLoading ? <Loading /> : movements.isError ? (
        <ErrorState message={movements.error.message} onRetry={() => movements.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState icon={<History size={28} />} title="No movements yet" description="Movements appear here when you record them on the Stock page." />
      ) : (
        <MovementTable rows={rows} productName={(id) => productById.get(id)?.name ?? "Deleted product"} warehouseName={(id) => warehouseById.get(id)?.name ?? "Deleted warehouse"} />
      )}
    </section>
  );
}

export function MovementTable({ productName, rows, warehouseName }: { productName: (id: string) => string; rows: StockMovement[]; warehouseName: (id: string) => string }) {
  return (
    <DataTable
      rows={rows}
      columns={[
        { header: "Date", key: "date", render: (row) => (movementDate(row) ? new Date(movementDate(row)).toLocaleString() : "—") },
        { header: "Type", key: "type", render: (row) => <StatusPill tone={row.quantity >= 0 ? "good" : "warn"}>{row.movementType}</StatusPill> },
        { header: "Product", key: "product", render: (row) => productName(row.productId) },
        { header: "Warehouse", key: "warehouse", render: (row) => warehouseName(row.warehouseId) },
        { header: "Change", key: "quantity", render: (row) => <strong>{row.quantity > 0 ? "+" : ""}{formatQty(row.quantity)}</strong> },
        { header: "Balance", key: "balance", render: (row) => formatQty(row.balanceAfter) },
        { header: "Unit cost", key: "unitCost", render: (row) => (row.unitCost ? formatMoney(row.unitCost) : "—") },
        { header: "Reference", key: "reference", render: (row) => row.reference || "—" }
      ]}
    />
  );
}
