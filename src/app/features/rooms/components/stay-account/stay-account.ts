import { Component, LOCALE_ID, computed, inject, input, output } from '@angular/core';
import { DatePipe, DecimalPipe, formatDate } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerBan, tablerCircleCheck } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import type { StayDetail, StayPayment } from '../../interfaces/stay.interface';
import { CHARGE_KIND_LABEL, PAYMENT_METHOD_LABEL } from '../../utils/stay-labels';

/** La cuenta de la estadía como una boleta: cargos, pagos y cuánto debe. */
@Component({
  selector: 'stay-account',
  imports: [DatePipe, DecimalPipe, NgIcon, Button],
  viewProviders: [provideIcons({ tablerBan, tablerCircleCheck })],
  templateUrl: './stay-account.html',
  host: { class: 'block' },
})
export class StayAccount {
  stay = input.required<StayDetail>();
  /** ADMIN con la estadía activa: puede anular pagos mal registrados. */
  canVoid = input(false);

  voidRequested = output<StayPayment>();

  private locale = inject(LOCALE_ID);

  readonly paymentLabel = PAYMENT_METHOD_LABEL;
  readonly kindLabel = CHARGE_KIND_LABEL;
  readonly balance = computed(() => Number(this.stay().balance));

  differs(suggested: string | null, amount: string): boolean {
    return suggested !== null && Number(suggested) !== Number(amount);
  }

  /** Quién anuló, cuándo y por qué; va en el title para no cargar la lista. */
  voidedTitle(payment: StayPayment): string {
    const when = payment.voidedAt ? formatDate(payment.voidedAt, 'd MMM · HH:mm', this.locale) : '';
    const who = payment.voidedByName ? ` por ${payment.voidedByName}` : '';
    return `Anulado${who} ${when}: ${payment.voidReason ?? ''}`.trim();
  }
}
