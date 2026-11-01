# Feature: hostal-rooms (habitaciones, estadías, huéspedes)

Locator: `frontend/odd/tasks/hostal-rooms.md` · Engram mirror: `odd/hostal-rooms/tasks`
Plan detallado: `C:\Users\AngelY\.claude\plans\shimmering-jumping-wilkes.md`

## Objetivo
Gestionar el hostal además de la tienda. Esto incluye:
- Tipos de habitación con sus tarifas.
- Habitaciones y su estado: libre, ocupada o limpieza.
- Check-in con el Registro de Huéspedes legal (DS 001-2015 / 005-2021-MINCETUR).
- Cobro por bloque o por noche, con un adicional sugerido y editable.
- Pagos que entran a la caja.
- Check-out con saldo 0.
- Ingresos de habitaciones en Reportes.

## Restricciones
- El esquema va todo en `backend/migrations/001_init_schema.sql`, sin migraciones nuevas.
- Solo 3 tests: stay-pricing, check-out con saldo y pago sin caja.
- Los tipos se derivan de `schema.d.ts`. Componentes en `features/rooms/components`, páginas en `admin-dashboard/pages`.
- **No commitear** sin pedido explícito del usuario (preferencia del usuario > commits por tarea de ODD).
- No correr `db:reset` ni migraciones: lo hace el usuario.

## Tareas
- [x] T1 Esquema + vistas + seed (backend) — ruta: delegated (writer backend, 2+ archivos)
- [x] T2 room-type / room / store settings: API + configuración (frontend)
- [x] T3 Estadías: check-in, cargo, pago, check-out, limpieza + stay-pricing + tests (backend)
- [x] T4 Tablero /rooms, check-in y detalle (frontend)
- [x] T5 Registro de huéspedes /stays + Migraciones (frontend)
- [x] T6 Reportes: ingresos de habitaciones y ocupación (backend + frontend)

Ruta: backend T1–T3 + T6 backend con un writer delegado; frontend T2, T4–T6 con un segundo writer delegado. Disparador: escritura en 2+ archivos no triviales.

## Criterios de aceptación
- Un segundo check-in en una habitación ocupada da 409.
- El check-out con saldo es rechazado.
- Un pago sin caja abierta es rechazado.
- El efectivo esperado de la caja incluye los pagos en efectivo de las estadías.
- Después del check-out, la habitación queda en limpieza.

## Checks
- Backend: `node_modules/.bin/tsc.exe --noEmit` y `npx vitest run` (`-u` para el snapshot de OpenAPI).
- Frontend: `npx ng build --configuration development`.

## Progreso / evidencia
- Backend (T1, T3, la parte backend de T2 y de T6):
  - `tsc --noEmit` sale con 0.
  - `npx vitest run`: 120 passed y 1 todo, verificado también por el parent.
  - 5 `it` nuevos en 2 archivos: stay-pricing (3) y stay.service (2).
  - Snapshot OpenAPI e inventario actualizados.
  - El SQL y el seed **no** se corrieron contra Postgres.
- Decisiones del writer:
  - La tolerancia es de gracia: si se pasa, se cobra cada hora empezada.
  - El check-out recibe `{extraAmount?, payment?}`. El servidor calcula la sugerencia, y omitir `extraAmount` cobra lo sugerido.
  - Los menores no cuentan para la capacidad.
  - Los ingresos por habitación se cuentan por la fecha del pago. `summary.revenue` sigue siendo solo la tienda, y `netProfit` suma las habitaciones.
- Frontend (T2 UI, T4, T5, T6 UI): `ng build` OK (verificado por el parent). Rutas /rooms, /rooms/:roomId/check-in, /rooms/stay/:id, /rooms/settings (admin), /stays. Sidebar: Habitaciones y Registro de huéspedes. Reportes: KPI Habitaciones y barra apilada. Caja: línea Habitaciones.
- Gaps conocidos: el número y el piso de la habitación no se editan después de crearla; si falla la actualización de una fila, el toggle queda desfasado hasta recargar; el registro de huéspedes muestra un spinner al paginar.
- **Siguiente (2026-10-14):** que el usuario corra `bun run db:reset && bun run db:migrate && bun run db:seed` en el backend, pruebe el flujo manual del plan y ajuste la UI. Commits solo si los pide.
