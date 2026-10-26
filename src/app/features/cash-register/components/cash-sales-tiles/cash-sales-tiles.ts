import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { CashRegisterSummary } from '../../interfaces/cash-register.interface';
import { CashAmount } from '../cash-amount/cash-amount';
import { CashStatTile } from '../cash-stat-tile/cash-stat-tile';

/**
 * Ventas del turno (solo ADMIN). Las ventas en efectivo no van acá: ya están en el detalle del efectivo.
 * Las columnas las decide quien lo usa: por defecto una columna, p. ej. `class="sm:grid-cols-3"` para una fila.
 */
@Component({
  selector: 'cash-sales-tiles',
  imports: [DecimalPipe, CashAmount, CashStatTile],
  host: { class: 'grid grid-cols-1 gap-3', role: 'group', 'aria-label': 'Ventas del turno' },
  templateUrl: './cash-sales-tiles.html',
})
export class CashSalesTiles {
  summary = input.required<CashRegisterSummary>();

  readonly salesHint = computed(() => {
    const count = this.summary().salesCount;
    return `${count} ${count === 1 ? 'venta' : 'ventas'}`;
  });

  /** Cobros de estadías: efectivo + Yape. */
  readonly stays = computed(() => Number(this.summary().cashStays) + Number(this.summary().yapeStays));
}
