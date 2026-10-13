import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerCalendar, tablerChevronLeft, tablerChevronRight } from '@ng-icons/tabler-icons';
import type { ReportScale } from '@/features/reports/interfaces/report.interface';
import { ReportsService } from '@/features/reports/services/reports.service';
import {
  formatRangeLabel,
  getLimaTodayPlainDate,
  getPeriodRange,
  isCurrentPeriod,
  limaPlainDateToEndISO,
  limaPlainDateToStartISO,
  parsePlainDate,
  shiftAnchor,
} from '@/features/reports/utils/lima-profit-range';
import { ReportKpis } from '@/features/reports/components/report-kpis/report-kpis';
import { ReportPayments } from '@/features/reports/components/report-payments/report-payments';
import { ReportDailyChart } from '@/features/reports/components/report-daily-chart/report-daily-chart';
import { ReportTopProducts } from '@/features/reports/components/report-top-products/report-top-products';
import { ReportLosses } from '@/features/reports/components/report-losses/report-losses';
import { resolveApiError } from '@/shared/utils/api-error';

type ReportMode = ReportScale | 'custom';

const SCALES: { value: ReportScale; label: string }[] = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

@Component({
  selector: 'app-reports-page',
  imports: [ReactiveFormsModule, NgIcon, ReportKpis, ReportPayments, ReportDailyChart, ReportTopProducts, ReportLosses],
  viewProviders: [provideIcons({ tablerCalendar, tablerChevronLeft, tablerChevronRight })],
  templateUrl: './reports-page.html',
})
export class ReportsPage {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private reportsService = inject(ReportsService);

  readonly scales = SCALES;
  readonly today = getLimaTodayPlainDate();

  /**
   * La URL es la fuente de verdad:
   * - `?scale=day|week|month&date=YYYY-MM-DD` → período que contiene `date` (por defecto hoy).
   * - `?scale=custom&from&to` → rango libre.
   */
  private params = toSignal(this.route.queryParamMap, { requireSync: true });

  readonly mode = computed<ReportMode>(() => {
    const value = this.params().get('scale');
    return value === 'week' || value === 'month' || value === 'custom' ? value : 'day';
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

  /** Formulario de rango libre visible (también se abre al entrar con `scale=custom`). */
  readonly rangeOpen = signal(this.mode() === 'custom');

  rangeForm = this.fb.nonNullable.group({
    from: this.range().from,
    to: this.range().to,
  });

  reportResource = rxResource({
    params: () => this.range(),
    stream: ({ params }) =>
      this.reportsService.getOverview(limaPlainDateToStartISO(params.from), limaPlainDateToEndISO(params.to)),
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
    this.rangeOpen.set(false);
    this.navigate({ scale: scale === 'day' ? null : scale, date: date === this.today ? null : date });
  }

  step(direction: -1 | 1) {
    const mode = this.mode();
    if (mode === 'custom' || (direction === 1 && this.isCurrent())) return;
    const date = shiftAnchor(mode, this.anchor(), direction);
    this.navigate({ date: date >= this.today ? null : date });
  }

  toggleRange() {
    this.rangeForm.setValue(this.range());
    this.rangeOpen.update((open) => !open);
  }

  applyRange() {
    let { from, to } = this.rangeForm.getRawValue();
    from = parsePlainDate(from) ?? this.today;
    to = parsePlainDate(to) ?? this.today;
    if (from > to) [from, to] = [to, from];
    this.rangeForm.setValue({ from, to });
    this.navigate({ scale: 'custom', from, to, date: null });
  }

  private navigate(queryParams: Record<string, string | null>) {
    const clean = { from: null, to: null, ...queryParams };
    void this.router.navigate([], { relativeTo: this.route, queryParams: clean, queryParamsHandling: 'merge' });
  }
}
