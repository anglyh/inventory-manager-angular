# Frontend: estilo visual

Estas reglas fijan **el aspecto**: colores, superficies, bordes, tipografía y componentes base. **Cómo se organiza y presenta la información** (jerarquía, layout, qué mostrar y qué ocultar) no está definido acá: para eso usá la skill de diseño (`/impeccable`, modo *product*), respetando estas reglas.

Tema: `src/styles.css` (daisyUI 5 + Tailwind v4, tema `inventory`). No agregues colores hardcodeados: usá los tokens.

## Colores
- **Fondo de página**: `bg-base-200`. **Superficies** (cards, tablas, paneles): `bg-base-100`.
- **Acción principal**: `primary` (carbón `#171717`). Una sola acción primaria por zona.
- **Texto secundario**, íconos y etiquetas: `text-neutral`.
- **Estados**: `success`, `warning`, `error` e `info` (OKLCH con la misma luminosidad, definidos en el tema). Fondo suave **siempre** con el token fijo: `bg-success-soft text-success`. Nada de opacidad (`bg-success/15`) ni `badge-soft`: cambian de tono según el fondo.
- **El color es una señal, no decoración**: el estado normal va en neutro (`bg-base-200 text-neutral`) y el color se reserva para lo que pide atención (deuda, vencido, por reponer, error). Si todo tiene color, nada resalta.
- Montos negativos o pérdidas en `text-error`; positivos o "a favor" en `text-success`. No colorees montos neutros.
- **Excepción: tableros de estado** (habitaciones en `/rooms`). Ahí el estado *es* la información y cada uno lleva su color: libre `success`, ocupada neutro, limpieza `warning`, vencida `error` (franja lateral + badge con punto).

## Superficies, bordes y sombras
- **Sin bordes y sin sombras** en cards y paneles: el contraste lo da `bg-base-100` sobre `bg-base-200`. No uses `.surface`, `border`, `card-border` ni `shadow-*` en superficies nuevas.
- Para separar dentro de una card: un fondo suave (`bg-base-200/60 rounded-field`) o `border-base-200` en las filas de una tabla. Nunca recuadros con borde.
- **Excepción**: lo que flota sobre el contenido lleva `shadow-lg` (dropdowns, menús, popovers).
- Radios: `rounded-box` para cards, `rounded-field` para bloques internos y controles. No uses `rounded-full` en botones.

## Tipografía
- Poppins. Tamaños del tema: `text-title` (24), `text-subtitle` (20), `text-body` (16) y `text-caption` / `<small>` (12).
- Los números grandes van en `font-semibold`, no en negrita extra (`stat-value` de daisy trae 800: hay que bajarlo).
- Montos y cantidades siempre con `tabular-nums`. Formato de dinero: `S/ 0.00` (`number: '1.2-2'`).
- Poco texto: etiquetas cortas. La explicación va en `title` o en un hint `text-neutral`, no en párrafos.

## Componentes base (obligatorios)
- **Botones**: siempre `<app-button>` (`shared/components/button`) con el tamaño por defecto (**no** pases `size`). Variantes: `primary`, `ghost`, `outline` y `error`. Para botones de solo ícono, `customClass="btn-circle"` y `ariaLabel`. Excepción: elementos clickeables que no se ven como botón (una card entera, un desplegable de texto) usan `<button>` sin clases `btn`.
- **Elegir una opción entre pocas** (vista, escala, tipo, método de pago): `<app-segmented-control>` (`shared/components/segmented-control`), con `surface="page"` sobre el fondo gris o `surface="card"` dentro de una card.
- **Filtros de página** (historial, catálogos, movimientos): botones píldora sueltos, con el activo en `primary`, como en `cash-register-history-page`.
- **Diálogos**: `<app-modal>`. **Paginación**: `<app-pagination>`.
- **Badges de estado**: `badge badge-sm border-0` con el fondo suave del estado.
- **Desplegables**: `dropdown` de daisy con `menu ... rounded-box bg-base-100 p-1 shadow-lg`. Al elegir una opción, soltá el foco para cerrarlo (`blurActive()`). No uses `<select>` nativo cuando importa el estilo de la lista.

## Tamaños y espaciado
- **Todo en su tamaño por defecto**: nada de `table-sm`/`table-xs`, `input-sm`, `select-sm`, `btn-sm`/`btn-xs` ni `badge-xs`. Mezclar tamaños rompe la coherencia: si algo no entra, se reorganiza (columnas ocultas en el celular, dos líneas en una celda), no se achica.
- Tablas: `table` normal dentro de una card `bg-base-100 rounded-box p-4 sm:p-5`, con la primera y la última columna sin padding lateral (`pl-0` / `pr-0`), como en `product-table`.
- Badges: `badge badge-sm` es el único tamaño para estados.
- Tablas con menú de acciones (⋯): **sin `overflow-x-auto`** en el contenedor. Cualquier `overflow` también recorta en vertical y el menú queda escondido dentro de la tabla. En el celular, ocultá columnas en vez de hacer scroll.

## Responsive
- Pensado primero para el celular: a la izquierda y derecha 16px (`p-4`) y sin scroll horizontal de la página.
- En grillas, `min-w-0` en los hijos. En tablas, ocultá columnas secundarias en el celular (`hidden sm:table-cell`) antes de achicar el texto.
