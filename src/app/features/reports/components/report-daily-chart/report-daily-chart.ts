import { Component, computed, input, linkedSignal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import type { ReportDailyPoint } from '../../interfaces/report.interface';

interface ChartBar {
  date: string;
  revenue: number;
  profit: number;
  /** Ingresos por habitaciones: se apilan sobre las ventas. */
  rooms: number;
  /** Alturas en % respecto a la barra más alta (ventas + habitaciones). */
  revenueHeight: number;
  profitHeight: number;
  roomsHeight: number;
}

/** Con más días que esto se omiten las etiquetas por barra. */
const MAX_LABELED_DAYS = 31;
/** Con más días que esto (p. ej. un año) se agrupa por mes. */
const MAX_DAILY_BARS = 62;

@Component({
  selector: 'report-daily-chart',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './report-daily-chart.html',
})
export class ReportDailyChart {
  daily = input.required<ReportDailyPoint[]>();

  readonly monthly = computed(() => this.daily().length > MAX_DAILY_BARS);

  readonly bars = computed<ChartBar[]>(() => {
    const groups = new Map<string, { revenue: number; profit: number; rooms: number }>();
    for (const point of this.daily()) {
      // Mediodía local: evita que el DatePipe corra la fecha un día por zona horaria.
      const key = this.monthly() ? `${point.date.slice(0, 7)}-01T12:00:00` : `${point.date}T12:00:00`;
      const group = groups.get(key) ?? { revenue: 0, profit: 0, rooms: 0 };
      group.revenue += Number(point.revenue);
      group.profit += Number(point.profit);
      group.rooms += Number(point.rooms);
      groups.set(key, group);
    }

    const points = [...groups].map(([date, totals]) => ({ date, ...totals }));
    const max = Math.max(0, ...points.map((point) => point.revenue + point.rooms));

    return points.map((point) => ({
      ...point,
      revenueHeight: max ? (point.revenue / max) * 100 : 0,
      profitHeight: max ? (Math.max(point.profit, 0) / max) * 100 : 0,
      roomsHeight: max ? (point.rooms / max) * 100 : 0,
    }));
  });

  /** Barra elegida (hover o toque): su detalle se muestra debajo. Se limpia al cambiar los datos. */
  readonly selected = linkedSignal<ChartBar[], ChartBar | null>({ source: this.bars, computation: () => null });

  readonly hasSales = computed(() => this.bars().some((bar) => bar.revenue > 0 || bar.rooms > 0));
  readonly hasRooms = computed(() => this.bars().some((bar) => bar.rooms > 0));
  readonly showLabels = computed(() => this.bars().length <= MAX_LABELED_DAYS);
  readonly labelFormat = computed(() => (this.monthly() ? 'MMM' : 'd'));
  readonly tipFormat = computed(() => (this.monthly() ? 'MMMM y' : 'EEE d MMM'));
}
