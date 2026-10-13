import { Component, computed, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import type { ReportDailyPoint } from '../../interfaces/report.interface';

interface DailyBar {
  date: string;
  revenue: number;
  profit: number;
  /** Alturas en % respecto al día con más ventas. */
  revenueHeight: number;
  profitHeight: number;
}

/** Con más días que esto se omiten las etiquetas por barra. */
const MAX_LABELED_DAYS = 31;

@Component({
  selector: 'report-daily-chart',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './report-daily-chart.html',
})
export class ReportDailyChart {
  daily = input.required<ReportDailyPoint[]>();

  readonly bars = computed<DailyBar[]>(() => {
    const points = this.daily().map((point) => ({
      // Mediodía local: evita que el DatePipe corra la fecha un día por zona horaria.
      date: `${point.date}T12:00:00`,
      revenue: Number(point.revenue),
      profit: Number(point.profit),
    }));
    const max = Math.max(0, ...points.map((point) => point.revenue));

    return points.map((point) => ({
      ...point,
      revenueHeight: max ? (point.revenue / max) * 100 : 0,
      profitHeight: max ? (Math.max(point.profit, 0) / max) * 100 : 0,
    }));
  });

  readonly hasSales = computed(() => this.bars().some((bar) => bar.revenue > 0));
  readonly showLabels = computed(() => this.bars().length <= MAX_LABELED_DAYS);
}
