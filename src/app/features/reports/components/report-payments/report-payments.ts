import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerCash, tablerDeviceMobile } from '@ng-icons/tabler-icons';
import type { ReportCash, ReportPayments as PaymentsTotals } from '../../interfaces/report.interface';

@Component({
  selector: 'report-payments',
  imports: [DecimalPipe, NgIcon],
  viewProviders: [provideIcons({ tablerCash, tablerDeviceMobile })],
  templateUrl: './report-payments.html',
})
export class ReportPayments {
  payments = input.required<PaymentsTotals>();
  cash = input.required<ReportCash>();

  /** Porcentaje cobrado en efectivo; null si no hubo cobros. */
  readonly cashShare = computed(() => {
    const cash = Number(this.payments().cash);
    const total = cash + Number(this.payments().yape);
    return total > 0 ? (cash / total) * 100 : null;
  });
}
