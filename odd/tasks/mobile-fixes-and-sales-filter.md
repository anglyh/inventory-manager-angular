# Mobile layout fixes + sales category filter

## Objective
No horizontal page overflow on phones (~360–400px) and a category filter in the POS.

## Problem (from user screenshots)
- `/movements` (movements history): page wider than the viewport on mobile; filter pills row shows a scrollbar and pushes the header (avatar cut off). Amounts use `S/.` instead of `S/`.
- `/products`: module tabs (Productos / Categorías / Proveedores) overflow with a scrollbar; the product table overflows the card (Precio column cut) since its `overflow-x-auto` wrapper was removed.
- `/stays` (guest register): content overflows on mobile; its in-page title "Registro de huéspedes" repeats the layout header title.
- `/sales`: no category filter.

## Scope / constraints
- Follow `frontend/CLAUDE.md` (no small sizes, no horizontal page scroll, hide secondary columns on mobile, no `overflow-x-auto` around tables with ⋯ menus, money format `S/ 0.00`).
- Frontend only. Tests: none (layout); verify with build. No commits unless the user asks.

## Tasks
- [x] T1 Fix mobile overflow on movements, products (tabs + table), guest register; remove repeated guest register title. Route: delegated (multi-file). Evidence: build OK; layout reasoned from code (no browser).
- [x] T2 Review other pages for the same overflow patterns and fix. Route: delegated. Evidence: build OK.
- [x] T3 Category filter in `/sales`. Route: delegated. Evidence: build OK; `ProductOption.categoryName` exists in the API schema.

## Checks
- `npx ng build --configuration development`

## Progress / evidence
- `npx ng build --configuration development`: success, 0 warnings/errors.
- `rg -n "S/\." src/app`: 0 matches.

### Files changed
- T1: `features/inventory-movements/components/movement-filters/movement-filters.html` (pills wrap), `.../inventory-movement-list/inventory-movement-list.html` (`min-w-0` on collapse rows), `shared/components/module-tabs/module-tabs.ts` (no overflow, `max-w-full`), `shared/components/segmented-control/segmented-control.html` (buttons shrink, label truncates, `px-3 sm:px-4`), `features/products/components/product-table/product-table.html` (name column truncates), `admin-dashboard/pages/guest-register-page/guest-register-page.html` (title removed), `features/rooms/components/guest-register-table/guest-register-table.html` (no overflow wrapper, Migraciones column hidden on mobile with badge under the date, cells wrap); `S/.` -> `S/` in inventory-movements and products components.
- T2: `features/cash-register/components/cash-register-movement-table/cash-register-movement-table.html` ("Registrado por" hidden on mobile), `admin-dashboard/pages/sales-page/sales-page.html` (aside `min-w-92` only from `lg`).
- T3: `admin-dashboard/pages/sales-page/sales-page.ts|html` (`category-multiselect-filter`, filters by `categoryName` combined with search).

### Pending (outside allowed edit surface)
- Root cause of header/avatar cut on long titles: `dashboard-layout.html` `.drawer-content` grid has an implicit `auto` column, so the navbar's min-content (long `h1` title) widens the column past the viewport. Fix: add `grid-cols-[minmax(0,1fr)]` to `.drawer-content`.

- Layout fix applied by parent (inline): `grid-cols-[minmax(0,1fr)]` on `.drawer-content`.

## Next step
User checks pages in the browser at 360px.
