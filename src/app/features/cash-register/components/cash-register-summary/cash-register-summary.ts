import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerCheck, tablerNotes, tablerTrendingDown, tablerTrendingUp } from '@ng-icons/tabler-icons';
import type { CashRegister } from '../../interfaces/cash-register.interface';
import { absoluteAmount, DIFFERENCE_VIEW, differenceSign, differenceTone } from '../../shared/cash-register-format';
import { cashBreakdown } from '../../utils/cash-breakdown';
import { CashAmount } from '../cash-amount/cash-amount';
import { CashBreakdownList } from '../cash-breakdown-list/cash-breakdown-list';
import { CashSalesTiles } from '../cash-sales-tiles/cash-sales-tiles';

/** Detalle de una caja: arqueo (contado vs esperado), desglose del efectivo, ventas y observaciones. */
@Component({
  selector: 'cash-register-summary',
  imports: [DecimalPipe, NgIcon, CashAmount, CashBreakdownList, CashSalesTiles],
  viewProviders: [provideIcons({ tablerCheck, tablerNotes, tablerTrendingDown, tablerTrendingUp })],
  host: { class: 'block' },
  templateUrl: './cash-register-summary.html',
})
export class CashRegisterSummary {
  register = input.required<CashRegister>();

  readonly differenceView = DIFFERENCE_VIEW;
  readonly differenceTone = differenceTone;
  readonly differenceSign = differenceSign;
  readonly absoluteAmount = absoluteAmount;

  /** El esperado en vivo de una caja abierta se ve en la pantalla de Caja; aquí solo el congelado al cierre. */
  readonly cashRows = computed(() => {
    const register = this.register();
    // Sin la fila "Esperado": el arqueo de arriba ya lo muestra junto a lo contado.
    return cashBreakdown(register, { includeExpected: false });
  });

  readonly closingAmount = computed(() => this.register().closingAmount);
  readonly expected = computed(() =>
    this.register().status === 'CLOSED' ? (this.register().summary?.expectedCash ?? null) : null,
  );
  readonly difference = computed(() => this.register().summary?.difference ?? null);

  /** La columna derecha (ventas y observaciones) puede quedar vacía en cierres antiguos. */
  readonly hasAside = computed(() => {
    const register = this.register();
    return !!register.summary || !!register.notes || !!register.closingNotes;
  });
}
