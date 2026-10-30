import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { ReportPayments } from '../../interfaces/report.interface';
import { percent } from '../../utils/report-math';

/** Cuánto de lo cobrado (tienda + habitaciones) entró en efectivo y cuánto por Yape. */
@Component({
  selector: 'report-payment-split',
  imports: [DecimalPipe],
  templateUrl: './report-payment-split.html',
  styles: `
    :host { display: block; }
    .stats { animation: split-in 420ms cubic-bezier(0.2, 0.7, 0.2, 1) both; }
    @keyframes split-in {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: none; }
    }
    @media (prefers-reduced-motion: reduce) { .stats { animation: none; } }
  `,
})
export class ReportPaymentSplit {
  payments = input.required<ReportPayments>();
  /** Retraso de la animación de entrada (ms), para escalonar con las demás cards. */
  delay = input(0);

  readonly cash = computed(() => Number(this.payments().cash));
  readonly yape = computed(() => Number(this.payments().yape));
  readonly total = computed(() => this.cash() + this.yape());

  /** Yape es el complemento: los dos porcentajes siempre suman 100. */
  readonly cashShare = computed(() => (this.total() ? Math.round((this.cash() / this.total()) * 100) : 0));
  readonly yapeShare = computed(() => (this.total() ? 100 - this.cashShare() : 0));

  readonly cashLabel = computed(() => percent(this.cashShare()));
  readonly yapeLabel = computed(() => percent(this.yapeShare()));
  readonly summary = computed(() => `Efectivo ${this.cashLabel()}, Yape ${this.yapeLabel()}`);
}
