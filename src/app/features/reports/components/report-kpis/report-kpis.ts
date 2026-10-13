import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { ReportSummary } from '../../interfaces/report.interface';

@Component({
  selector: 'report-kpis',
  imports: [DecimalPipe],
  templateUrl: './report-kpis.html',
})
export class ReportKpis {
  summary = input.required<ReportSummary>();

  readonly isLoss = computed(() => Number(this.summary().netProfit) < 0);
  readonly netProfit = computed(() => Math.abs(Number(this.summary().netProfit)));
}
