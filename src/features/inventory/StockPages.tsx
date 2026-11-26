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
import { useT } from "../../lib/i18n/LocalizationProvider";
import { getActiveLocale } from "../../lib/i18n/dictionary";

const MOVEMENT_KINDS: MovementKind[] = ["IN", "OUT", "ADJUSTMENT", "TRANSFER"];

function Loading() {
  return <div className="panel"><Skeleton className="skeleton-line-lg" /><Skeleton className="skeleton-line" /><Skeleton className="skeleton-line" /></div>;
}

export function StockPage() {
  const { t } = useT();
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
        title={t("nav.stock")}
        subtitle={t("stock.subtitle")}
        actions={<ActionButton icon={<ArrowLeftRight size={16} />} onClick={() => setFormOpen(true)}>{t("stock.recordMovement")}</ActionButton>}
      />

      <div className="filter-grid">
        <label className="search-box">
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("stock.searchPlaceholder")} aria-label={t("stock.searchLabel")} />
        </label>
        <SelectField
          label={t("stock.warehouse")}
          placeholder={t("stock.allWarehouses")}
          value={warehouseFilter}
          onChange={(event) => setWarehouseFilter(event.target.value)}
          options={(warehouses.data ?? []).map((w) => ({ label: `${w.code} · ${w.name}`, value: w.id }))}
        />
      </div>

      {loading ? <Loading /> : error ? (
        <ErrorState message={error.message} onRetry={() => { void products.refetch(); void warehouses.refetch(); void levels.refetch(); }} />
      ) : rows.length === 0 ? (
        <EmptyState icon={<PackageCheck size={28} />} title={t("stock.emptyTitle")} description={t("stock.emptyDescription")} />
      ) : (
        <DataTable
          rows={rows}
          columns={[
            { header: t("product.sku"), key: "sku", render: (row) => <span className="mono">{productById.get(row.productId)?.sku ?? "?"}</span> },
            { header: t("product.product"), key: "product", render: (row) => productById.get(row.productId)?.name ?? t("stock.deletedProduct") },
            { header: t("stock.warehouse"), key: "warehouse", render: (row) => warehouseById.get(row.warehouseId)?.name ?? t("stock.deletedWarehouse") },
            { header: t("product.onHand"), key: "quantity", render: (row) => <strong>{formatQty(row.quantity)} {productById.get(row.productId)?.unit ?? ""}</strong> },
            {
              header: t("ui.status"),
              key: "status",
              render: (row) => {
                const product = productById.get(row.productId);
                return product && isLowStock(product, totals.get(row.productId) ?? 0)
                  ? <StatusPill tone="warn">{t("stock.belowReorder")}</StatusPill>
                  : <StatusPill tone="good">{t("stock.ok")}</StatusPill>;
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
  const { errorMessage, t } = useT();
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
    <Modal title={t("movement.formTitle")} onClose={onClose}>
      <form className="form-grid" onSubmit={onSubmit}>
        <div style={{ gridColumn: "1 / -1" }}>
          <SelectField label={t("movement.movement")} value={kind} onChange={(event) => setKind(event.target.value as MovementKind)} options={MOVEMENT_KINDS.map((value) => ({ label: t(`movement.kind.${value}`), value }))} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <SelectField label={t("product.product")} required placeholder={t("movement.selectProduct")} value={values.productId} onChange={set("productId")} options={productOptions} />
        </div>
        <SelectField label={kind === "TRANSFER" ? t("movement.fromWarehouse") : t("stock.warehouse")} required placeholder={t("ui.select")} value={values.warehouseId} onChange={set("warehouseId")} options={warehouseOptions} />
        {kind === "TRANSFER" ? (
          <SelectField label={t("movement.toWarehouse")} required placeholder={t("ui.select")} value={values.toWarehouseId} onChange={set("toWarehouseId")} options={warehouseOptions.filter((o) => o.value !== values.warehouseId)} />
        ) : null}
        <FormField label={kind === "ADJUSTMENT" ? t("movement.countedQuantity") : t("movement.quantity")} type="number" min={0} step="any" required value={values.quantity} onChange={set("quantity")} />
        {kind === "IN" ? <FormField label={t("movement.unitCost")} type="number" min={0} step="any" value={values.unitCost} onChange={set("unitCost")} /> : null}
        <FormField label={t("movement.reference")} placeholder={t("movement.referencePlaceholder")} value={values.reference} onChange={set("reference")} />
        <FormField label={t("movement.note")} value={values.note} onChange={set("note")} />
        {movement.error ? <div style={{ gridColumn: "1 / -1" }}><Alert tone="error">{errorMessage(movement.error)}</Alert></div> : null}
        <div className="form-actions">
          <button type="button" className="icon-button" onClick={onClose}>{t("ui.cancel")}</button>
          <button type="submit" className="primary-button" disabled={movement.isPending}>{movement.isPending ? t("ui.saving") : t("movement.record")}</button>
        </div>
      </form>
    </Modal>
  );
}

const movementDate = (m: StockMovement) => m.movementDate ?? m.CreatedDate ?? "";

export function MovementsPage() {
  const { t } = useT();
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
      <PageHeader title={t("nav.movements")} subtitle={t("movements.subtitle")} />
      <div className="filter-grid">
        <SelectField label={t("movements.type")} placeholder={t("movements.allTypes")} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} options={MOVEMENT_TYPES.map((type) => ({ label: t(`movement.type.${type}`), value: type }))} />
      </div>
      {movements.isLoading ? <Loading /> : movements.isError ? (
        <ErrorState message={movements.error.message} onRetry={() => movements.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState icon={<History size={28} />} title={t("movements.emptyTitle")} description={t("movements.emptyDescription")} />
      ) : (
        <MovementTable rows={rows} productName={(id) => productById.get(id)?.name ?? t("stock.deletedProduct")} warehouseName={(id) => warehouseById.get(id)?.name ?? t("stock.deletedWarehouse")} />
      )}
    </section>
  );
}

export function MovementTable({ productName, rows, warehouseName }: { productName: (id: string) => string; rows: StockMovement[]; warehouseName: (id: string) => string }) {
  const { t } = useT();
  return (
    <DataTable
      rows={rows}
      columns={[
        { header: t("movements.date"), key: "date", render: (row) => (movementDate(row) ? new Date(movementDate(row)).toLocaleString(getActiveLocale()) : "—") },
        { header: t("movements.type"), key: "type", render: (row) => <StatusPill tone={row.quantity >= 0 ? "good" : "warn"}>{t(`movement.type.${row.movementType}`)}</StatusPill> },
        { header: t("product.product"), key: "product", render: (row) => productName(row.productId) },
        { header: t("stock.warehouse"), key: "warehouse", render: (row) => warehouseName(row.warehouseId) },
        { header: t("movements.change"), key: "quantity", render: (row) => <strong>{row.quantity > 0 ? "+" : ""}{formatQty(row.quantity)}</strong> },
        { header: t("movements.balance"), key: "balance", render: (row) => formatQty(row.balanceAfter) },
        { header: t("movement.unitCost"), key: "unitCost", render: (row) => (row.unitCost ? formatMoney(row.unitCost) : "—") },
        { header: t("movement.reference"), key: "reference", render: (row) => row.reference || "—" }
      ]}
    />
  );
}
