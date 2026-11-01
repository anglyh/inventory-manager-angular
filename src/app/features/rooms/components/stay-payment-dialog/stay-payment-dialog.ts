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
import type { CreateStayPaymentRequest, PaymentMethod } from '../../interfaces/stay.interface';
import { PAYMENT_METHOD_OPTIONS } from '../../utils/stay-labels';

/** Cobrar a cuenta de la estadía (entra a la caja abierta). */
@Component({
  selector: 'stay-payment-dialog',
  imports: [ReactiveFormsModule, DecimalPipe, NgIcon, Button, Modal, SegmentedControl],
  viewProviders: [provideIcons({ tablerAlertCircle })],
  templateUrl: './stay-payment-dialog.html',
})
export class StayPaymentDialog {
  private fb = inject(FormBuilder).nonNullable;

  open = input(false);
  saving = input(false);
  error = input<string | null>(null);
  balance = input(0);

  confirmed = output<CreateStayPaymentRequest>();
  cancelled = output<void>();
  closed = output<void>();

  readonly paymentOptions = PAYMENT_METHOD_OPTIONS;

  form = this.fb.group({
    paymentMethod: this.fb.control<PaymentMethod>('CASH'),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01), Validators.max(MAX_MONEY), moneyValidator]),
  });

  private value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly submitAttempted = signal(false);
  readonly method = computed(() => this.value().paymentMethod ?? 'CASH');
  readonly exceeds = computed(() => {
    const amount = this.value().amount;
    return typeof amount === 'number' && amount > this.balance();
  });

  resetOnOpen = effect(() => {
    if (!this.open()) return;
    const balance = this.balance();
    untracked(() => {
      this.form.reset({ paymentMethod: 'CASH', amount: balance > 0 ? balance : null });
      this.submitAttempted.set(false);
    });
  });

  setMethod(method: PaymentMethod) {
    this.form.controls.paymentMethod.setValue(method);
  }

  onSubmit() {
    if (this.saving()) return;
    this.submitAttempted.set(true);
    if (this.form.invalid || this.exceeds()) return;
    const { paymentMethod, amount } = this.form.getRawValue();
    this.confirmed.emit({ paymentMethod, amount: amount! });
  }
}
