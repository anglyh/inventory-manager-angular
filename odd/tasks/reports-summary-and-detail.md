# Reports: short summary + detail tabs

## Objective
The reports page answers "how am I doing?" in 5 seconds. Detail moves to tabs that are opened only when needed.

## Problem
The default "Resumen" view stacks KPIs, the business split, the daily chart, the snapshot and the payments card. The owner finds it overloaded.

## Decisions (agreed with the owner, 2026-10-21)
- Inverted pyramid: few numbers on top, each compared with the previous period, and one trend chart.
- Tabs: Resumen / Tienda / Hospedaje / Dinero. The "Resultado" breakdown (store + lodging − shortage − general expenses = net) lives inside Resumen behind a "Ver desglose" toggle under net profit, because 5 segments do not fit at 360px.
- Resumen: Ganancia neta (hero), Ingresos totales (store sales + lodging payments), Ganancia bruta, Ocupación %, the daily chart, and a "Requiere atención" block shown only when something needs attention (cash shortage > 0, products to restock > 0, guests not yet reported to Migraciones when cheaply available).
- Tienda: store sales, margin, average ticket, products, losses (stock) and the cash check.
- Hospedaje: lodging payments, occupancy, stays, average payment per stay (lodging revenue / stays; true ADR needs room-nights, not available), lodging costs and lodging result.
- Dinero: how they paid (report-payments), expenses by category, purchases and withdrawals, current register snapshot.
- Frontend only; no backend changes.

## Tasks
- [x] T1 Restructure the reports page into Resumen + 3 detail tabs, reusing existing components; fix the small sizes on the page (btn-sm, input-sm). Route: delegated (one writer; 2+ non-trivial files). Check: `npx ng build --configuration development`.
  - Evidence: `npx ng build --configuration development` → "Application bundle generation complete", no warnings or errors. `rg -n "btn-sm|btn-xs|input-sm|select-sm|text-xs|table-sm" src/app/admin-dashboard/pages/reports-page src/app/features/reports` → 0 matches. Not tested in a browser.
  - Files: reports-page.{ts,html}; report-kpis.{ts,html} (rewritten as the Resumen block: hero + "Ver desglose" + 3 KPIs); report-business-split.{ts,html} (expense list moved out); report-stat-card.{ts,html} (`percent` format, negatives in `text-error`); report-products.html, report-snapshot.html, report-daily-chart.html (default sizes); new report-attention, report-store-detail, report-lodging-detail, report-expenses; new utils/report-math.ts.
  - Skipped: "guests pending Migraciones" — `GET /api/stay` has no migrations filter, so it would need paging all stays client-side or a new endpoint.

- [x] T2 (owner feedback 2026-10-21: still too much; Dinero tab not usable; cash check, losses-by-reason and lodging expenses table not needed; too many top products) Collapse to ONE screen, no tabs: net profit hero + "Ver desglose"; 4 KPIs (Ingresos totales, Ganancia bruta, Ocupación %, Gastos del período); daily chart (hidden on Día); top 5 products with in-place "Ver más"; "Requiere atención" only when needed. Remove from the report: tabs, cash check, losses by reason, lodging expenses table, payments (cash/Yape), purchases/withdrawals. Delete report components left unused. Route: delegated (one writer). Check: build + size rg.
  - Evidence: `npx ng build --configuration development` → "Application bundle generation complete", 0 warning/error lines. `rg -n "btn-sm|btn-xs|input-sm|select-sm|text-xs|text-sm|table-sm|secondary" src/app/admin-dashboard/pages/reports-page src/app/features/reports` → 0 matches. Not tested in a browser.
  - Files: reports-page.{ts,html} (no tabs, `view` param cleared on navigation, no current-register fetch; grid `xl:grid-cols-3`: KPIs full row, chart col-span-2 + products); report-kpis.{ts,html} (hero + attention side by side on lg, 4 KPIs `grid-cols-2 lg:grid-cols-4`, "Gastos del período" with inverted delta); report-attention.{ts,html} (pure `attentionItems()` + `items` input); report-products.{ts,html} (top 5, "Ver más"/"Ver menos", pagination of 10 only when expanded, `@container` hides "Ventas" in narrow cards, pager uses `<app-button>`); report-daily-chart.html (no `text-sm`); report.interface.ts (unused types removed).
  - Deleted: report-snapshot, report-losses, report-payments, report-cash-check, report-store-detail, report-lodging-detail, report-expenses.
  - Expenses delta: previous lodging costs = `previous.roomsRevenue − previous.lodgingResult` (backend `getTotals` runs the same query for both periods and `lodging_result = rooms_revenue − lodging_costs`), plus `previous.generalExpenses`, rounded to cents.
  - Mobile order: hero, breakdown, KPIs, attention, chart, products (attention stays near the top instead of last).

## Checks
- `npx ng build --configuration development`
- `rg -n "btn-sm|btn-xs|input-sm|select-sm|text-xs|text-sm|table-sm|secondary" src/app/admin-dashboard/pages/reports-page src/app/features/reports` → 0.

## Next step
Owner checks the page in the browser (desktop and 360px).
