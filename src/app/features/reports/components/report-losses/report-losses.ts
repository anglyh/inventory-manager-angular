import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { ProductLoss, ReportLosses as LossesBreakdown } from '../../interfaces/report.interface';

@Component({
  selector: 'report-losses',
  imports: [DecimalPipe],
  templateUrl: './report-losses.html',
})
export class ReportLosses {
  losses = input.required<LossesBreakdown>();
  total = input.required<string>();
  topLosses = input.required<ProductLoss[]>();

  /** Desglose por motivo; los sobrantes de conteo restan. */
  readonly rows = computed(() => {
    const losses = this.losses();
    return [
      { label: 'Vencidos', amount: losses.expired, sign: '' },
      { label: 'Dañados', amount: losses.damaged, sign: '' },
      { label: 'Faltantes de conteo', amount: losses.countShortage, sign: '' },
      { label: 'Sobrantes de conteo', amount: losses.countSurplus, sign: '−' },
    ].filter((row) => Number(row.amount) > 0);
  });
}
