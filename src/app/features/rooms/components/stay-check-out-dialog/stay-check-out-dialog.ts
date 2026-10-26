import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { Modal } from '@/shared/components/modal/modal';
import { SegmentedControl } from '@/shared/components/segmented-control/segmented-control';
import { MAX_MONEY, moneyValidator } from '@/shared/utils/form-validators';
import type { CheckOutRequest, PaymentMethod, StayDetail } from '../../interfaces/stay.interface';
import { PAYMENT_METHOD_OPTIONS } from '../../utils/stay-labels';
import { formatDuration, minutesSince } from '../../utils/stay-time';

const toCents = (value: number) => Math.round(value * 100);

/**
 * Check-out: adicional sugerido (editable, 0 lo perdona) y el cobro del resto en la misma operación.
 * El backend exige saldo final 0, así que el pago es exactamente saldo + adicional.
 */
@Component({
  selector: 'stay-check-out-dialog',
  imports: [ReactiveFormsModule, DecimalPipe, NgIcon, Button, Modal, SegmentedControl],
  viewProviders: [provideIcons({ tablerAlertCircle })],
  templateUrl: './stay-check-out-dialog.html',
})
export class StayCheckOutDialog {
  private fb = inject(FormBuilder).nonNullable;

  open = input(false);
  saving = input(false);
  error = input<string | null>(null);
  stay = input.required<StayDetail>();

  confirmed = output<CheckOutRequest>();
  cancelled = output<void>();
  closed = output<void>();

  readonly paymentOptions = PAYMENT_METHOD_OPTIONS;

  form = this.fb.group({
    extraAmount: this.fb.control<number | null>(0, [Validators.required, Validators.min(0), Validators.max(MAX_MONEY), moneyValidator]),
    paymentMethod: this.fb.control<PaymentMethod>('CASH'),
  });

  private value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly submitAttempted = signal(false);
  readonly method = computed(() => this.value().paymentMethod ?? 'CASH');

  readonly suggested = computed(() => this.stay().suggestedExtra);
  readonly overdueLabel = computed(() => {
    const minutes = this.suggested()?.overdueMinutes ?? minutesSince(this.stay().expectedCheckOut);
    return minutes > 0 ? formatDuration(minutes) : null;
  });
  readonly balance = computed(() => Number(this.stay().balance));
  readonly extra = computed(() => {
    const extra = this.value().extraAmount;
    return typeof extra === 'number' && extra >= 0 ? extra : 0;
  });
  readonly total = computed(() => toCents(this.balance() + this.extra()) / 100);

  resetOnOpen = effect(() => {
    if (!this.open()) return;
    const suggested = this.suggested();
    untracked(() => {
      this.form.reset({ extraAmount: suggested ? Number(suggested.amount) : 0, paymentMethod: 'CASH' });
      this.submitAttempted.set(false);
    });
  });

  setMethod(method: PaymentMethod) {
    this.form.controls.paymentMethod.setValue(method);
  }

  onSubmit() {
    if (this.saving()) return;
    this.submitAttempted.set(true);
    if (this.form.invalid) return;
    const { extraAmount, paymentMethod } = this.form.getRawValue();
    const body: CheckOutRequest = { extraAmount: extraAmount ?? 0 };
    if (this.total() > 0) body.payment = { paymentMethod, amount: this.total() };
    this.confirmed.emit(body);
  }
}
