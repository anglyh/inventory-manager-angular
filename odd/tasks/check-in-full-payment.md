# Check-in always charges the full rate

## Objective
No stay starts unpaid ("no se da fiado"): the backend charges the full rate at check-in. Later payments (extra hours, extending) keep working through `POST /api/stay/:id/payment`.

## Problem
`checkInSchema.advance` is optional (`backend/src/schemas/stay.schema.ts:72`): a check-in without `advance` creates an unpaid stay, and `advance` may be partial. The frontend form no longer offers "pay later" (done 2026-10-26), but the API still allows it. The seed creates ~20% half-paid stays.

## Decisions (owner, 2026-10-26)
- Replace `advance?: { paymentMethod, amount }` with a required `paymentMethod` (CASH | YAPE). The server charges `amount` (the rate) in full — no client-sent payment amount, so it cannot be partial.
- Check-in always requires an open register (locked first, same order as today).
- Rate `amount` of 0 (courtesy) creates no payment row.
- Later payments and extra charges unchanged.

## Tasks
- [x] T1 Backend: schema, service, seed (always full payment), tests (1 new: check-in leaves balance 0 / requires an open register), OpenAPI snapshot. Route: delegated (one writer, T1+T2).
  - Evidence: new test `check-in charges the full rate to the open register` RED (addPayment called 0 times) then GREEN; `tsc --noEmit` exit 0; seed typecheck (temp tsconfig including `scripts/seed.ts`) exit 0; snapshot diff limited to the `CheckIn` block (advance removed, required `paymentMethod` added), updated with `-u`; `npx vitest run` 14 files, 124 passed + 1 todo. Not run against a live DB.
- [x] T2 Frontend: splice `CheckIn` in `src/app/api/generated/schema.d.ts` (by block, never regenerate the whole file); check-in form sends `paymentMethod`.
  - Evidence: `CheckIn` block spliced by hand; `PaymentMethod` type now `CheckInRequest['paymentMethod']`; no `advance` left in `src/app`; `npx ng build --configuration development` complete, 0 warnings/errors.

## Checks
- Backend: `node_modules/.bin/tsc.exe --noEmit`, `npx vitest run` (update the OpenAPI snapshot with `-u` only for this intended change).
- Frontend: `npx ng build --configuration development`.

## Next step
Owner runs `bun run db:reset && bun run db:migrate && bun run db:seed` and checks a check-in in the browser.
