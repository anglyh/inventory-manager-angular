# Date range filter: one professional picker for every page

## Objective
Every date filter is one button showing the active range ("1 – 26 oct 2026") that opens a panel with quick presets and a range calendar; picking applies instantly.

## Problem
Four pages filter by date with two native `<input type="date">` + "Aplicar":
- `admin-dashboard/pages/expenses-page/expenses-page.html` (from/to + Aplicar)
- `admin-dashboard/pages/guest-register-page/guest-register-page.html` (from/to + Aplicar)
- `admin-dashboard/pages/reports-page/reports-page.html` (custom range: from/to + Aplicar, both max today)
- `features/inventory-movements/components/movement-filters/movement-filters.html` (from/to, applies on change)
The native popup can't be styled, follows the browser locale (shows mm/dd/yyyy on an en-US browser), takes two fields plus an extra click, and has no presets.

## Decisions (owner asked for "more professional, or a library if better" — parent chose, 2026-10-26)
- Library: **Cally** (`cally`, MIT, web components, 0.9.2 from 2026-02-05). daisyUI 5.5.18 already ships `.cally` styles (`node_modules/daisyui/components/calendar.css`) → uses the theme tokens with no extra CSS. Angular: `import 'cally'` + `CUSTOM_ELEMENTS_SCHEMA` in the one component that renders it.
- One shared component `shared/components/date-range-filter/` (`app-date-range-filter`): trigger button with calendar icon + formatted range (es-PE, Lima dates `YYYY-MM-DD`), panel with presets (Hoy, Ayer, Últimos 7 días, Este mes, Mes pasado) and `<calendar-range>` (2 months on desktop, 1 on phone, `locale="es-PE"`, Monday first, `max` = today when the page needs it). Emits `{ from, to }` as soon as a preset is chosen or the second day is picked, then closes. Shows "Limpiar" when the page allows an empty range.
- Pages drop "Aplicar" for dates; behavior (query params / filters) otherwise unchanged.
- Style per `frontend/CLAUDE.md` (app-button default size, floating panel `rounded-box bg-base-100 shadow-lg`, no native select, phone 360px without horizontal scroll).

## Tasks
- [x] T1 Install `cally`; build `app-date-range-filter` (presets + calendar, Lima "today", es-PE label); 1–2 unit tests for the pure preset/format helpers. Route: delegated (one writer, T1–T2; 2+ non-trivial files).
- [x] T2 Replace the four date filters with it; remove the date "Aplicar" buttons; keep each page's URL/state contract.

## Evidence (2026-10-26, writer)
- `npm install cally@0.9.2 --save-exact` → `"cally": "0.9.2"` in package.json (adds `atomico` to the lock).
- RED: `npx ng test --watch=false --include='**/date-range.spec.ts'` → TS2307 cannot find `./date-range` (before the helpers existed).
- GREEN: same command → 1 file, 3 tests passed.
- `npx ng build --configuration development` → bundle generation complete, exit 0, no warnings/errors.
- Style grep (`btn-(sm|xs)|input-sm|badge-xs|select-sm`) on touched files → only the pre-existing `btn-sm` on "Limpiar filtros" in movement-filters (line untouched except its col-span).
- Not browser-tested: owner's manual check (phone 360px + desktop) still pending.

## Notes
- Cally API checked in `node_modules/cally/dist/cally.{js,d.ts}`: `calendar-range` props `value` ("from/to"), `min`, `max`, `today`, `months`, `page-by` (`months`|`single`), `first-day-of-week`, `locale`, `focused-date`; `change` fires once both ends are picked; slots `previous`/`next`/`heading`. Months are wrapped in a `flex` div so two sit side by side.
- `es-PE` short September is "set" (Peru), so tests avoid asserting it.
- Helpers live in `shared/components/date-range-filter/date-range.ts` with their own `limaToday()` (one line of Temporal) instead of importing `features/reports/utils`, so `shared` does not depend on a feature.
- Panel: bottom sheet with dimmed backdrop below `md`; popover under the trigger from `md` (`align` input); two months from `lg` (1024px), one below. Closes on Escape (focus back to trigger), outside click, tabbing out, or after applying.
- Calendar styles (`date-range-filter.css`, encapsulation off, scoped by `.date-range-calendar`): today outlined instead of filled (daisy fills it with `primary`, same as the selection), range ends in `primary`, days between in `base-200`, day text 13px instead of daisy's 11px.
- Expenses and guest register now pass `max = today` to the whole calendar (before only "Desde" had it; Cally has a single `max`).
- Reports: new inputs `compact` (icon-only trigger, `primary` while `scale=custom` or open), `presets=false` (Día/Semana/Mes already cover them). `rangeOpen`/`rangeForm`/`toggleRange` removed; the calendar opens on the current period.
- Movements: one "Fechas" field (`clearable`, placeholder "Todas las fechas") replaces Desde/Hasta; xl grid goes from 5 to 4 columns.

## Checks
- `npx ng build --configuration development` (no errors/warnings).
- `npx ng test --watch=false --include=<new spec>` for the helper tests (if the runner works; `app.spec.ts` is a known stale failure).
- Style grep on touched files: no `-sm`/`-xs` sizes, no raw `btn` buttons outside the documented exceptions.
- Manual (owner): each page on phone (360px) and desktop.

## Next step
Owner's manual check on phone (360px) and desktop; then a work-unit commit.
