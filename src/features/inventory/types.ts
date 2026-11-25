export type Category = { id: string; name: string; code: string; description?: string; isActive?: boolean };

export type Supplier = { id: string; name: string; contactName?: string; email?: string; phone?: string; address?: string; isActive?: boolean };

export type Warehouse = { id: string; name: string; code: string; address?: string; isActive?: boolean };

export type Product = {
  id: string;
  sku: string;
  name: string;
  description?: string;
  barcode?: string;
  categoryId?: string;
  supplierId?: string;
  unit?: string;
  costPrice?: number;
  sellingPrice?: number;
  reorderLevel?: number;
  isActive?: boolean;
};

export type StockLevel = { id: string; productId: string; warehouseId: string; quantity: number };

export const MOVEMENT_TYPES = ["IN", "OUT", "ADJUSTMENT", "TRANSFER_IN", "TRANSFER_OUT"] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export type StockMovement = {
  id: string;
  productId: string;
  warehouseId: string;
  movementType: MovementType;
  quantity: number;
  balanceAfter?: number;
  unitCost?: number;
  reference?: string;
  note?: string;
  movementDate?: string;
  CreatedDate?: string;
};

export type InventoryRecords = {
  Category: Category;
  Product: Product;
  StockLevel: StockLevel;
  StockMovement: StockMovement;
  Supplier: Supplier;
  Warehouse: Warehouse;
};

export type InventorySchema = keyof InventoryRecords;
export type SchemaRecord<S extends InventorySchema> = InventoryRecords[S];
