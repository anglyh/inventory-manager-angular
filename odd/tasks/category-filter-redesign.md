# Category filter: chips in POS, instant multi-select in products

## Objective
Filtering by category is one tap in the POS and instant + visible in the products catalog, matched by category id.

## Problem
`features/categories/components/category-multiselect-filter` (used by `/products` and `/sales`): 3 steps (open → check → "Aplicar"); only a count shows what is filtered; "Todas" clears and applies; matches by normalized category NAME (renames break URL filters); violates `frontend/CLAUDE.md` (btn-sm, checkbox-sm, menu-sm, shadow-xl, raw buttons, opacity text).

## Decisions (owner, 2026-10-26)
- `/sales` (POS): a row of single-select chips "Todas N", "Bebidas N"… (product count per chip), one tap filters, chips wrap (no horizontal page scroll). Combined with the search.
- `/products`: multi-select dropdown that filters instantly on each check (no "Aplicar"); selected categories shown as removable chips (✕) next to the search; a "Sin categoría" option; "Limpiar" when something is selected.
- Both filter by category id. The POS product options must include `categoryId` (backend change). The products list filter by id (and "none") — use what the backend already supports, or extend it.
- URL keeps the products filter (shareable); POS chip selection can be local state.
- Style per `frontend/CLAUDE.md`.

## Tasks
- [x] T1 Backend: POS product options include `categoryId`; products list supports filtering by category ids and "no category" if it doesn't already. Tests minimal (1), OpenAPI snapshot. Route: delegated (one writer, T1–T3).
  - Evidence: `GET /api/product` query `category` (names) replaced by `categoryId` (comma list of UUIDs and/or `none`, 400 on anything else) → repository `(p.category_id = ANY($n::uuid[]) OR p.category_id IS NULL)`; `ProductOption.categoryId` added (schema + SELECT). New `src/tests/services/product.repository.test.ts`: RED (schema accepted 'Bebidas') → GREEN. Snapshot diff limited to those two blocks; `spec-inventory.txt` unchanged (lists status codes only). `tsc --noEmit` 0; `vitest run` 125 passed, 1 todo. `models/product.model.ts` (outside edit surface) not updated: `ProductOption` type lacks `categoryId` (runtime row has it).
- [x] T2 Frontend `/sales`: category chips (single select, counts) replacing the dropdown.
  - Evidence: `schema.d.ts` spliced (ProductOption + products query param). Chips "Todas N" + one per category present in the POS list (count, sorted es), local `categoryId` signal; tap active chip again → all; stale selection falls back to all. Search + Enter → first match unchanged. Build clean.
- [x] T3 Frontend `/products`: instant multi-select + removable chips + "Sin categoría", by id; remove or rewrite the old component if unused.
  - Evidence: `category-multiselect-filter` rewritten in place (only user now): daisy `dropdown` + `menu … shadow-lg`, each checkbox emits immediately, "Sin categoría" (`none`), chips with ✕, "Limpiar" (`app-button` ghost); Escape/click-outside close by focus loss. URL `?categoryId=uuid1,none` (non-UUID values ignored). Footer `text-sm`/`btn-sm`/`menu-sm` removed; "Nuevo producto" → `app-button`. Build clean; size rg on touched dirs → 0. Not browser-tested.

## Checks
- Backend: `node_modules/.bin/tsc.exe --noEmit`, `npx vitest run`.
- Frontend: `npx ng build --configuration development`; size rg on touched dirs → 0.

## Next step
Owner checks `/sales` and `/products` on desktop and at 360px.
