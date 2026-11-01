# Expenses + report split by business

## Objective
Record hostel costs and general expenses, and show profit separated by business (store / lodging) before the final net profit.

## Problem
- "Ganancia bruta" in reports covers only the store; lodging revenue is added at the end with zero cost, so the owner cannot compare both businesses.
- Expenses (cleaning supplies, toiletries, laundry, streaming, electricity, water, internet, wages, rent) are not recorded; paying them from the drawer is a generic CASH_OUT that never reduces profit.

## Decisions (agreed with the owner, 2026-10-21)
- New "Gastos" module, **admin only** (employees only receive guests and sell).
- Expense categories are an editable catalog. Each category belongs to a group:
  - `LODGING` (costs of the lodging business, subtract from the lodging result). Seed: Útiles de aseo, Artículos de limpieza, Lavandería, Cable y streaming.
  - `GENERAL` (shared, subtract from net profit). Seed: Luz, Agua, Internet, Sueldos, Alquiler, Otros.
- Rule: an expense that exists because of one business is a cost of that business; shared ones (electricity, receptionist wage) are general.
- Expense fields: category, amount, date (Lima day it applies), optional description, source: `CASH_REGISTER` (creates the OUT cash movement in the open register in the same transaction, so expected cash matches) or `OUTSIDE` (Yape/bank/owner's pocket, does not touch the register).
- Report layout: Store (sales − COGS − stock losses = store result), Lodging (payments − lodging costs = lodging result), Total (store + lodging − cash shortage − general expenses = net profit). Net profit value is unchanged when there are no expenses.
- Wording in UI: "útiles de aseo" instead of "amenities".

## Scope / constraints
- Schema in `backend/migrations/001_init_schema.sql` only; user runs db reset/migrate/seed.
- Tests minimal (1–3). No commits unless the user asks.
- Frontend follows `frontend/CLAUDE.md`; types spliced into `schema.d.ts` by block (never regenerate the whole file).

## Tasks
- [x] T1 Backend: expense_category + expense schema, admin-only CRUD API, cash-register integration, seed, tests. Route: delegated (multi-file writer). Evidence: tsc --noEmit OK; vitest 14 files / 123 passed (2 new in `src/tests/services/expense.service.test.ts`); seed typechecked with a temp tsconfig. Not run against a live DB (user runs reset/migrate/seed).
- [x] T2 Backend: report split (store / lodging / total) with expenses. Route: delegated (with T1). Evidence: same tsc/vitest run; OpenAPI inventory fixture + snapshot updated (diff limited to new endpoints/fields and changed descriptions).
- [x] T3 Frontend: Gastos module (list by period, form dialog, categories tab), sidebar entry admin-only. Route: delegated (one writer, with T4). Evidence: `npx ng build --configuration development` OK, no warnings; rg for -sm/-xs sizes in the new expense dirs: 0. Not tested in a browser.
- [x] T4 Frontend: reports show the split. Route: delegated (with T3). Evidence: same build. New `report-business-split` (Tienda / Hospedaje / Total + Gastos del período) under the KPIs; KPI labels renamed to "Ventas tienda", "Ganancia bruta tienda", "Cobros hospedaje".

## Frontend files (T3/T4)
- Types: `src/app/api/generated/schema.d.ts` (spliced: 4 expense paths, 8 expense schemas, ReportOverview replaced).
- Routes/nav: `admin-dashboard/admin-dashboard.routes.ts` (/expenses, /expenses/categories, AdminGuard), `module-tabs.ts` (EXPENSES_TABS), `components/Sidebar/Sidebar.ts` (Gastos, admin-only, subset match).
- Feature: `features/expenses/` (interfaces, services/expense.service.ts, utils/expense-labels.ts, components expense-table, expense-form, expense-category-table, expense-category-form). Reuses `features/rooms/components/delete-confirm-dialog` unchanged.
- Pages: `admin-dashboard/pages/expenses-page`, `admin-dashboard/pages/expense-categories-page`.
- Reports: `features/reports/interfaces/report.interface.ts`, `features/reports/components/report-business-split/*`, `report-kpis.html`, `admin-dashboard/pages/reports-page/*`.

## Next step
User runs backend db reset/migrate/seed, then checks in the browser: register a CASH_REGISTER expense with an open register (expected cash drops), an OUTSIDE one, delete, category CRUD/deactivate, and the reports split at 360px.

## Checks
- Backend: `node_modules/.bin/tsc.exe --noEmit`, `npx vitest run`.
- Frontend: `npx ng build --configuration development`.

## API contract
All endpoints ADMIN only (GUEST gets 403). Money in responses is a string (`"35.50"`); in requests a number.

### Expense categories `/api/expense-category`
- `GET /` → `ExpenseCategory[]` (active first, then group, then name).
- `POST /` body `CreateExpenseCategory { name (1–50), group: 'LODGING'|'GENERAL' }` → 201 `ExpenseCategory`. Duplicate name (case-insensitive) → 409.
- `PATCH /:id` body `UpdateExpenseCategory { name?, group?, isActive? }` → 200 `ExpenseCategory`.
- `DELETE /:id` → 204; 409 "La categoría X tiene gastos registrados: desactívala en su lugar."
- `ExpenseCategory { id, name, group, isActive, expenseCount, createdAt }`.

### Expenses `/api/expense`
- `GET /?from&to&categoryId&group&page=1&limit=20(max 100)` → `ExpensePage { data: Expense[], meta { page, limit, total, totalPages }, totalAmount }`. `from`/`to` are ISO datetimes (same as report/stays), range `[from, to)` converted to Lima days and compared with `spentOn`. `totalAmount` sums every row matching the filters. Order: spentOn desc, createdAt desc.
- `POST /` body `CreateExpense { categoryId, amount (>0, 2 decimals), spentOn? 'YYYY-MM-DD' (default Lima today), description? (≤500, nullable), source: 'CASH_REGISTER'|'OUTSIDE' }` → 201 `Expense`. 409 when: no open register ("Debe abrir una caja para pagar un gasto con dinero de la caja"), not enough cash ("Efectivo insuficiente en la caja para pagar el gasto"), category inactive ("La categoría X está desactivada."). CASH_REGISTER creates a CASH_OUT movement with reason `Gasto: <categoría> — <descripción>` in the same transaction.
- `DELETE /:id` → 204 (CASH_REGISTER also deletes its cash movement); 409 "El gasto salió de una caja ya cerrada: no se puede eliminar."
- `Expense { id, categoryId, categoryName, group, amount, spentOn, description|null, source, cashRegisterId|null, canDelete, createdBy|null, createdByName|null, createdAt }`. `canDelete` = false when it came from a closed register (hide/disable delete).

### Report `GET /api/report/overview` (additions; existing fields unchanged)
- `store { revenue, cogs, grossProfit, losses, result }` — `losses` = stock only (expired + damaged + countShortage − countSurplus); `result = grossProfit − losses`.
- `lodging { revenue, costs, result }` — revenue = stay payments by payment date; costs = LODGING expenses by spentOn.
- `total { storeResult, lodgingResult, cashShortage, generalExpenses, netProfit }` — `netProfit = storeResult + lodgingResult − cashShortage − generalExpenses` (= `summary.netProfit`).
- `expensesByCategory [{ categoryId, name, group, amount }]` sorted by amount desc, only categories with expenses.
- `previous` adds `storeResult, lodgingResult, generalExpenses`; `previous.netProfit` uses the new formula.
- `summary.netProfit` / `summary.marginPct` now subtract expenses (identical when there are none). `summary.losses` keeps its old meaning (includes cash shortage).
- `flows.ownerWithdrawals` excludes CASH_OUT movements linked to an expense.

### Notes
- New stores get the default categories: `UserRepository.create` (register) inserts them in the same statement as the store (`DEFAULT_EXPENSE_CATEGORIES` in `src/schemas/expense.schema.ts`); the seed reads them instead of creating them.
- Generated OpenAPI JSON for the frontend: copied from `backend/src/tests/openapi/__snapshots__/openapi-spec.json` (the reviewed full spec).
