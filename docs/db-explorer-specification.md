# Developer Database Explorer — Product & Technical Specification

## 1. Overview & Objective

The **Developer Database Explorer** is an internal, web-based database management tool integrated directly into the **Towchen API** project. 

Its primary purpose is to provide the **developer team** with fast, frictionless access to inspect, browse, search, and edit PostgreSQL database records without relying on external desktop applications (such as pgAdmin, DBeaver, or TablePlus) or needing direct VPN/SSH database connection strings.

> **Key Principle**: No role-based restrictions or complex access control tiers are required. The tool is designed exclusively for the developer team for rapid debugging, inspection, and ad-hoc query execution.

---

## 2. Key Requirements & Features

### 2.1 Table & Schema Browsing
* **Automatic Table Discovery**: Dynamically introspect PostgreSQL's `information_schema` or Prisma schema to list all active tables in the database.
* **Metadata & Stats**:
  * Total table count.
  * Live or estimated row counts for each table.
  * Approximate disk size per table.
* **Schema Inspector**:
  * Column names, data types (`INTEGER`, `VARCHAR`, `BOOLEAN`, `TIMESTAMP`, `JSONB`, `ENUM`, etc.).
  * Nullability constraints (`NULL` / `NOT NULL`).
  * Default values.
  * Primary keys and foreign key references.

### 2.2 Interactive Data Grid (Explorer View)
* **Paginated Browsing**: Configurable page sizes (10, 25, 50, 100 rows per page) with quick Next/Previous navigation.
* **Dynamic Sorting**: Click any column header to sort in `ASC` or `DESC` order.
* **Global & Column Search**: Fast keyword filtering across text-based columns.
* **Column Visibility & Auto-Formatting**:
  * Human-readable timestamps (with raw ISO tooltips).
  * Formatted JSON badges for nested objects/arrays.
  * Status and boolean pills (e.g., active/inactive, true/false).

### 2.3 Record Inspector & CRUD Operations
* **Row Detail Inspector**: Click any row to open a full modal showing all fields, formatted JSON values, and related record IDs.
* **Inline / Modal Editing**: Modify specific column values directly with instant feedback and type casting.
* **Insert Record**: Create a new row in any table with field inputs dynamically generated from the table's column definitions and data types.
* **Delete Record**: Remove a record by its primary key with a confirmation prompt.

### 2.4 Freeform SQL Query Console
* **SQL Editor**: Code area with syntax highlighting or clean monospace input for writing raw SQL queries.
* **Execution Metrics**: Displays query runtime (milliseconds) and total rows returned/affected.
* **Tabular Query Results**: Displays custom `SELECT` results dynamically in a clean data grid.
* **Export Options**: One-click export of table data or custom SQL results to **JSON** or **CSV**.

### 2.5 Standalone Angular Web UI
* **Decoupled Architecture**: Built as a standalone Angular project in a separate directory (`towchen_db_explorer_ui`).
* **Developer Experience**: Runs with `ng serve` on `http://localhost:4200` with hot-reload, communicating with the NestJS API via CORS.
* **Modern Dark Theme**: Rich dark dashboard layout with responsive sidebar, data grid, code editor, and modal inspectors.
* **Independent Deployment**: Can be hosted independently or built and served anywhere.

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│               Standalone Angular Web App (`towchen_db_explorer_ui`)     │
│             (Tables Sidebar | Data Grid | SQL Runner | Modals)          │
│                       http://localhost:4200                             │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP REST (CORS enabled)
┌────────────────────────────────────▼────────────────────────────────────┐
│                    Towchen API (NestJS Backend)                         │
│                       http://localhost:3000                             │
│                                                                         │
│   src/modules/db-explorer/                                              │
│   ├── db-explorer.controller.ts   (HTTP REST Endpoints)                 │
│   ├── db-explorer.service.ts      (Introspection, Data & Query Logic)   │
│   └── db-explorer.module.ts       (Module Registration)                 │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Raw SQL / Prisma Client
┌────────────────────────────────────▼────────────────────────────────────┐
│                     PostgreSQL Database                                 │
│   - information_schema.tables & columns (Schema Discovery)              │
│   - Application Tables (`admin`, `vendor`, `driver`, `orders`, etc.)    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. API Endpoints Specification

All endpoints are grouped under the `/db-explorer/api` prefix:

### 4.1 Schema & Metadata Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/db-explorer/api/tables` | Returns list of all tables, approximate row count, and table size. |
| `GET` | `/db-explorer/api/tables/:table/schema` | Returns column names, data types, nullability, defaults, and primary keys. |

#### Example Response: `GET /db-explorer/api/tables`
```json
[
  {
    "name": "admin",
    "estimatedRows": 12,
    "size": "48 kB"
  },
  {
    "name": "vendor",
    "estimatedRows": 1540,
    "size": "512 kB"
  },
  {
    "name": "orders",
    "estimatedRows": 84200,
    "size": "14 MB"
  }
]
```

---

### 4.2 Data & CRUD Endpoints

| Method | Endpoint | Query / Body Params | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/db-explorer/api/tables/:table/data` | `?page=1&limit=50&sortBy=id&sortOrder=DESC&search=xyz` | Paginated rows with total count, columns, and rows. |
| `GET` | `/db-explorer/api/tables/:table/data/:id` | `?pkColumn=id` | Fetch full single record. |
| `POST` | `/db-explorer/api/tables/:table/data` | `{ "column": "value", ... }` | Insert a new row into the table. |
| `PUT` | `/db-explorer/api/tables/:table/data/:id` | `{ "column": "value", ... }` | Update row by primary key. |
| `DELETE` | `/db-explorer/api/tables/:table/data/:id` | `?pkColumn=id` | Delete row by primary key. |

#### Example Response: `GET /db-explorer/api/tables/vendor/data?page=1&limit=2`
```json
{
  "tableName": "vendor",
  "page": 1,
  "limit": 2,
  "totalRows": 1540,
  "totalPages": 770,
  "columns": ["id", "formated_id", "email", "status", "created_at"],
  "rows": [
    {
      "id": 1,
      "formated_id": "VEND-001",
      "email": "vendor1@towchen.com",
      "status": "Approved",
      "created_at": "2026-03-01T10:00:00.000Z"
    },
    {
      "id": 2,
      "formated_id": "VEND-002",
      "email": "vendor2@towchen.com",
      "status": "Pending",
      "created_at": "2026-03-02T11:30:00.000Z"
    }
  ]
}
```

---

### 4.3 Raw SQL Runner Endpoint

| Method | Endpoint | Body | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/db-explorer/api/query` | `{ "query": "SELECT * FROM vendor LIMIT 10;" }` | Executes SQL query and returns rows, execution time, and column types. |

#### Example Response: `POST /db-explorer/api/query`
```json
{
  "success": true,
  "executionTimeMs": 4.2,
  "rowCount": 2,
  "columns": ["id", "email", "status"],
  "rows": [
    { "id": 1, "email": "vendor1@towchen.com", "status": "Approved" },
    { "id": 2, "email": "vendor2@towchen.com", "status": "Pending" }
  ]
}
```

---

## 5. UI Layout & User Experience

The UI will be served directly at `GET /db-explorer`:

1. **Left Sidebar**:
   * Search input to quickly filter tables by name.
   * Scrollable list of all database tables with row count badges.
   * Quick link to switch to the **SQL Query Runner** tab.
2. **Top Navigation / Toolbar**:
   * Active table title & row counter.
   * "Add Record" button.
   * "Refresh" button.
   * "Export (JSON / CSV)" dropdown.
   * Search input for filtering records in the current table.
3. **Main Content Area**:
   * **Data Grid Mode**:
     * Compact table view with fixed header.
     * Click column to sort.
     * Click row to open Inspector / Edit Modal.
     * Delete icon with confirmation modal.
     * Bottom pagination bar (Page indicator, Prev/Next buttons, rows per page selector).
   * **SQL Runner Mode**:
     * Full-width SQL editor with "Run Query" button (`Ctrl+Enter` shortcut).
     * Output grid displaying query results.
     * Error banner showing Postgres syntax error messages and hints if query fails.

---

## 6. Implementation Plan

* [ ] **Step 1: Module Setup**
  * Create `src/modules/db-explorer/` containing `db-explorer.module.ts`, `db-explorer.controller.ts`, and `db-explorer.service.ts`.
  * Register `DbExplorerModule` in `src/app.module.ts`.
* [ ] **Step 2: Database Catalog & Query Engine**
  * Implement PostgreSQL `information_schema` queries for fetching tables, row counts, and column schemas using Prisma's raw client (`prisma.$queryRawUnsafe`).
  * Implement safe dynamic queries for pagination, sorting, search, and CRUD operations.
  * Implement the raw SQL runner with execution timer and error handling.
* [ ] **Step 3: Web Dashboard UI**
  * Build a standalone, self-contained single-page web application (HTML/CSS/JS) styled with modern dark aesthetics.
  * Embed and serve the UI directly via `GET /db-explorer` in NestJS.
* [ ] **Step 4: Verification & Testing**
  * Verify table listing across all Prisma models.
  * Verify pagination, sorting, and search.
  * Verify insert, update, and delete actions.
  * Verify raw SQL execution.
