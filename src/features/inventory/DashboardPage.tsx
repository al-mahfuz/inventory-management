import { AlertTriangle, History } from "lucide-react";
import { DataTable } from "../../shared/ui/DataTable";
import { EmptyState } from "../../shared/ui/EmptyState";
import { ErrorState } from "../../shared/ui/ErrorState";
import { PageHeader } from "../../shared/ui/PageHeader";
import { Skeleton } from "../../shared/ui/Skeleton";
import { byId, formatMoney, formatQty, isLowStock, onHandByProduct, useRecords } from "./hooks";
import { MovementTable } from "./StockPages";

export function DashboardPage() {
  const products = useRecords("Product");
  const warehouses = useRecords("Warehouse");
  const suppliers = useRecords("Supplier");
  const levels = useRecords("StockLevel");
  const movements = useRecords("StockMovement");

  const queries = [products, warehouses, suppliers, levels, movements];
  const loading = queries.some((query) => query.isLoading);
  const error = queries.find((query) => query.error)?.error;

  const onHand = onHandByProduct(levels.data);
  const productById = byId(products.data);
  const warehouseById = byId(warehouses.data);
  const activeProducts = (products.data ?? []).filter((p) => p.isActive !== false);
  const lowStock = activeProducts.filter((p) => isLowStock(p, onHand.get(p.id) ?? 0));
  const totalUnits = [...onHand.values()].reduce((sum, qty) => sum + qty, 0);
  const stockValue = activeProducts.reduce((sum, p) => sum + (onHand.get(p.id) ?? 0) * (p.costPrice ?? 0), 0);
  const recent = [...(movements.data ?? [])]
    .sort((a, b) => (b.movementDate ?? b.CreatedDate ?? "").localeCompare(a.movementDate ?? a.CreatedDate ?? ""))
    .slice(0, 8);

  const metrics = [
    { label: "Active products", value: activeProducts.length.toLocaleString() },
    { label: "Warehouses", value: (warehouses.data?.length ?? 0).toLocaleString() },
    { label: "Suppliers", value: (suppliers.data?.length ?? 0).toLocaleString() },
    { label: "Units on hand", value: formatQty(totalUnits) },
    { label: "Stock value (cost)", value: formatMoney(stockValue) },
    { label: "Low-stock items", value: lowStock.length.toLocaleString() }
  ];

  return (
    <section>
      <PageHeader title="Dashboard" subtitle="Stock position at a glance." />

      {error ? <ErrorState message={error.message} onRetry={() => queries.forEach((query) => void query.refetch())} /> : null}

      <div className="metrics">
        {metrics.map((metric) => (
          <div key={metric.label} className="metric">
            <span>{metric.label}</span>
            {loading ? <Skeleton className="skeleton-line-lg" /> : <strong>{metric.value}</strong>}
          </div>
        ))}
      </div>

      <h3>Low stock</h3>
      {loading ? null : lowStock.length === 0 ? (
        <EmptyState icon={<AlertTriangle size={28} />} title="Nothing below reorder level" description="Products appear here when on-hand quantity drops to their reorder level." />
      ) : (
        <DataTable
          rows={lowStock}
          columns={[
            { header: "SKU", key: "sku", render: (row) => <span className="mono">{row.sku}</span> },
            { header: "Product", key: "name", render: (row) => row.name },
            { header: "On hand", key: "onHand", render: (row) => <strong>{formatQty(onHand.get(row.id))} {row.unit ?? ""}</strong> },
            { header: "Reorder level", key: "reorderLevel", render: (row) => formatQty(row.reorderLevel) }
          ]}
        />
      )}

      <h3>Recent movements</h3>
      {loading ? null : recent.length === 0 ? (
        <EmptyState icon={<History size={28} />} title="No movements yet" description="Record a receipt on the Stock page to get started." />
      ) : (
        <MovementTable
          rows={recent}
          productName={(id) => productById.get(id)?.name ?? "Deleted product"}
          warehouseName={(id) => warehouseById.get(id)?.name ?? "Deleted warehouse"}
        />
      )}
    </section>
  );
}
