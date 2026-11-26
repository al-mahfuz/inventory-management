import { Boxes, Package, Tags, Truck } from "lucide-react";
import { StatusPill } from "../../shared/ui/StatusPill";
import { CrudPage } from "./CrudPage";
import type { FieldDef } from "./CrudPage";
import { byId, formatMoney, formatQty, isLowStock, onHandByProduct, useRecords } from "./hooks";
import { useT } from "../../lib/i18n/LocalizationProvider";
import type { TranslationKey } from "../../lib/i18n/dictionary";

type T = (key: TranslationKey) => string;

const activePill = (t: T, isActive?: boolean) => <StatusPill tone={isActive === false ? "neutral" : "good"}>{isActive === false ? t("ui.inactive") : t("ui.active")}</StatusPill>;

export function CategoriesPage() {
  const { t } = useT();
  const fields: FieldDef[] = [
    { label: t("ui.name"), name: "name", required: true },
    { label: t("ui.code"), name: "code", required: true },
    { label: t("ui.description"), name: "description", wide: true },
    { label: t("ui.active"), name: "isActive", type: "checkbox" }
  ];
  return (
    <CrudPage
      schema="Category"
      title={t("nav.categories")}
      noun={t("entity.category.one")}
      nounPlural={t("entity.category.other")}
      subtitle={t("category.subtitle")}
      emptyIcon={<Tags size={28} />}
      fields={fields}
      searchKeys={["name", "code"]}
      columns={[
        { header: t("ui.code"), key: "code", render: (row) => <span className="mono">{row.code}</span> },
        { header: t("ui.name"), key: "name", render: (row) => row.name },
        { header: t("ui.description"), key: "description", render: (row) => row.description || "—" },
        { header: t("ui.status"), key: "isActive", render: (row) => activePill(t, row.isActive) }
      ]}
    />
  );
}

export function SuppliersPage() {
  const { t } = useT();
  const fields: FieldDef[] = [
    { label: t("ui.name"), name: "name", required: true },
    { label: t("supplier.contactPerson"), name: "contactName" },
    { label: t("ui.email"), name: "email", type: "email" },
    { label: t("ui.phone"), name: "phone" },
    { label: t("ui.address"), name: "address", wide: true },
    { label: t("ui.active"), name: "isActive", type: "checkbox" }
  ];
  return (
    <CrudPage
      schema="Supplier"
      title={t("nav.suppliers")}
      noun={t("entity.supplier.one")}
      nounPlural={t("entity.supplier.other")}
      subtitle={t("supplier.subtitle")}
      emptyIcon={<Truck size={28} />}
      fields={fields}
      searchKeys={["name", "contactName", "email"]}
      columns={[
        { header: t("ui.name"), key: "name", render: (row) => row.name },
        { header: t("supplier.contact"), key: "contactName", render: (row) => row.contactName || "—" },
        { header: t("ui.email"), key: "email", render: (row) => row.email || "—" },
        { header: t("ui.phone"), key: "phone", render: (row) => row.phone || "—" },
        { header: t("ui.status"), key: "isActive", render: (row) => activePill(t, row.isActive) }
      ]}
    />
  );
}

export function WarehousesPage() {
  const { t } = useT();
  const fields: FieldDef[] = [
    { label: t("ui.name"), name: "name", required: true },
    { label: t("ui.code"), name: "code", required: true },
    { label: t("ui.address"), name: "address", wide: true },
    { label: t("ui.active"), name: "isActive", type: "checkbox" }
  ];
  return (
    <CrudPage
      schema="Warehouse"
      title={t("nav.warehouses")}
      noun={t("entity.warehouse.one")}
      nounPlural={t("entity.warehouse.other")}
      subtitle={t("warehouse.subtitle")}
      emptyIcon={<Boxes size={28} />}
      fields={fields}
      searchKeys={["name", "code"]}
      columns={[
        { header: t("ui.code"), key: "code", render: (row) => <span className="mono">{row.code}</span> },
        { header: t("ui.name"), key: "name", render: (row) => row.name },
        { header: t("ui.address"), key: "address", render: (row) => row.address || "—" },
        { header: t("ui.status"), key: "isActive", render: (row) => activePill(t, row.isActive) }
      ]}
    />
  );
}

export function ProductsPage() {
  const { t } = useT();
  const categories = useRecords("Category");
  const suppliers = useRecords("Supplier");
  const levels = useRecords("StockLevel");
  const categoryById = byId(categories.data);
  const onHand = onHandByProduct(levels.data);

  const fields: FieldDef[] = [
    { label: t("product.sku"), name: "sku", required: true },
    { label: t("ui.name"), name: "name", required: true },
    { label: t("product.category"), name: "categoryId", options: (categories.data ?? []).map((c) => ({ label: c.name, value: c.id })), type: "select" },
    { label: t("product.defaultSupplier"), name: "supplierId", options: (suppliers.data ?? []).map((s) => ({ label: s.name, value: s.id })), type: "select" },
    { label: t("product.unit"), name: "unit" },
    { label: t("product.barcode"), name: "barcode" },
    { label: t("product.costPrice"), name: "costPrice", type: "number" },
    { label: t("product.sellingPrice"), name: "sellingPrice", type: "number" },
    { label: t("product.reorderLevel"), name: "reorderLevel", type: "number" },
    { label: t("ui.active"), name: "isActive", type: "checkbox" },
    { label: t("ui.description"), name: "description", wide: true }
  ];

  return (
    <CrudPage
      schema="Product"
      title={t("nav.products")}
      noun={t("entity.product.one")}
      nounPlural={t("entity.product.other")}
      subtitle={t("product.subtitle")}
      emptyIcon={<Package size={28} />}
      fields={fields}
      searchKeys={["sku", "name", "barcode"]}
      columns={[
        { header: t("product.sku"), key: "sku", render: (row) => <span className="mono">{row.sku}</span> },
        { header: t("ui.name"), key: "name", render: (row) => row.name },
        { header: t("product.category"), key: "categoryId", render: (row) => categoryById.get(row.categoryId ?? "")?.name ?? "—" },
        { header: t("product.price"), key: "sellingPrice", render: (row) => formatMoney(row.sellingPrice) },
        {
          header: t("product.onHand"),
          key: "onHand",
          render: (row) => {
            const qty = onHand.get(row.id) ?? 0;
            return (
              <span className="muted">
                {formatQty(qty)} {row.unit ?? ""}
                {isLowStock(row, qty) ? <StatusPill tone="warn">{t("product.low")}</StatusPill> : null}
              </span>
            );
          }
        },
        { header: t("ui.status"), key: "isActive", render: (row) => activePill(t, row.isActive) }
      ]}
    />
  );
}
