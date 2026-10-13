import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { CashRegister } from '../../interfaces/cash-register.interface';
import { absoluteAmount, DIFFERENCE_CLASS, differenceSign, differenceTone } from '../../shared/cash-register-format';

interface SummaryRow {
  label: string;
  value: string;
  sign?: '+' | '−';
}

@Component({
  selector: 'cash-register-summary',
  imports: [DecimalPipe],
  templateUrl: './cash-register-summary.html',
})
export class CashRegisterSummary {
  register = input.required<CashRegister>();

  readonly differenceClass = DIFFERENCE_CLASS;
  readonly differenceTone = differenceTone;
  readonly differenceSign = differenceSign;
  readonly absoluteAmount = absoluteAmount;

  /** Solo se listan los campos presentes: cierres antiguos no tienen resumen y GUEST no recibe el esperado. */
  readonly salesRows = computed<SummaryRow[]>(() => {
    const summary = this.register().summary;
    if (!summary) return [];
    return [
      { label: 'Ventas en efectivo', value: summary.cashSales },
      { label: 'Ventas por Yape', value: summary.yapeSales },
      { label: `Total de ventas · ${summary.salesCount}`, value: summary.totalSales },
    ];
  });

  readonly cashRows = computed<SummaryRow[]>(() => {
    const register = this.register();
    const summary = register.summary;
    const rows: SummaryRow[] = [{ label: 'Fondo inicial', value: register.openingAmount }];
    if (summary) {
      rows.push(
        { label: 'Ventas en efectivo', value: summary.cashSales, sign: '+' },
        { label: 'Aportes', value: summary.cashIn, sign: '+' },
        { label: 'Retiros', value: summary.cashOut, sign: '−' },
      );
      // El esperado en vivo de una caja abierta queda fuera de alcance: solo se muestra el congelado al cierre.
      if (register.status === 'CLOSED' && summary.expectedCash !== undefined) rows.push({ label: 'Esperado', value: summary.expectedCash });
    }
    if (register.closingAmount !== null) rows.push({ label: 'Contado', value: register.closingAmount });
    return rows;
  });

  readonly difference = computed(() => this.register().summary?.difference ?? null);
}
