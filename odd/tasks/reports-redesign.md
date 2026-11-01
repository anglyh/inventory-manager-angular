# Reports redesign

## Objective
Reorganize the reports page around the owner's questions: a "today" snapshot (cash in the open register, inventory value) and period results (income statement cascade, products, payments), with comparison against the previous period.

## Scope
- Backend (`../backend`): `GET /api/report/overview` adds `previous`, `products` (replaces `topSold`/`topProfit`), `flows` (purchases, owner withdrawals) and `inventory` (snapshot).
- Frontend: snapshot strip, income cascade, single products table with sort toggle, payments + cash control, daily chart; default scale `month`, new `year` scale.

## Constraints
- No new tests (user preference); fix broken ones and the OpenAPI snapshot.
- Cash in register comes from `/cash-register/current` (`expectedCash`, ADMIN only); no backend change for it.

## Tasks
- [x] T1 Backend overview: previous period, products list, flows, inventory snapshot — route: inline (patterns already mapped)
- [x] T2 Frontend types (`schema.d.ts`) and service/interfaces — route: inline
- [x] T3 Frontend components and page layout, default month + year scale — route: inline

## Checks
- Backend: `tsc --noEmit`, `vitest run` (snapshot updated).
- Frontend: `ng build --configuration development`.

## Accepted changes
- Comparison range is sent by the client (`compareFrom`/`compareTo`): a period in progress (Oct 1–13) must be compared with the same stretch (Sep 1–13), not with the 13 previous days.
- Periods in progress are queried up to today (`clampToToday`).

## Verification
- Backend: tsc clean; vitest 115 passed (OpenAPI snapshot updated).
- Frontend: ng build OK; comparison ranges checked with Temporal (Oct 1–13 → Sep 1–13, Mar → Feb 1–28, year → same stretch of last year, day → yesterday).
- Pending: SQL of getFlows/getInventorySnapshot not run against a real database (user runs db:reset and tests manually).
- Engram mirror: pending.

## Progress
Commits: not created; the branches hold other uncommitted work, commit only when the user asks.
