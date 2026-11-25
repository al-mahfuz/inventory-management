# Inventory — User Guide

Inventory keeps track of what you stock, where it is, and every change to it. You set up your
**products**, **categories**, **suppliers** and **warehouses** once, then record stock coming in,
going out, being counted, and moving between warehouses. The app keeps the on-hand quantity for
each product in each warehouse up to date and writes every change to a permanent movement history.

This guide is for people using the app day to day. For installing and configuring the app, see the
[README](../README.md).

## Contents

1. [Signing in and out](#1-signing-in-and-out)
2. [Finding your way around](#2-finding-your-way-around)
3. [Getting started: first-time setup](#3-getting-started-first-time-setup)
4. [Dashboard](#4-dashboard)
5. [Products](#5-products)
6. [Categories, suppliers and warehouses](#6-categories-suppliers-and-warehouses)
7. [Stock](#7-stock)
8. [Recording a stock movement](#8-recording-a-stock-movement)
9. [Movements (history)](#9-movements-history)
10. [Profile](#10-profile)
11. [Good practice](#11-good-practice)
12. [Troubleshooting](#12-troubleshooting)
13. [Glossary](#13-glossary)

---

## 1. Signing in and out

**Sign in**

1. Open the app. If you are not signed in, you land on the **Welcome back** page.
2. Select **Continue with Blocks**.
3. Sign in with your Blocks account on the sign-in page that opens.
4. You are brought back to the app — to the page you were trying to open, or the Dashboard.

Every page except the sign-in page requires you to be signed in. If your session ends, the app sends
you back to the sign-in page and returns you to where you were afterwards.

**Sign out**

Select your initials (avatar) in the top-right corner, then **Log out**. This ends your session
on the server, not just in this browser tab.

## 2. Finding your way around

The **sidebar** on the left lists every section. The section you are on is highlighted and its name
appears at the top left of the page. Use the panel button at the top of the sidebar to collapse it to
icons only (the app remembers your choice); on narrow screens it always shows icons only. Hover an
icon to see its name.

| Section | What it is for |
|---|---|
| **Dashboard** | Your stock position at a glance |
| **Products** | The list of items you stock (SKU, price, reorder level) |
| **Stock** | How many of each product are in each warehouse; record movements here |
| **Movements** | The full history of every stock change |
| **Categories** | Groups for organising products |
| **Suppliers** | Vendors you buy from |
| **Warehouses** | The locations that hold stock |
| **Profile** | Your account details |

The **top bar** holds:

- **Notifications** (bell) — currently always shows *You're all caught up*; the app does not send
  notifications yet.
- **Language** — appears only when more than one language is set up for your organisation.
- **Your avatar** — shows your name, email and roles, and the **Log out** option.

### Lists, search and forms

Products, Categories, Suppliers and Warehouses all work the same way:

- **Search** with the box above the list. The count beside it (for example *3 of 12*) shows how
  many records match.
- **Add** a record with the **New …** button at the top right.
- **Edit** a record with the pencil icon at the end of its row.
- **Delete** a record with the bin icon. You are asked to confirm.
- In forms, fields marked as required must be filled in before you can **Save**. Number fields
  left blank are saved as `0`. New records start with **Active** ticked.

## 3. Getting started: first-time setup

Set things up in this order, because later steps pick from lists created in earlier ones.

1. **Warehouses** — add every location that holds stock (for example `WH-MAIN · Main warehouse`).
2. **Categories** — add the groups you want to organise products by.
3. **Suppliers** — add the vendors you buy from.
4. **Products** — add each item, choosing its category and default supplier, and set its
   **Reorder level** so the app can warn you when it runs low.
5. **Opening stock** — on the **Stock** page, use **Record movement → Receive (stock in)** for each
   product in each warehouse to load the quantities you hold today. (A **stock count adjustment**
   works too; see [section 8](#8-recording-a-stock-movement).)

After that, day-to-day work happens on the **Stock** page.

## 4. Dashboard

The Dashboard is the home page. It shows:

| Figure | Meaning |
|---|---|
| **Active products** | Products marked Active |
| **Warehouses** | All warehouses, active or not |
| **Suppliers** | All suppliers, active or not |
| **Units on hand** | Total quantity of stock across all products and warehouses |
| **Stock value (cost)** | On-hand quantity × the product's **Cost price**, added up across active products |
| **Low-stock items** | Active products at or below their reorder level |

Below the figures:

- **Low stock** — each active product whose total quantity (across all warehouses) is at or below
  its reorder level, with how many you have and the reorder level.
- **Recent movements** — the 8 latest stock changes. See [section 9](#9-movements-history) for
  what the columns mean.

## 5. Products

Products are the items you stock. Each product has:

| Field | Notes |
|---|---|
| **SKU** | Required. Your stock-keeping code; must be unique |
| **Name** | Required |
| **Category** | Optional; picked from your categories |
| **Default supplier** | Optional; picked from your suppliers |
| **Unit** | How the item is counted, for example `pcs`, `box`, `kg`. Shown next to quantities |
| **Barcode** | Optional; searchable |
| **Cost price** | What you pay per unit. Used for **Stock value** on the Dashboard |
| **Selling price** | What you charge per unit. Shown in the list as **Price** |
| **Reorder level** | When total stock drops to this number or below, the product is flagged **Low**. Leave at `0` to turn the warning off |
| **Active** | Untick for products you no longer use (see below) |
| **Description** | Free text |

**The list** shows SKU, name, category, price, the **On hand** quantity across all warehouses (with
a **Low** tag when below the reorder level), and status. Search by SKU, name or barcode.

**Inactive products** stay in the list and in the history, but you cannot pick them when recording
a movement, and they are left out of the Dashboard figures for active products, stock value and low
stock. Deactivating is usually better than deleting.

## 6. Categories, suppliers and warehouses

These lists hold the reference data that products and stock use.

**Categories** — *Name* and *Code* are required; *Code* must be unique. Search by name or code.

**Suppliers** — *Name* is required. You can also record a contact person, email, phone and
address. Search by name, contact person or email.

**Warehouses** — *Name* and *Code* are required; *Code* must be unique. Search by name or code.
Inactive warehouses cannot be picked when recording a movement, but their existing stock still
shows on the Stock page.

> **Before you delete anything:** deleting does not update records that point to it. A product
> whose category was deleted shows `—` for its category; stock and history rows for a deleted
> product or warehouse show **Deleted product** / **Deleted warehouse**. Untick **Active** instead
> if the record has been used.

## 7. Stock

The Stock page shows how many units of each product are in each warehouse — one row per product
per warehouse that has ever held it.

| Column | Meaning |
|---|---|
| **SKU / Product** | The product |
| **Warehouse** | Where the stock is |
| **On hand** | Quantity in that warehouse, with the product's unit |
| **Status** | **OK**, or **Below reorder level** when the product's total across *all* warehouses is at or below its reorder level |

Use the **search box** to find a product by SKU or name, and the **Warehouse** filter to show one
warehouse only. A row stays in the list with `0` on hand after its stock runs out.

You never type quantities into this table directly — every change is made with **Record movement**.

## 8. Recording a stock movement

On the **Stock** page, select **Record movement**. Choose the type of movement, fill in the form and
select **Record**. The on-hand quantity updates and an entry is added to the movement history.

| Movement | Use it when | What happens |
|---|---|---|
| **Receive (stock in)** | Goods arrive, for example from a supplier | Adds the quantity to the warehouse |
| **Issue (stock out)** | Goods leave, for example sold, used or written off | Takes the quantity away from the warehouse |
| **Adjust (stock count)** | You physically counted the stock | Sets the warehouse quantity to the number you counted |
| **Transfer between warehouses** | Goods move from one location to another | Takes the quantity from one warehouse and adds it to the other |

### Form fields

| Field | Notes |
|---|---|
| **Movement** | The type, from the table above |
| **Product** | Required. Only active products are listed, shown as `SKU · Name` |
| **Warehouse** / **From warehouse** | Required. Only active warehouses are listed |
| **To warehouse** | Transfers only. Must differ from the *From* warehouse |
| **Quantity** / **Counted quantity** | Required. For an adjustment, enter the **total you counted**, not the difference |
| **Unit cost** | Receive only, optional. Kept on the history entry for reference; it does **not** change the product's cost price |
| **Reference** | Optional. A PO, invoice or ticket number, so you can trace the movement later |
| **Note** | Optional free text |

### Examples

- **Receiving a delivery** — 50 boxes arrive at the main warehouse on PO-1042: *Receive*, product,
  *Main warehouse*, quantity `50`, reference `PO-1042`.
- **Selling or using stock** — 3 units leave the shop: *Issue*, product, *Shop*, quantity `3`.
- **After a stock count** — the system says 40, you counted 37: *Adjust*, product, warehouse,
  counted quantity `37`. The history records a change of **−3**.
- **Moving stock** — 10 units from main to shop: *Transfer*, product, *From* main, *To* shop,
  quantity `10`. The history gets two entries: **TRANSFER_OUT −10** at main and
  **TRANSFER_IN +10** at the shop.

### Rules the app enforces

- Quantity must be more than zero (an adjustment may be `0`, meaning the shelf is empty).
- You cannot issue or transfer more than the warehouse has. You will see, for example,
  *Not enough stock: 4 on hand, 6 requested.*
- An adjustment to the quantity already on hand is refused: *Counted quantity matches stock on
  hand; nothing to adjust.*
- A transfer needs two different warehouses.

If something is refused, the message appears in the form and nothing is saved; fix the value and
select **Record** again.

## 9. Movements (history)

The Movements page lists every stock change, newest first. Entries can never be edited or deleted —
if a movement was wrong, record a new one to correct it (usually an **Adjust**).

| Column | Meaning |
|---|---|
| **Date** | When the movement was recorded |
| **Type** | `IN`, `OUT`, `ADJUSTMENT`, `TRANSFER_IN` or `TRANSFER_OUT`. Green for increases, amber for decreases |
| **Product / Warehouse** | What moved, and where |
| **Change** | Units added (`+`) or removed (`−`) |
| **Balance** | Quantity in that warehouse right after this movement |
| **Unit cost** | The unit cost entered when receiving, if any |
| **Reference** | The reference entered, if any |

Use the **Type** filter to show one kind of movement.

## 10. Profile

The Profile page shows your account as Blocks sees it: your name and email, whether you are
authenticated, your user ID, your organisation's tenant ID, your roles and permissions, and when
your session started and expires. Use the refresh button at the top right to reload it. **View raw
response** shows the full account data, which is useful when asking for support.

## 11. Good practice

- **Always fill in Reference** on receipts, issues and transfers. It is the easiest way to trace a
  number back to a document later.
- **Do regular stock counts** and record them with **Adjust**. The history then shows exactly how
  much was gained or lost.
- **Set reorder levels** on the products that matter so the Dashboard can warn you in time.
- **Deactivate rather than delete** products, categories, suppliers and warehouses that have been
  used.
- **Avoid recording movements for the same product in the same warehouse at the same moment as a
  colleague.** The app does not lock stock while it saves, so two simultaneous movements can
  overwrite each other's quantity. If numbers look wrong, compare the Stock page with the Movements
  history and correct with an adjustment.
- **After a failed transfer, check the Movements page.** If the connection drops mid-transfer, the
  stock may have left the first warehouse without arriving at the second. If you see a
  `TRANSFER_OUT` with no matching `TRANSFER_IN`, record a **Receive** at the destination with the
  same reference.

## 12. Troubleshooting

| Problem | What to do |
|---|---|
| The sign-in page says *Login is not configured yet* | The app has not been connected to your sign-in service. Contact your administrator |
| I'm sent back to the sign-in page | Your session has expired. Sign in again; you return to the page you were on |
| A page shows a warning message with a **Retry** link instead of data | The data could not be loaded, usually a network problem. Select **Retry**; if it keeps failing, sign out and in again |
| Saving a product, category or warehouse fails | The SKU or code is probably already used by another record. Choose a unique one |
| A product or warehouse is missing from the movement form | It is marked inactive. Edit it and tick **Active** |
| *Not enough stock* when issuing or transferring | The warehouse holds less than you asked for. Check the Stock page; if the shelf really has more, record an **Adjust** first |
| The Dashboard stock value looks too low | Products without a **Cost price** count as zero, and inactive products are left out |
| A product isn't flagged low even though stock is low | Its **Reorder level** is `0`, or it is inactive, or its total across all warehouses is still above the level |
| The language menu is missing | Only one language is set up for your organisation |

## 13. Glossary

| Term | Meaning |
|---|---|
| **SKU** | Stock-keeping unit: the unique code you give each product |
| **On hand** | Units physically held in a warehouse |
| **Reorder level** | The quantity at or below which a product counts as low stock |
| **Movement** | Any recorded change to stock: receive, issue, adjust or transfer |
| **Balance** | The on-hand quantity in a warehouse straight after a movement |
| **Stock value (cost)** | On-hand units × cost price, summed over active products |
| **Active / Inactive** | Inactive records are kept for history but hidden from new movements |
