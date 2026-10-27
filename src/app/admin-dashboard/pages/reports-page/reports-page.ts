import { Component, computed, effect, inject, linkedSignal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerChevronLeft, tablerChevronRight } from '@ng-icons/tabler-icons';
import { DateRangeFilter } from '@/shared/components/date-range-filter/date-range-filter';
import type { DateRangeValue } from '@/shared/components/date-range-filter/date-range';
import type { ReportOverview, ReportScale } from '@/features/reports/interfaces/report.interface';
import { ReportsService } from '@/features/reports/services/reports.service';
import {
  clampToToday,
  formatRangeLabel,
  getComparisonRange,
  getLimaTodayPlainDate,
  getPeriodRange,
  isCurrentPeriod,
  limaPlainDateToEndISO,
  limaPlainDateToStartISO,
  parsePlainDate,
  shiftAnchor,
} from '@/features/reports/utils/lima-profit-range';
import { SegmentedControl } from '@/shared/components/segmented-control/segmented-control';
import { ReportKpis } from '@/features/reports/components/report-kpis/report-kpis';
import { ReportProducts } from '@/features/reports/components/report-products/report-products';
import { ReportDailyChart } from '@/features/reports/components/report-daily-chart/report-daily-chart';
import { Button } from '@/shared/components/button/button';
import { resolveApiError } from '@/shared/utils/api-error';

type ReportMode = ReportScale | 'custom';

const SCALES: { value: ReportScale; label: string }[] = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
];

/** Escala al entrar sin parámetros: un mes muestra tendencia; un solo día casi no dice nada. */
const DEFAULT_SCALE: ReportScale = 'month';

@Component({
  selector: 'app-reports-page',
  imports: [
    SegmentedControl,
    DateRangeFilter,
    NgIcon,
    Button,
    ReportKpis,
    ReportProducts,
    ReportDailyChart,
  ],
  viewProviders: [provideIcons({ tablerChevronLeft, tablerChevronRight })],
  templateUrl: './reports-page.html',
})
export class ReportsPage {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private reportsService = inject(ReportsService);

  readonly scales = SCALES;
  readonly today = getLimaTodayPlainDate();

  /**
   * La URL es la fuente de verdad:
   * - `?scale=day|week|month|year&date=YYYY-MM-DD` → período que contiene `date` (por defecto hoy; sin `scale`, mes).
   * - `?scale=custom&from&to` → rango libre.
   */
  private params = toSignal(this.route.queryParamMap, { requireSync: true });

  readonly mode = computed<ReportMode>(() => {
    const value = this.params().get('scale');
    return value === 'day' || value === 'week' || value === 'year' || value === 'custom' ? value : DEFAULT_SCALE;
  });

  /** Escala marcada en el selector; con rango propio no se marca ninguna. */
  readonly scaleValue = computed(() => {
    const mode = this.mode();
    return mode === 'custom' ? null : mode;
  });

  /** Fecha de referencia del período; no se permite pasar de hoy. */
  private anchor = computed(() => {
    const date = parsePlainDate(this.params().get('date')) ?? this.today;
    return date > this.today ? this.today : date;
  });

  readonly range = computed(() => {
    const mode = this.mode();
    if (mode !== 'custom') return getPeriodRange(mode, this.anchor());

    const from = parsePlainDate(this.params().get('from')) ?? this.today;
    const to = parsePlainDate(this.params().get('to')) ?? this.today;
    return from <= to ? { from, to } : { from: to, to: from };
  });

  readonly label = computed(() => formatRangeLabel(this.mode(), this.range()));
  readonly isCurrent = computed(() => {
    const mode = this.mode();
    return mode === 'custom' || isCurrentPeriod(mode, this.anchor());
  });

  /** Un período en curso se consulta hasta hoy; se compara con el mismo tramo del período anterior. */
  private queryRanges = computed(() => {
    const mode = this.mode();
    if (mode === 'custom') return { range: this.range(), compare: null };
    const range = clampToToday(this.range());
    return { range, compare: getComparisonRange(mode, range) };
  });

  readonly compareLabel = computed(() => {
    const compare = this.queryRanges().compare;
    return compare ? formatRangeLabel('custom', compare) : 'el período anterior';
  });

  reportResource = rxResource({
    params: () => this.queryRanges(),
    stream: ({ params }) =>
      this.reportsService.getOverview(
        toIsoRange(params.range),
        params.compare ? toIsoRange(params.compare) : undefined,
      ),
  });

  /** Al cambiar de período se conserva el reporte anterior (atenuado) en vez del spinner. */
  readonly report = linkedSignal<ReportOverview | undefined, ReportOverview | undefined>({
    source: () => (this.reportResource.hasValue() ? this.reportResource.value() : undefined),
    computation: (value, previous) => value ?? previous?.value,
  });

  private resolvedError = computed(() => {
    const error = this.reportResource.error();
    return error ? resolveApiError(error, 'No se pudo cargar el reporte.') : null;
  });

  readonly errorMessage = computed(() => this.resolvedError()?.message ?? null);

  /** Sesión vencida: se redirige en lugar de mostrar el error. */
  redirectOnAuthError = effect(() => {
    const redirect = this.resolvedError()?.redirect;
    if (redirect) void this.router.navigate([redirect]);
  });

  /** Cambiar de escala conserva la fecha de referencia (al salir de un rango, su último día). */
  selectScale(scale: ReportScale) {
    const date = this.mode() === 'custom' ? this.range().to : this.anchor();
    this.navigate({ scale: scale === DEFAULT_SCALE ? null : scale, date: date === this.today ? null : date });
  }

  step(direction: -1 | 1) {
    const mode = this.mode();
    if (mode === 'custom' || (direction === 1 && this.isCurrent())) return;
    const date = shiftAnchor(mode, this.anchor(), direction);
    this.navigate({ date: date >= this.today ? null : date });
  }

  applyRange(value: DateRangeValue) {
    let from = parsePlainDate(value.from) ?? this.today;
    let to = parsePlainDate(value.to) ?? this.today;
    if (from > to) [from, to] = [to, from];
    this.navigate({ scale: 'custom', from, to, date: null });
  }

  /** `view` venía de las pestañas que ya no existen: se limpia para no arrastrarlo. */
  private navigate(queryParams: Record<string, string | null>) {
    const clean = { from: null, to: null, view: null, ...queryParams };
    void this.router.navigate([], { relativeTo: this.route, queryParams: clean, queryParamsHandling: 'merge' });
  }
}

function toIsoRange(range: { from: string; to: string }) {
  return { from: limaPlainDateToStartISO(range.from), to: limaPlainDateToEndISO(range.to) };
}
