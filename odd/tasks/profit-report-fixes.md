# Profit report fixes

## Objective
Make the report's profit figures honest and readable: split gross profit by business, net cash differences, separate inventory losses from count surpluses, let a wrong stay payment be voided, and stop count surpluses from entering stock at cost 0.

## Decisions (owner, 2026-10-28)
- Gross profit shown per business: store (sales − COGS) and hostal (room revenue − lodging expenses; backend already has `lodging_result`).
- Daily chart "Te quedó" = store gross + hostal result per day (today: store gross only).
- Show cash vs Yape split and "Compras del período" (merchandise bought in the period, `flows.purchases`).
- Remove owner withdrawals and expenses by category everywhere they are fetched but not needed (backend + frontend), and any other report data left unused after this.
- Cash register: profit uses the net difference (shortages − surpluses); the summary shows shortages and surpluses separately.
- "Mermas" split into two lines: losses (expired, damaged, count shortage) and count surpluses, each with its own sign; no double negatives.
- Stay payments: **void with reason** (same rule as sales), never edit. Voided payments leave the balance, the cash register and the reports.
- Count surplus on a product with no known cost (`unit_cost_avg` null/0): **rejected by the backend** with "«X» no tiene costo. Registrá primero una carga inicial o una compra." The product still appears in the count; equal or lower counts keep working.

## Tasks
- [x] T1 Report backend: net cash difference in net profit (expose shortage and surplus); daily series includes hostal result; remove owner withdrawals and expenses by category from the contract. 1 test.
- [x] T2 Report UI: two gross KPIs (tienda / hostal), chart "Te quedó" with both, cash vs Yape, compras del período, caja faltantes/sobrantes, mermas split into pérdidas/sobrantes; remove the withdrawals/categories plumbing.
- [x] T3 Count surplus without cost rejected (backend rule + UI shows the message). 1 test.
- [ ] T4 Void stay payment with reason: schema in `001_init_schema.sql`, views and report queries exclude voided payments, API, stay detail UI. 1–2 tests. Owner must run `db:reset` + migrate + seed (not run by the agent).

Route: delegated (one writer at a time; two repos and 2+ non-trivial files per task).

## Checks
- Backend: `node_modules/.bin/tsc.exe --noEmit`, `npx vitest run` (update the OpenAPI snapshot with `-u` when the contract changes and review its diff).
- Frontend: `npx ng build --configuration development`, `npx ng test --watch=false`.
- `schema.d.ts` spliced by hand block by block (never regenerated whole).
- Work-unit commit per task per repo (Conventional Commits, no AI attribution, no push).

## Progress
- T1 done (backend `4d2444f`). T2 done (frontend, commit with this update). T3 done (backend `0353059`, no frontend source change).
- Next: T4.

## Evidence
- T1 RED: `npx vitest run src/tests/services/report.repository.test.ts` failed before the change (net SQL had no `+ cash_surplus`).
- T1 GREEN: `node_modules/.bin/tsc.exe --noEmit` exit 0; `npx vitest run` 18 files, 140 passed, 1 todo; OpenAPI snapshot updated with `-u`, diff limited to the report contract. Read-only run of `getTotals`/`getDailySales`/`getFlows` against the dev DB: net = storeResult + lodgingResult − shortage + surplus − general (7651.97 + 1770 − 77.50 + 6.80 − 1463 = 7888.27).
- T2: `npx ng build --configuration development` OK; `npx ng test --watch=false` 2 files, 5 passed.
- T3 RED: new test in `inventory-movement.service.test.ts` (stock count with counted 3 vs stock 1, `unitCostAvg` null) failed with "promise resolved undefined instead of rejecting".
- T3 GREEN: `node_modules/.bin/tsc.exe --noEmit` exit 0; `npx vitest run` 18 files, 141 passed, 1 todo. Backend commit `0353059`. Frontend: no source change, so build/tests not rerun.

## Notes
- Contract: `store.losses` = expired + damaged + count shortage; `store.countSurplus` new; `store.result` = gross − losses + countSurplus (same value as before). `total.cashSurplus` new; net uses shortage − surplus. `daily[].lodgingResult` new.
- Removed from the contract: `summary.losses` (included the cash shortage), `expensesByCategory`, `flows.ownerWithdrawals`, `cash`, `losses`, `topLosses` (none used by the UI; `total` carries the cash figures).
- T3: the count UI posts `{ notes, items: [{ productId, countedQuantity }] }` to `/stock-counts`; `registerStockCount` derives COUNT_SURPLUS/COUNT_SHORTAGE items and runs them through `processItems`, where the rule lives (rejects COUNT_SURPLUS when `unitCostAvg` is null or ≤ 0, before any insert; the whole count rolls back). `stock-count-page` shows CONFLICT messages verbatim via `resolveApiError` + error toast.
- UI: 8 KPI cards (ingresos, bruta tienda, bruta hostal, ocupación, efectivo, Yape, gastos, compras); breakdown shows Pérdidas / Sobrantes de conteo and Faltantes / Sobrantes de caja (only when nonzero); chart bars = ingresos with "Te quedó" (store gross + hostal result) inside.
