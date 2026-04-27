import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, map } from 'rxjs';
import {
  ReportPeriod,
  ProfitByProductResponse,
  ProfitSummaryResponse,
} from '../../interfaces/report.interface';
import { ReportsService } from '../../services/reports.service';
import {
  getLimaProfitRange,
  getLimaTodayPlainDate,
  limaPlainDateToEndISO,
  limaPlainDateToStartISO,
} from '../../utils/lima-profit-range';
import { Button } from 'src/app/shared/components/button/button';

type ReportOkValue = {
  from: string;
  to: string;
  summary: ProfitSummaryResponse;
  byProduct: ProfitByProductResponse;
};

type RangeMode = 'preset' | 'custom';

@Component({
  selector: 'app-reports-page',
  imports: [DecimalPipe, Button, ReactiveFormsModule],
  templateUrl: './reports-page.html',
})
export class ReportsPage {
  private reportsService = inject(ReportsService);
  private fb = inject(FormBuilder);

  /** Pestañas Hoy / Semana / Mes */
  period = signal<ReportPeriod>('today');
  /** `preset` = pestañas; `custom` = fechas del formulario */
  rangeMode = signal<RangeMode>('preset');
  /** Calendario Lima `YYYY-MM-DD` (solo se usa si `rangeMode === 'custom'`) */
  customFrom = signal(getLimaTodayPlainDate());
  customTo = signal(getLimaTodayPlainDate());

  productLimit = signal(10);
  private refetch = signal(0);

  reportsForm = this.fb.nonNullable.group({
    from: this.fb.control(getLimaTodayPlainDate()),
    to: this.fb.control(getLimaTodayPlainDate()),
  });

  constructor() {
    this.reportsForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.clampDateRange());
  }

  /** Si "Desde" queda mayor que "Hasta", sube "Hasta" hasta igualar "Desde" (la UI ya limita con min/max). */
  private clampDateRange(): void {
    const from = this.reportsForm.controls.from.value;
    const to = this.reportsForm.controls.to.value;
    if (!from || !to) return;
    if (from > to) {
      this.reportsForm.controls.to.patchValue(from, { emitEvent: false });
    }
  }

  reportResource = rxResource({
    params: () => ({
      mode: this.rangeMode(),
      period: this.period(),
      fromPlain: this.customFrom(),
      toPlain: this.customTo(),
      limit: this.productLimit(),
      refetch: this.refetch(),
    }),
    stream: ({ params }) => {
      const { from, to } =
        params.mode === 'custom'
          ? {
              from: limaPlainDateToStartISO(params.fromPlain),
              to: limaPlainDateToEndISO(params.toPlain),
            }
          : getLimaProfitRange(params.period);

      return forkJoin({
        summary: this.reportsService.getProfitSummary(from, to),
        byProduct: this.reportsService.getProfitByProduct(from, to, params.limit),
      }).pipe(
        map(
          (data): ReportOkValue => ({
            from,
            to,
            summary: data.summary,
            byProduct: data.byProduct,
          }),
        ),
      );
    },
  });

  /** Aplica el rango elegido en los `<input type="date">` y dispara la carga vía `rxResource`. */
  applyCustomRange(): void {
    const today = getLimaTodayPlainDate();
    this.clampDateRange();
    const from = this.reportsForm.controls.from.value ?? today;
    const to = this.reportsForm.controls.to.value ?? today;
    this.customFrom.set(from);
    this.customTo.set(to);
    this.rangeMode.set('custom');
  }

  setPeriod(p: ReportPeriod): void {
    this.rangeMode.set('preset');
    this.period.set(p);
  }

  onLimitSelect(value: string): void {
    const n = parseInt(value, 10);
    if (!Number.isNaN(n)) {
      this.productLimit.set(n);
    }
  }

  retry(): void {
    this.refetch.update((v) => v + 1);
  }
}
