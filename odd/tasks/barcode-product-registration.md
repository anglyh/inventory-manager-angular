# Register products by scanning their barcode

## Objective
Registering a product takes seconds: scan the EAN barcode (camera or handheld scanner) → the app checks if it already exists → otherwise it looks the code up in free open databases and prefills the product form for the owner to confirm.

## Research summary (2026-10-26, research agent; [V] = verified with sources)
### Scanning in the browser
- Native `BarcodeDetector`: Chrome Android yes; desktop Chrome only macOS/ChromeOS (NOT Windows/Linux); Safari behind a flag; Firefox no [V, MDN compat data]. → needs a fallback.
- `barcode-detector` (npm, MIT, 3.2.3 2026-10-19): same API as the native one, built on zxing-wasm; ~15 KB gz JS + ~925 KB `zxing_reader.wasm` (loaded from jsDelivr by default; self-hostable via `prepareZXingModule`) [V]. **Chosen.**
- `@zxing/browser` (maintenance mode), `html5-qrcode` (no release since 2023-04 → avoid), `quagga2` (1D only, README warns of false positives) [V].
- Handheld USB/Bluetooth scanners act as a keyboard (digits + Enter): zero-cost, most reliable at the counter [A].
- Camera needs a secure context: `https` or `http://localhost` [V, MDN]. A phone on the LAN over plain http will NOT get the camera.
### Product data sources
| Source | Free | Peru coverage |
|---|---|---|
| Open Food Facts v3 `/api/v3/product/{code}` | yes; custom User-Agent required; 15 product reads/min/IP [V] | best: 2,828 barcodes with prefix 775 (2,455 named, 2,016 with photo, only 685 with categories); Inca Kola 7750182005814 found [V] |
| Open Products Facts / Open Beauty Facts | yes, same API | 45 / 131 Peru products [V] — weak but useful for cleaning/toiletries |
| UPCitemdb trial | 100/day | 0 hits for Peruvian EANs tested [V] → not used |
| EAN-Search, Go-UPC, Barcode Lookup | paid | — |
| Verified by GS1 (GS1 Perú) | no free API (30 manual web queries/day) [V] | — |
| Supermarket sites | — | do not scrape |
Licences: OFF database ODbL, images CC BY-SA → show attribution "Datos: Open Food Facts".
Expected: good hits for big-brand foods/drinks; weak for cleaning, toiletries and small local brands; names often generic ("Gaseosa") and categories usually missing → the owner always confirms.

## Decisions (taken by the parent while the owner was away — REVIEW)
- Device: support both paths — camera scanner (native `BarcodeDetector` when it supports `ean_13`, else the `barcode-detector` ponyfill lazy-loaded) and the barcode text field (handheld scanner types + Enter).
- Formats: `ean_13`, `ean_8`, `upc_a`, `upc_e`. Accept a code after the same value is read twice in a row and its GTIN check digit is valid.
- Lookup chain on the backend: own products (same store) → in-memory cache → Open Food Facts → Open Products Facts → Open Beauty Facts → not found (manual entry). UPCitemdb not used.
- Cache: in-memory (TTL 24 h for hits, 6 h for misses), no new table → no DB reset needed. A persistent cache table is a follow-up if needed.
- Outbound limit: max 15 external lookups/min (in-process); over the limit → "no suggestion" (manual entry), never an error.
- User-Agent: `HostalManager/1.0` + optional contact from env `OFF_USER_AGENT`. The owner's email is NOT sent to third parties.
- Images: only shown as a preview from the URL in the suggestion (not stored). No contributing back to OFF.
- Suggested name: Spanish name (`product_name_es`) or generic name + brand + quantity, e.g. "Inca Kola Gaseosa 1.5 L"; category left for the owner (OFF categories don't match ours); barcode filled.
- Existing barcode in the store → don't create a duplicate: tell the owner and offer to edit that product.
- wasm loaded from jsDelivr (default) in v1; self-hosting is a follow-up.
- No commits (owner reviews first).

## Tasks
- [x] T1 Backend: `GET /api/product/barcode-lookup/:code` (same access as product creation), GTIN validation, lookup chain with timeouts (≈4 s per source), cache, limiter, mapping; OpenAPI path + snapshot + inventory; tests (1–3 with mocked fetch: own product short-circuits, OFF mapping, miss is cached). Route: delegated (one writer, T1–T3).
  - Evidence: RED `vitest run barcode-lookup.service.test.ts` → failed (module `services/barcode-lookup.service` missing); GREEN 6/6; full suite 16 files, 131 passed + 1 todo (baseline 15 files, 125 + 1 todo); `tsc --noEmit` exit 0; snapshot diff limited to `BarcodeLookup` + the new path (+124 lines); inventory line `GET /api/product/barcode-lookup/{code} [200,400,401,403,500,503]`. Live OFF call for 7750182005814 → `product_name_es: "Gaseosa"`, brand "Inca kola", quantity "1.5 lt." → suggestion "Gaseosa Inca kola 1.5 lt."; unknown code → HTTP 404 (treated as miss).
  - Notes: ADMIN-only (`requireAdmin` inline, before `/:id`). Own-product match includes deactivated products (the unique index `product_store_barcode_unique` covers them). Limiter counts one slot per lookup chain (each source is called at most once per chain → each host ≤ 15/min). Suggested name capped at 50 chars (product name max), not 100. Name falls back to the brand when the source has no name.
- [x] T2 Frontend scanner: `barcode-scanner` component (modal with `<video playsinline muted>`, camera start/stop, native or ponyfill detector, double-read + check digit, torch toggle when supported, clear messages for no camera / permission denied / insecure context), `npm install barcode-detector`.
  - Evidence: `barcode-detector@3.2.3` installed; ponyfill import path `barcode-detector/ponyfill` (exports `BarcodeDetector`, static `getSupportedFormats`, `detect`) verified in `node_modules/barcode-detector/package.json` exports + `dist/es/core.d.ts`; `ng build --configuration development` OK, 0 warnings, ponyfill in its own lazy chunk (`ponyfill`, 66.56 kB). Not browser-tested.
  - Notes: the scanner owns its `<app-modal>` (`open` input, `scanned` / `manualRequested` / `closed` outputs) because the modal content is always rendered; the camera starts/stops from `open`. UPC-E reads are expanded to UPC-A before the check digit (`features/products/utils/gtin.ts`). Retry button on camera errors (not on insecure context).
- [x] T3 Frontend registration flow: products page "Escanear" action (scan → existing product → edit; else → new product form prefilled); product form barcode field with scan button and lookup on Enter (handheld scanner); suggestion block (image, source attribution, "revisa antes de guardar"); prefill only empty fields; schema.d.ts splice; service method.
  - Evidence: `schema.d.ts` +71 lines (path + `BarcodeLookup` blocks copied from `openapi-typescript` output of the current backend spec, generated in a temp dir; nothing else regenerated); `ng build` OK; style grep → only the pre-existing `btn-xs` in `search-product-form.html` (untouched). Not browser-tested.
  - Notes: `Product.barcode` typed `string | null` (was `null`). The suggestion block hides itself when the barcode field changes. "Editarlo" in the form's existing-product hint loads that product by id and swaps the form to edit it. Escanear is admin-only (same as the endpoint) and icon-only on phones.

## Checks
- Backend: `node_modules/.bin/tsc.exe --noEmit`, `npx vitest run`.
- Frontend: `npx ng build --configuration development` (no warnings/errors; scanner lazy-loaded), style rules per `frontend/CLAUDE.md`.
- Manual (owner): on `http://localhost` with a webcam/phone (via HTTPS tunnel) scan Inca Kola 1.5 L (7750182005814) → suggestion; scan an existing product → edit offered; type a code + Enter → same flow.

## Open questions for the owner
1. Which device will register products most: phone, Windows laptop or a handheld scanner? (A handheld scanner, ~S/ 60–120, is the most reliable.)
2. Keep product images (needs an image field + attribution) or not?
3. Share new products back to Open Food Facts (needs an OFF account) or keep them private?
