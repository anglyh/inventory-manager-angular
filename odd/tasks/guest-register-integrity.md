# Guest register integrity

## Objective
Make the legal guest register trustworthy: minors must really be minors, and past stays must keep the guest data as it was at check-in.

## Problem
- `stay_minor` birth dates are not age-checked and minors do not count toward room capacity, so adults can be filed as minors to bypass capacity and falsify the register.
- Age is computed with the UTC date instead of the Lima date.
- `guest` is upserted on every check-in and stays read the live row, so a returning guest's new data rewrites past register entries.

## Scope / constraints
- Backend schema changes go in `migrations/001_init_schema.sql` (no new migration files). User runs db reset/migrate/seed.
- API response shape stays the same where possible (no schema.d.ts change).
- Tests minimal (1-3). No commits unless the user asks.

## Tasks
- [x] T1 Minors validation: reject minor birthDate in the future or age >= 18 (Lima date); age helper uses Lima date; frontend shows the error on the minor's birth date. Route: delegated (backend + frontend, 2+ files).
- [x] T2 Register snapshot: copy guest fields into `stay_guest` at check-in; stay detail and register read the snapshot. Route: delegated (schema + repository + seed).

## Checks
- Backend: `node_modules/.bin/tsc.exe --noEmit`, `npx vitest run`.
- Frontend: `npx ng build --configuration development`.

## Progress
- Prior quick fixes (not part of this feature): removed token console logs; POS double-submit and Enter-without-match.
- T1 (delegated): `stay.service.ts` uses the Lima date (fixed UTC-5) for age; check-in rejects future birth dates (guests and minors) and minors aged 18+. Frontend already had `minorValidator`/`adultValidator` with the Lima date; added the "18 años o más" and "fecha no válida o futura" messages. Test: "check-in rejects a minor aged 18+".
- T2 (delegated): `stay_guest` holds a copy of the guest's legal fields (001_init_schema.sql); `addGuests` copies them from `guest` in the check-in transaction (signature unchanged); stay detail/list, foreign-guest flag and room board holder read `stay_guest`. API shapes unchanged; seed goes through the service (no change). Requires db reset/migrate/seed.
- Verification: backend `tsc --noEmit` exit 0; `npx vitest run` 13 files, 121 passed + 1 todo; frontend `ng build --configuration development` complete.
- Next: user runs `bun run db:reset && bun run db:migrate && bun run db:seed`; native review on the work-unit commit.
