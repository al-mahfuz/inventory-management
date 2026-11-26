import { AlertTriangle, History } from "lucide-react";
import { DataTable } from "../../shared/ui/DataTable";
import { EmptyState } from "../../shared/ui/EmptyState";
import { ErrorState } from "../../shared/ui/ErrorState";
import { PageHeader } from "../../shared/ui/PageHeader";
import { Skeleton } from "../../shared/ui/Skeleton";
import { byId, formatMoney, formatQty, isLowStock, onHandByProduct, useRecords } from "./hooks";
import { MovementTable } from "./StockPages";
import { useT } from "../../lib/i18n/LocalizationProvider";
import { getActiveLocale } from "../../lib/i18n/dictionary";

export function DashboardPage() {
  const { t } = useT();
  const locale = getActiveLocale();
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
    { label: t("dashboard.activeProducts"), value: activeProducts.length.toLocaleString(locale) },
    { label: t("nav.warehouses"), value: (warehouses.data?.length ?? 0).toLocaleString(locale) },
    { label: t("nav.suppliers"), value: (suppliers.data?.length ?? 0).toLocaleString(locale) },
    { label: t("dashboard.unitsOnHand"), value: formatQty(totalUnits) },
    { label: t("dashboard.stockValue"), value: formatMoney(stockValue) },
    { label: t("dashboard.lowStockItems"), value: lowStock.length.toLocaleString(locale) }
  ];

  return (
    <section>
      <PageHeader title={t("nav.dashboard")} subtitle={t("dashboard.subtitle")} />

      {error ? <ErrorState message={error.message} onRetry={() => queries.forEach((query) => void query.refetch())} /> : null}

      <div className="metrics">
        {metrics.map((metric) => (
          <div key={metric.label} className="metric">
            <span>{metric.label}</span>
            {loading ? <Skeleton className="skeleton-line-lg" /> : <strong>{metric.value}</strong>}
          </div>
        ))}
      </div>

      <h3>{t("dashboard.lowStock")}</h3>
      {loading ? null : lowStock.length === 0 ? (
        <EmptyState icon={<AlertTriangle size={28} />} title={t("dashboard.noLowStockTitle")} description={t("dashboard.noLowStockDescription")} />
      ) : (
        <DataTable
          rows={lowStock}
          columns={[
            { header: t("product.sku"), key: "sku", render: (row) => <span className="mono">{row.sku}</span> },
            { header: t("product.product"), key: "name", render: (row) => row.name },
            { header: t("product.onHand"), key: "onHand", render: (row) => <strong>{formatQty(onHand.get(row.id))} {row.unit ?? ""}</strong> },
            { header: t("product.reorderLevel"), key: "reorderLevel", render: (row) => formatQty(row.reorderLevel) }
          ]}
        />
      )}

      <h3>{t("dashboard.recentMovements")}</h3>
      {loading ? null : recent.length === 0 ? (
        <EmptyState icon={<History size={28} />} title={t("movements.emptyTitle")} description={t("dashboard.noMovementsDescription")} />
      ) : (
        <MovementTable
          rows={recent}
          productName={(id) => productById.get(id)?.name ?? t("stock.deletedProduct")}
          warehouseName={(id) => warehouseById.get(id)?.name ?? t("stock.deletedWarehouse")}
        />
      )}
    </section>
  );
}
