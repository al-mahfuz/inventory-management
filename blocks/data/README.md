# blocks/data

Data Gateway schemas and access rules. Two-way: edit locally, then push.

- `schemas/` -- `blocks data schema pull` writes it; `blocks data schema push` sends it back.
- `rules.json` -- `blocks data rules pull` writes it; `blocks data rules deploy` sends it back.
- `blocks data validate` checks both; `blocks data sync` pushes both.

## Inventory data model

| Schema | Collection | Purpose | Key fields |
|---|---|---|---|
| `Category` | Categories | Product grouping | `code` (unique), `name`, `isActive` |
| `Supplier` | Suppliers | Vendors | `name`, `contactName`, `email`, `phone` |
| `Warehouse` | Warehouses | Stock locations | `code` (unique), `name`, `address` |
| `Product` | Products | Item master (SKU) | `sku` (unique), `categoryId`, `supplierId`, `unit`, `costPrice`, `sellingPrice`, `reorderLevel` |
| `StockLevel` | StockLevels | On-hand quantity per product per warehouse | `productId` + `warehouseId` (unique pair), `quantity` |
| `StockMovement` | StockMovements | Append-only ledger of every stock change | `movementType` (`IN`/`OUT`/`ADJUSTMENT`/`TRANSFER_IN`/`TRANSFER_OUT`), signed `quantity`, `balanceAfter`, `reference` |

References (`categoryId`, `productId`, ...) hold the target record's `ItemId`. All six schemas have
User access: any signed-in user of the project can read and write them. Tighten that with `security`
entries in `rules.json` when roles matter.

Unique indexes are not stored in the schema files. They were created with
`blocks data schema indexes create` and must be recreated by hand in another project:

| Schema | Fields |
|---|---|
| `Product` | `sku` |
| `Category` | `code` |
| `Warehouse` | `code` |
| `StockLevel` | `productId`, `warehouseId` |
