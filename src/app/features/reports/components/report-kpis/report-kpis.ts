import { Component, computed, input, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerChevronDown } from '@ng-icons/tabler-icons';
import type {
  InventorySnapshot,
  ReportLodging,
  ReportMigrations,
  ReportPrevious,
  ReportRooms,
  ReportStore,
  ReportSummary,
  ReportTotal,
} from '../../interfaces/report.interface';
import { change, percent, plural } from '../../utils/report-math';
import { ReportStatCard } from '../report-stat-card/report-stat-card';
import { ReportBusinessSplit } from '../report-business-split/report-business-split';
import { ReportAttention, attentionItems } from '../report-attention/report-attention';

/**
 * Resumen: la ganancia neta manda (con su desglose a pedido), los avisos al lado
 * y debajo ingresos, ganancia bruta, ocupación y gastos.
 */
@Component({
  selector: 'report-kpis',
  imports: [ReportStatCard, ReportBusinessSplit, ReportAttention, NgIcon],
  viewProviders: [provideIcons({ tablerChevronDown })],
  templateUrl: './report-kpis.html',
})
export class ReportKpis {
  summary = input.required<ReportSummary>();
  previous = input.required<ReportPrevious>();
  rooms = input.required<ReportRooms>();
  store = input.required<ReportStore>();
  lodging = input.required<ReportLodging>();
  total = input.required<ReportTotal>();
  inventory = input.required<InventorySnapshot>();
  migrations = input.required<ReportMigrations>();
  /** Período comparado, p. ej. "1 – 13 sep 2026". */
  compareLabel = input('');

  readonly breakdownOpen = signal(false);

  readonly attention = computed(() => attentionItems(this.total(), this.inventory(), this.migrations()));

  /** Sin avisos, la ganancia neta ocupa todo el ancho. */
  readonly heroClass = computed(() => (this.attention().length ? 'lg:col-span-2' : 'lg:col-span-4'));

  readonly netChange = computed(() => change(this.total().netProfit, this.previous().netProfit));

  readonly netHint = computed(() => {
    const label = this.compareLabel();
    return `Margen ${percent(Number(this.summary().marginPct))}${label ? ` · vs ${label}` : ''}`;
  });

  /** Ventas de la tienda + cobros del hospedaje. */
  readonly revenue = computed(() => Number(this.store().revenue) + Number(this.lodging().revenue));
  readonly revenueChange = computed(() =>
    change(this.revenue(), Number(this.previous().revenue) + Number(this.previous().roomsRevenue)),
  );
  readonly revenueHint = computed(
    () => `${plural(this.summary().salesCount, 'venta', 'ventas')} · ${plural(this.rooms().stays, 'estadía', 'estadías')}`,
  );

  readonly grossChange = computed(() => change(this.store().grossProfit, this.previous().grossProfit));
  readonly grossHint = computed(() => {
    const revenue = Number(this.store().revenue);
    return revenue ? `Margen ${percent((Number(this.store().grossProfit) / revenue) * 100)}` : 'Tienda';
  });

  readonly occupancyHint = computed(() => plural(this.rooms().stays, 'estadía', 'estadías'));

  /** Gastos registrados: los del hospedaje más los generales. */
  readonly expenses = computed(() => Number(this.lodging().costs) + Number(this.total().generalExpenses));

  /**
   * El período anterior no trae los costos del hospedaje, pero salen exactos:
   * resultado del hospedaje = cobros − costos (misma consulta para ambos períodos).
   */
  readonly expensesChange = computed(() => {
    const prev = this.previous();
    const prevLodgingCosts = Number(prev.roomsRevenue) - Number(prev.lodgingResult);
    // Redondeo a centavos: la resta en coma flotante puede dejar restos (0.0000001 ≠ 0).
    const prevExpenses = Math.round((prevLodgingCosts + Number(prev.generalExpenses)) * 100) / 100;
    return change(this.expenses(), prevExpenses);
  });

  toggleBreakdown() {
    this.breakdownOpen.update((open) => !open);
  }
}
