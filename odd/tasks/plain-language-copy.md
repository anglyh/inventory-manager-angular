# Plain-language UI copy

## Objective
UI text reads natural for a small hostal owner and a receptionist in Peru, not technical or accounting jargon.

## Problem
Owner feedback (2026-10-22): the cash "Movimiento" button is not understood; Aporte/Retiro and their quick reasons sound technical ("Inyección de monedas", "Retiro de seguridad", "Fondo adicional para vuelto"). Other screens likely have similar wording ("Importe", "gaveta", "Arqueo de cierre", "Esperado"…). Some copy uses Rioplatense voseo ("Tocá una barra") while the app uses neutral "tú".

## Decisions
- Register: neutral Spanish with "tú" (Peru), short, friendly, concrete. No voseo, no slang, no accounting jargon when a plain word exists.
- Keep common Peruvian business words that owners use: "caja", "vuelto", "sencillo", "Yape/Plin", "merma", "fondo".
- Glossary (starting point; writer may refine with judgment, keeping consistency):
  - "Movimiento" (button) → "Poner o sacar dinero" (short variant on mobile if needed: "Dinero").
  - Dialog "Movimiento de efectivo" → "Poner o sacar dinero"; options "Aporte"/"Retiro" → "Poner dinero"/"Sacar dinero".
  - "Importe" → "Monto". "gaveta" → "caja". "Excede el efectivo disponible en gaveta" → "No hay tanto efectivo en la caja".
  - Quick reasons, in: "Sencillo para dar vuelto", "Más monedas", "Devolución de un préstamo" (or similar plain wording); out: "Compra para la tienda", "Pago de delivery", "Pago de un servicio", "Guardar dinero fuera de la caja".
  - Breakdown labels: "Aportes" → "Dinero que se puso", "Retiros" → "Dinero que se sacó" (or "Entradas extra"/"Salidas"), "Esperado" → "Debería haber", "Contado" → "Contaste" / "Dinero contado", "Arqueo de cierre" → "Conteo al cerrar", "Diferencia" stays; "Cuadrada" stays.
- Only user-facing strings change: no API values, enum values, identifiers, routes or query params. Backend error messages are out of scope (noted as follow-up).
- No commits unless the owner asks.

## Tasks
- [x] T1 Cash register copy (button, dialogs, quick reasons, breakdown, detail, history, opening/closing). Route: delegated (one writer, T1+T2).
  - Evidence: 58 strings changed (see Changes · T1); `cash-breakdown.spec.ts` labels updated → 2 passed; dev build clean.
- [x] T2 Project-wide pass: find and rewrite technical/jargon/voseo copy in the rest of `src/app` (sales, products, inventory movements, losses, stock count, initial load, catalogs, rooms/stays, guest register, expenses, reports, team, auth, shared components, error-mapper). List each change (old → new) in this document.
  - Evidence: 50 strings changed (see Changes · T2); dev build clean (0 warnings/errors); voseo/jargon search → 0 matches outside `api/generated`.

## Checks
- `npx ng build --configuration development` (no warnings/errors).
- `npx ng test --watch=false --include src/app/features/cash-register/utils/cash-breakdown.spec.ts` (labels may be asserted; update the spec if a label changed).
- `rg -n "Tocá|Elegí|Mirá|Probá|Ingresá|Hacé|podés|tenés|querés|gaveta|Importe|Inyección" src/app` → 0 (justify any left).

## Glossary applied
- Action: "Poner dinero" / "Sacar dinero" (together: "Poner o sacar dinero"; mobile button: "Dinero").
- The list of those: "Entradas y salidas"; each row says "Se puso" / "Se sacó".
- Breakdown: "Dinero que se puso", "Dinero que se sacó", "Debería haber". Hint: "Fondo + lo que entró − lo que salió".
- Closing: dialog "Cerrar caja", field "¿Cuánto contaste?"; detail hero "Conteo al cerrar" with "Dinero contado" / "Debería haber".
- "Observación" → "Nota"; "Importe" → "Monto"; "gaveta" → "caja"; "Carga inicial" → "Stock inicial".
- Kept on purpose: "Fondo inicial", "Cuadrada", "Faltante" / "Sobrante" (badges; owners use them), "Diferencia", "Conteo físico", "Punto de venta", "Merma", inventory "Movimientos" (product stock history, a different concept from cash), guest-register legal terms ("Registro de huéspedes", "Migraciones", document types, "Acreditación").

## Changes
Paths are relative to `src/app`. Code comments that mentioned "gaveta"/"importe" were also updated (not listed).

### T1 · Caja (58)
- `features/cash-register/components/cash-movement-dialog/cash-movement-dialog.html`: `label="Registrar movimiento"` → `label="Poner o sacar dinero"`
- `features/cash-register/components/cash-movement-dialog/cash-movement-dialog.html`: `Movimiento de efectivo` → `Poner o sacar dinero`
- `features/cash-register/components/cash-movement-dialog/cash-movement-dialog.html`: `'Entra dinero a la gaveta' : 'Sale dinero de la gaveta'` → `'El dinero entra a la caja' : 'El dinero sale de la caja'`
- `features/cash-register/components/cash-movement-dialog/cash-movement-dialog.html`: `label="Tipo de movimiento"` → `label="¿Pones o sacas dinero?"`
- `features/cash-register/components/cash-movement-dialog/cash-movement-dialog.html`: `Importe` → `Monto`
- `features/cash-register/components/cash-movement-dialog/cash-movement-dialog.html`: `Excede el efectivo disponible en gaveta.` → `No hay tanto efectivo en la caja.`
- `features/cash-register/components/cash-movement-dialog/cash-movement-dialog.html`: `Disponible en gaveta: S/` → `Debería haber en caja: S/`
- `features/cash-register/components/cash-movement-dialog/cash-movement-dialog.html`: `placeholder="Ej.: cambio en monedas"` → `placeholder="¿Para qué es el dinero?"`
- `features/cash-register/components/cash-movement-dialog/cash-movement-dialog.html`: `'Registrar aporte' : 'Registrar retiro'` → `'Poner dinero' : 'Sacar dinero'`
- `features/cash-register/components/cash-movement-dialog/cash-movement-dialog.ts`: `CASH_IN: ['Fondo adicional para vuelto', 'Inyección de monedas', 'Devolución de dinero'],` → `CASH_IN: ['Sencillo para dar vuelto', 'Más monedas', 'Devolución de un préstamo'],`
- `features/cash-register/components/cash-movement-dialog/cash-movement-dialog.ts`: `CASH_OUT: ['Compra urgente de insumos', 'Pago de delivery o flete', 'Pago de servicios menores', 'Retiro de seguridad'],` → `CASH_OUT: ['Compra para la tienda', 'Pago de delivery', 'Pago de un servicio', 'Guardar dinero fuera de la caja'],`
- `features/cash-register/components/cash-movement-dialog/cash-movement-dialog.ts`: `{ value: 'CASH_IN', label: 'Aporte' }` → `{ value: 'CASH_IN', label: 'Poner dinero' }`
- `features/cash-register/components/cash-movement-dialog/cash-movement-dialog.ts`: `{ value: 'CASH_OUT', label: 'Retiro' }` → `{ value: 'CASH_OUT', label: 'Sacar dinero' }`
- `features/cash-register/components/cash-movement-dialog/cash-movement-dialog.ts`: `'Ingresa el importe.'` → `'Ingresa el monto.'`
- `features/cash-register/components/cash-movement-dialog/cash-movement-dialog.ts`: `'Ingresa un importe mayor a cero, con hasta dos decimales.'` → `'Ingresa un monto mayor a cero, con hasta dos decimales.'`
- `features/cash-register/components/cash-movement-dialog/cash-movement-dialog.ts`: `'Indica el motivo del movimiento.'` → `'Escribe para qué es el dinero.'`
- `features/cash-register/components/cash-register-session/cash-register-session.html`: button "Movimiento" → "Poner o sacar dinero" (mobile: "Dinero" via `sm:hidden` / `hidden sm:inline`; `ariaLabel` "Poner o sacar dinero")
- `features/cash-register/components/cash-register-session/cash-register-session.html`: `Efectivo esperado en caja` → `Debería haber en caja`
- `features/cash-register/components/cash-register-session/cash-register-session.html`: `Fondo + ingresos − retiros` → `Fondo + lo que entró − lo que salió`
- `features/cash-register/components/cash-register-session/cash-register-session.html`: guest tile "Movimientos" / hint "Aportes y retiros" → "Entradas y salidas" / "Dinero puesto o sacado"
- `features/cash-register/components/cash-register-movement-table/cash-register-movement-table.html`: `Movimientos de caja` → `Entradas y salidas`
- `features/cash-register/components/cash-register-movement-table/cash-register-movement-table.html`: `Aportes y retiros de efectivo` → `Dinero que se puso o sacó de la caja`
- `features/cash-register/components/cash-register-movement-table/cash-register-movement-table.html`: `[title]="result.meta.total + ' movimientos'"` → `[title]="result.meta.total + ' en total'"`
- `features/cash-register/components/cash-register-movement-table/cash-register-movement-table.html`: `No se pudieron cargar los movimientos.` → `No se pudieron cargar las entradas y salidas.`
- `features/cash-register/components/cash-register-movement-table/cash-register-movement-table.html`: `aria-label="Cargando movimientos"` → `aria-label="Cargando entradas y salidas"`
- `features/cash-register/components/cash-register-movement-table/cash-register-movement-table.html`: `Aún no hay movimientos` → `Aún no hay entradas ni salidas`
- `features/cash-register/components/cash-register-movement-table/cash-register-movement-table.html`: `Los aportes y retiros aparecerán aquí.` → `Aquí verás el dinero que se ponga o se saque.`
- `features/cash-register/components/cash-register-movement-table/cash-register-movement-table.html`: `{{ isIn ? 'Aporte' : 'Retiro' }}` → `{{ isIn ? 'Se puso' : 'Se sacó' }}`
- `features/cash-register/components/cash-register-movement-table/cash-register-movement-table.html`: `aria-label="Paginación de movimientos"` → `aria-label="Páginas de entradas y salidas"`
- `features/cash-register/components/cash-register-opening/cash-register-opening.html`: `Cuenta el fondo de la gaveta para empezar el turno.` → `Cuenta el dinero con el que empiezas el turno.`
- `features/cash-register/components/cash-register-opening/cash-register-opening.html`: `Observación (opcional)` → `Nota (opcional)`
- `features/cash-register/components/cash-register-opening/cash-register-opening.html`: `placeholder="Ej.: fondo entregado por administración"` → `placeholder="Ej.: el sencillo lo dejó el dueño"`
- `features/cash-register/components/close-register-dialog/close-register-dialog.html`: `label="Arqueo y cierre"` → `label="Cerrar caja"`
- `features/cash-register/components/close-register-dialog/close-register-dialog.html`: `Arqueo y cierre` → `Cerrar caja`
- `features/cash-register/components/close-register-dialog/close-register-dialog.html`: `Cuenta todo el efectivo de la gaveta e ingresa el total.` → `Cuenta todo el efectivo de la caja y escribe el total.`
- `features/cash-register/components/close-register-dialog/close-register-dialog.html`: `Efectivo contado` → `¿Cuánto contaste?`
- `features/cash-register/components/close-register-dialog/close-register-dialog.html`: `Esperado` → `Debería haber`
- `features/cash-register/components/close-register-dialog/close-register-dialog.html`: `Observación (opcional)` → `Nota (opcional)`
- `features/cash-register/components/close-register-dialog/close-register-dialog.html`: `placeholder="Motivo de un descuadre u otras observaciones"` → `placeholder="Si falta o sobra dinero, cuenta por qué"`
- `features/cash-register/components/close-register-dialog/close-register-dialog.ts`: `'Ingresa el efectivo contado.'` → `'Ingresa cuánto contaste.'`
- `features/cash-register/components/close-register-dialog/close-register-dialog.ts`: `Hay un descuadre (${label} S/ ${Math.abs(diff).toFixed(2)}). Agrega una observación para cerrar.` → `${label} S/ ${Math.abs(diff).toFixed(2)}. Escribe en la nota por qué, para poder cerrar.`
- `features/cash-register/components/cash-register-summary/cash-register-summary.html`: `Arqueo de cierre` → `Conteo al cerrar`
- `features/cash-register/components/cash-register-summary/cash-register-summary.html`: `Contado` → `Dinero contado`
- `features/cash-register/components/cash-register-summary/cash-register-summary.html`: `Esperado` → `Debería haber`
- `features/cash-register/components/cash-register-summary/cash-register-summary.html`: `El esperado se fija al cerrar la caja` → `El total se calcula al cerrar la caja`
- `features/cash-register/components/cash-register-summary/cash-register-summary.html`: `Fondo + ingresos − retiros` → `Fondo + lo que entró − lo que salió`
- `features/cash-register/components/cash-register-summary/cash-register-summary.html`: `Observaciones` → `Notas`
- `features/cash-register/components/cash-register-summary/cash-register-summary.html`: `Apertura` → `Al abrir`
- `features/cash-register/components/cash-register-summary/cash-register-summary.html`: `Cierre` → `Al cerrar`
- `features/cash-register/components/cash-sales-tiles/cash-sales-tiles.html`: `hint="Ventas digitales"` → `hint="Cobrado en ventas"`
- `features/cash-register/utils/cash-breakdown.ts`: `label: 'Aportes'` → `label: 'Dinero que se puso'`
- `features/cash-register/utils/cash-breakdown.ts`: `label: 'Retiros'` → `label: 'Dinero que se sacó'`
- `features/cash-register/utils/cash-breakdown.ts`: `label: 'Esperado'` → `label: 'Debería haber'`
- `admin-dashboard/pages/cash-register-page/cash-register-page.ts`: `this.notification.show('Movimiento registrado');` → `this.notification.show(body.type === 'CASH_IN' ? 'Dinero puesto en la caja' : 'Dinero sacado de la caja');`
- `admin-dashboard/pages/cash-register-page/cash-register-page.ts`: `'No se pudo registrar el movimiento.'` → `'No se pudo guardar. Inténtalo de nuevo.'`
- `admin-dashboard/pages/cash-register-page/cash-register-page.html`: `No se pudo consultar la caja` → `No se pudo cargar la caja`
- `admin-dashboard/pages/cash-register-page/cash-register-page.html`: `Consultando la caja…` → `Cargando la caja…`
- `admin-dashboard/pages/cash-register-detail-page/cash-register-detail-page.html`: `En curso` → `Sigue abierta`

### T2 · Ventas y compras (6)
- `admin-dashboard/pages/sales-page/sales-page.html`: `aria-label="Consultando el estado de la caja"` → `aria-label="Revisando la caja"`
- `admin-dashboard/pages/sales-page/sales-page.html`: `Ir a sección de caja` → `Ir a la caja`
- `admin-dashboard/pages/sales-page/sales-page.html`: `Venta Actual` → `Venta actual`
- `admin-dashboard/pages/sales-page/sales-page.ts`: `'Abre o actualiza la caja antes de registrar una venta'` → `'No hay una caja abierta. Ábrela para vender.'`
- `admin-dashboard/pages/sales-page/sales-page.ts`: `'Venta registrada exitosamente'` → `'Venta registrada'`
- `admin-dashboard/pages/purchases-page/purchases-page.ts`: `'Compra registrada exitosamente'` → `'Compra registrada'`

### T2 · General (layout, avisos, errores, validaciones, login) (13)
- `admin-dashboard/layouts/dashboard-layout/dashboard-layout.html`: `aria-label="open sidebar"` → `aria-label="Abrir menú"`
- `admin-dashboard/layouts/dashboard-layout/dashboard-layout.ts`: `?? 'Dashboard',` → `?? 'Inicio',`
- `api/error-mapper.ts`: `'El recurso no existe'` → `'No se encontró: puede que se haya eliminado.'`
- `auth/pages/login-page/login-page.ts`: `'Credenciales inválidas'` → `'Correo o contraseña incorrectos'`
- `shared/components/global-notification/global-notification.html`: `'Error' : 'Éxito'` → `'Error' : 'Listo'`
- `utils/form-utils.ts`: `'Este campo es requerido'` → `'Completa este campo'`
- `utils/form-utils.ts`: `Mínimo de ${errors['minlength'].requiredLength} caracteres.` → `Debe tener al menos ${errors['minlength'].requiredLength} caracteres.`
- `utils/form-utils.ts`: `Valor mínimo de ${errors['min'].min}` → `Debe ser ${errors['min'].min} o más`
- `utils/form-utils.ts`: `El valor ingresado no es un correo electrónico` → `Escribe un correo válido`
- `utils/form-utils.ts`: `El correo electrónico ya está siendo usado por otro usuario` → `Ese correo ya lo usa otra cuenta`
- `utils/form-utils.ts`: `El formato ingresado no es válido` → `Revisa el formato`
- `utils/form-utils.ts`: `Error de validación no controlado` → `Revisa este campo`
- `api/error-mapper.ts`: `DB_ERROR → backend message ("Base de datos no disponible")` → `No se pudo conectar. Inténtalo de nuevo en un momento.`

### T2 · Gastos (2)
- `admin-dashboard/pages/expenses-page/expenses-page.ts`: `'También se quita su salida de la caja: el efectivo esperado vuelve a subir.'` → `'Ese dinero vuelve a contar como parte de la caja.'`
- `features/expenses/components/expense-category-form/expense-category-form.html`: `Hospedaje: existe por las habitaciones (útiles de aseo, lavandería). General: compartido (luz, sueldos).` → `Hospedaje: gastos de las habitaciones (útiles de aseo, lavandería). General: gastos de todo el negocio (luz, sueldos).`

### T2 · Inventario (stock inicial, mermas, movimientos, conteo) (18)
- `admin-dashboard/admin-dashboard.routes.ts`: `title: 'Carga inicial',` → `title: 'Stock inicial',`
- `admin-dashboard/components/Sidebar/Sidebar.ts`: `{ label: 'Carga inicial',` → `{ label: 'Stock inicial',`
- `features/inventory-movements/shared/movement-labels.ts`: `INITIAL_LOAD: 'Carga inicial',` → `INITIAL_LOAD: 'Stock inicial',`
- `features/inventory-movements/shared/movement-labels.ts`: `{ value: 'loss', label: 'Pérdidas' }` → `{ value: 'loss', label: 'Mermas' }`
- `admin-dashboard/pages/initial-load-page/initial-load-page.ts`: `'Carga inicial registrada'` → `'Stock inicial registrado'`
- `admin-dashboard/pages/initial-load-page/initial-load-page.ts`: `'No se pudo registrar la carga inicial. Intenta nuevamente.'` → `'No se pudo registrar el stock inicial. Intenta nuevamente.'`
- `features/inventory-movements/components/initial-load-form/initial-load-form.html`: `Carga inicial` → `Stock inicial`
- `features/inventory-movements/components/initial-load-form/initial-load-form.html`: `placeholder="Busca un producto sin movimientos"` → `placeholder="Busca un producto sin historial"`
- `features/inventory-movements/components/initial-load-form/initial-load-form.html`: `emptyText="No hay productos sin movimientos con ese nombre"` → `emptyText="No hay productos sin historial con ese nombre"`
- `features/inventory-movements/components/initial-load-form/initial-load-form.html`: `'Todos los productos ya tienen movimientos'` → `'Todos los productos ya tienen historial'`
- `features/inventory-movements/components/initial-load-form/initial-load-form.html`: `Registrar carga inicial` → `Registrar stock inicial`
- `features/inventory-movements/components/loss-form/loss-form.html`: `Resultante` → `Queda`
- `features/inventory-movements/components/loss-form/loss-form.html`: `title="Stock resultante"` → `title="Stock que queda"`
- `features/inventory-movements/components/loss-form/loss-form.html`: `Impacto en stock` → `Sale del stock`
- `features/inventory-movements/components/movement-filters/movement-filters.html`: `Dirección` → `Entradas o salidas`
- `features/inventory-movements/components/stock-count-form/stock-count-form.html`: `Hay cantidades no válidas` → `Revisa las cantidades marcadas`
- `features/inventory-movements/components/void-movement-dialog/void-movement-dialog.ts`: `'Se descontará el stock ingresado y se restaurará el costo anterior.'` → `'Se quitará el stock que entró y el costo vuelve al de antes.'`
- `features/inventory-movements/shared/movement-form-utils.ts`: `'Revisa los datos del formulario.'` → `'Revisa los datos marcados.'`

### T2 · Productos (2)
- `features/products/components/product-form/product-form.ts`: `'Producto actualizado correctamente' : 'Producto creado correctamente'` → `'Producto actualizado' : 'Producto creado'`
- `features/products/components/product-form/product-form.html`: `{{ productInitialData()?.id ? 'Actualizar' : 'Guardar' }}` → `Guardar`

### T2 · Reportes (6)
- `features/reports/components/report-attention/report-attention.ts`: `Faltante de caja ${money(shortage)}` → `Faltó ${money(shortage)} en caja`
- `features/reports/components/report-attention/report-attention.ts`: `hint: 'Cajas cerradas con menos efectivo del esperado',` → `hint: 'Cajas que cerraron con menos dinero del que debía haber',`
- `features/reports/components/report-business-split/report-business-split.html`: `− Faltante de caja` → `− Faltó en caja`
- `features/reports/components/report-kpis/report-kpis.html`: `label="Ganancia bruta"` → `label="Ganancia en ventas"`
- `features/reports/components/report-kpis/report-kpis.html`: `'Ocultar desglose' : 'Ver desglose'` → `'Ocultar detalle' : 'Ver detalle'`
- `features/reports/components/report-daily-chart/report-daily-chart.html`: `Tocá una barra para ver el detalle` → `Toca una barra para ver el detalle`

### T2 · Habitaciones y estadías (3)
- `features/rooms/components/stay-charge-dialog/stay-charge-dialog.html`: `Importe` → `Monto`
- `features/rooms/components/room-form/room-form.html`: `Ocupada: el tipo se cambia después del check-out.` → `Ocupada: el tipo se puede cambiar cuando el huésped salga.`
- `features/rooms/components/room-table/room-table.html`: `'Ocupada: haz el check-out primero'` → `'Ocupada: primero registra la salida'`

## Verification
- `npx ng test --watch=false --include src/app/features/cash-register/utils/cash-breakdown.spec.ts`: 1 file, 2 tests passed.
- `npx ng build --configuration development`: exit 0, 0 warnings, 0 errors.
- `rg -n "Tocá|Elegí|Mirá|Probá|Ingresá|Hacé|podés|tenés|querés|gaveta|Importe|Inyección" src/app`: 0 matches (case-insensitive "importe" only remains in `api/generated/schema.d.ts`, backend text, out of scope).
- Not browser-tested: the 360px fit of the new "Dinero" / "Poner o sacar dinero" button and the longer labels was reasoned from the layout, not seen.

## Backend follow-ups (not edited)
Technical messages the API can return (seen in `api/generated/schema.d.ts`):
- "El efectivo inicial debe ser un importe no negativo con máximo dos decimales" → e.g. "Ingresa un monto desde 0, con hasta dos decimales".
- "Debe explicar la diferencia entre el efectivo contado y el esperado" → e.g. "Escribe en la nota por qué falta o sobra dinero".
- "La operación no puede realizarse con el estado actual" → say what to do (e.g. "La caja ya está cerrada").
- "page debe ser >= 1 y limit debe estar entre 1 y 100", "ID de caja inválido", "Token no proporcionado", "Recurso no encontrado", "El registro ya existe", "Error de validación" (generic), "Internal server error" (English), "Acceso denegado. Se requiere ser Administrador".
- "Base de datos no disponible": now masked in the frontend (`DB_ERROR` → "No se pudo conectar. Inténtalo de nuevo en un momento.").
- Cash-movement reasons already saved in old records keep the old wording ("Inyección de monedas", …); only new quick reasons changed.

## Next step
Owner reads the screens and flags anything still unclear.
