import { Boxes, Package, Tags, Truck } from "lucide-react";
import { StatusPill } from "../../shared/ui/StatusPill";
import { CrudPage } from "./CrudPage";
import type { FieldDef } from "./CrudPage";
import { byId, formatMoney, formatQty, isLowStock, onHandByProduct, useRecords } from "./hooks";

const activePill = (isActive?: boolean) => <StatusPill tone={isActive === false ? "neutral" : "good"}>{isActive === false ? "Inactive" : "Active"}</StatusPill>;

export function CategoriesPage() {
  const fields: FieldDef[] = [
    { label: "Name", name: "name", required: true },
    { label: "Code", name: "code", required: true },
    { label: "Description", name: "description", wide: true },
    { label: "Active", name: "isActive", type: "checkbox" }
  ];
  return (
    <CrudPage
      schema="Category"
      title="Categories"
      noun="category"
      subtitle="Group products for reporting and search."
      emptyIcon={<Tags size={28} />}
      fields={fields}
      searchKeys={["name", "code"]}
      columns={[
        { header: "Code", key: "code", render: (row) => <span className="mono">{row.code}</span> },
        { header: "Name", key: "name", render: (row) => row.name },
        { header: "Description", key: "description", render: (row) => row.description || "—" },
        { header: "Status", key: "isActive", render: (row) => activePill(row.isActive) }
      ]}
    />
  );
}

export function SuppliersPage() {
  const fields: FieldDef[] = [
    { label: "Name", name: "name", required: true },
    { label: "Contact person", name: "contactName" },
    { label: "Email", name: "email", type: "email" },
    { label: "Phone", name: "phone" },
    { label: "Address", name: "address", wide: true },
    { label: "Active", name: "isActive", type: "checkbox" }
  ];
  return (
    <CrudPage
      schema="Supplier"
      title="Suppliers"
      noun="supplier"
      subtitle="Vendors you buy stock from."
      emptyIcon={<Truck size={28} />}
      fields={fields}
      searchKeys={["name", "contactName", "email"]}
      columns={[
        { header: "Name", key: "name", render: (row) => row.name },
        { header: "Contact", key: "contactName", render: (row) => row.contactName || "—" },
        { header: "Email", key: "email", render: (row) => row.email || "—" },
        { header: "Phone", key: "phone", render: (row) => row.phone || "—" },
        { header: "Status", key: "isActive", render: (row) => activePill(row.isActive) }
      ]}
    />
  );
}

export function WarehousesPage() {
  const fields: FieldDef[] = [
    { label: "Name", name: "name", required: true },
    { label: "Code", name: "code", required: true },
    { label: "Address", name: "address", wide: true },
    { label: "Active", name: "isActive", type: "checkbox" }
  ];
  return (
    <CrudPage
      schema="Warehouse"
      title="Warehouses"
      noun="warehouse"
      subtitle="Locations that hold stock."
      emptyIcon={<Boxes size={28} />}
      fields={fields}
      searchKeys={["name", "code"]}
      columns={[
        { header: "Code", key: "code", render: (row) => <span className="mono">{row.code}</span> },
        { header: "Name", key: "name", render: (row) => row.name },
        { header: "Address", key: "address", render: (row) => row.address || "—" },
        { header: "Status", key: "isActive", render: (row) => activePill(row.isActive) }
      ]}
    />
  );
}

export function ProductsPage() {
  const categories = useRecords("Category");
  const suppliers = useRecords("Supplier");
  const levels = useRecords("StockLevel");
  const categoryById = byId(categories.data);
  const onHand = onHandByProduct(levels.data);

  const fields: FieldDef[] = [
    { label: "SKU", name: "sku", required: true },
    { label: "Name", name: "name", required: true },
    { label: "Category", name: "categoryId", options: (categories.data ?? []).map((c) => ({ label: c.name, value: c.id })), type: "select" },
    { label: "Default supplier", name: "supplierId", options: (suppliers.data ?? []).map((s) => ({ label: s.name, value: s.id })), type: "select" },
    { label: "Unit", name: "unit" },
    { label: "Barcode", name: "barcode" },
    { label: "Cost price", name: "costPrice", type: "number" },
    { label: "Selling price", name: "sellingPrice", type: "number" },
    { label: "Reorder level", name: "reorderLevel", type: "number" },
    { label: "Active", name: "isActive", type: "checkbox" },
    { label: "Description", name: "description", wide: true }
  ];

  return (
    <CrudPage
      schema="Product"
      title="Products"
      noun="product"
      subtitle="Item master: SKUs, pricing and reorder thresholds."
      emptyIcon={<Package size={28} />}
      fields={fields}
      searchKeys={["sku", "name", "barcode"]}
      columns={[
        { header: "SKU", key: "sku", render: (row) => <span className="mono">{row.sku}</span> },
        { header: "Name", key: "name", render: (row) => row.name },
        { header: "Category", key: "categoryId", render: (row) => categoryById.get(row.categoryId ?? "")?.name ?? "—" },
        { header: "Price", key: "sellingPrice", render: (row) => formatMoney(row.sellingPrice) },
        {
          header: "On hand",
          key: "onHand",
          render: (row) => {
            const qty = onHand.get(row.id) ?? 0;
            return (
              <span className="muted">
                {formatQty(qty)} {row.unit ?? ""}
                {isLowStock(row, qty) ? <StatusPill tone="warn">Low</StatusPill> : null}
              </span>
            );
          }
        },
        { header: "Status", key: "isActive", render: (row) => activePill(row.isActive) }
      ]}
    />
  );
}
