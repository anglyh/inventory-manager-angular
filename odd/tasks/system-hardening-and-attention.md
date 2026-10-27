# System hardening and "needs attention" follow-ups

## Objective
Close the blind-close leak, surface what the owner must act on (Migraciones, restock), make scanning and errors smoother, and clarify report copy.

## Decisions (owner, 2026-10-27)
- Point 1: blind close must be enforced by the backend, not only hidden in the UI.
- Point 2: Migraciones pending in "Requiere atención"; "Por reponer" must open a filtered products list; continuous camera scanning in the POS; backend error messages in plain Spanish.
- Point 3: cash-shortage attention text made clearer; "Ganancia en ventas" back to **"Ganancia bruta"** (owner preference, parent agrees: standard term, explained with a hint).
- Point 4: old styles must follow `frontend/CLAUDE.md` (separate task); stale `app.spec.ts` removed (done, f954824). Self-hosting the zxing wasm: explain first, not implemented. Seed: later.

## Tasks
- [x] T1 Blind close in the backend: a non-admin (role `GUEST`) never receives the expected cash nor the totals that reveal it (open register and close responses); admins keep everything. Frontend keeps working with the reduced payload. 1 test.
  - Evidence: RED `cash-register.repository.test.ts` "only the sales count in blind SQL" failed before the change; GREEN after. Backend `tsc --noEmit` OK, `vitest run` 134 passed (snapshot `-u`: only the summary schema changed). Frontend build OK, `ng test` 5 passed (`cashBreakdown` with `{ salesCount }` lists only "Fondo inicial"). Commits: backend `23e90c8`, frontend `92c6d05`.
  - Notes: GUEST only reaches `GET /current` and `/current/movements` (history/detail are `requireAdmin`; open/close/movement return no summary). The blind summary is now `{ salesCount }`; every amount in `summary` is optional and admin-only in OpenAPI. Not fixed (open question): a GUEST can still probe the expected cash by trying withdrawals (`canWithdraw` accepts or rejects by amount).
- [x] T2 Migraciones pending: report overview exposes how many stays with foreign guests are not reported yet (current snapshot, not period); "Requiere atención" shows it and links to the guest register filtered to pending ones (backend filter + frontend filter). 1 test.
  - Evidence: RED `stay.repository.test.ts` (strict query schema rejected `migrations`), GREEN after. Backend `tsc --noEmit` OK, `vitest run` 135 passed (snapshot `-u`: only `migrations` param and `ReportOverview.migrations`). Frontend build OK, `ng test` 5 passed. Commits: backend `6c0c1d0`, frontend `bff8f94`.
  - Notes: "foreign" = a `stay_guest` copy with document CE, PASSPORT or PTP (same rule as `hasForeignGuests`); helpers `hasForeignGuest` / `pendingMigrations` moved to `backend/src/repositories/sql.ts`. API: `GET /api/stay?migrations=pending`, `ReportOverview.migrations.pendingCount`. UI: `/stays?migrations=pending` hides the date range (any date) and shows a removable chip; the attention item links there. Not browser-tested.
- [x] T3 Products "Por reponer": `GET /api/product` supports a low-stock filter; products page shows it as a removable filter; the report's restock item links there. 1 test.
- Evidence: RED `product.repository.test.ts` "stock=low" failed (no `p.stock <= p.min_stock` in the SQL), GREEN after. Backend `tsc --noEmit` OK, `vitest run` 136 passed (snapshot `-u`: only the `stock` query param). Frontend build OK, `ng test` 5 passed. Commits: backend `887591a`, frontend (this task's commit).
  - Notes: `GET /api/product?stock=low` = active products with `stock <= min_stock` (same rule as `inventory.lowStockCount`), ordered by `stock - min_stock`, then name. `/products?stock=low` shows a "Por reponer" button that becomes a removable chip; the restock attention item links there. Not browser-tested.
- [ ] T4 POS continuous camera scan: in the POS the scanner stays open and adds each product (same code ignored for ~2 s), with a visible count of what was added; other pages keep single-scan.
- [ ] T5 Plain-Spanish backend errors: zod default messages in Spanish (zod v4 locale) and validation errors without technical field paths where the UI shows them. 1 test.
- [ ] T6 Report copy: cash shortage item → "Faltaron S/ X al cerrar caja" + detail "N cierres con menos dinero del esperado · se resta de tu ganancia" (backend count of shortage closes); "Ganancia en ventas" → "Ganancia bruta" with hint "Ventas menos lo que te costó la mercadería vendida".
- [ ] T7 Style sweep: every page/component follows `frontend/CLAUDE.md` (no `.surface`, borders/shadows on cards, `-sm`/`-xs` sizes, raw `btn` buttons outside the documented exceptions, native selects where styling matters). Route: separate writer after T1–T6.

Route: T1–T6 delegated (one writer, two repos, 2+ non-trivial files per task); T7 delegated afterwards (broad sweep).

## Checks
- Backend: `node_modules/.bin/tsc.exe --noEmit`, `npx vitest run` (update the OpenAPI snapshot with `-u` when the contract changes and review its diff).
- Frontend: `npx ng build --configuration development`, `npx ng test --watch=false`.
- `schema.d.ts` spliced by hand block by block (never regenerated whole).
- Work-unit commit per task (Conventional Commits, no AI attribution, no push).
