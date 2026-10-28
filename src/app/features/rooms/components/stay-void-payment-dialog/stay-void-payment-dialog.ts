import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { Modal } from '@/shared/components/modal/modal';
import type { StayPayment } from '../../interfaces/stay.interface';
import { PAYMENT_METHOD_LABEL } from '../../utils/stay-labels';

const REASON_MAX_LENGTH = 500;

/** Pide el motivo para anular un pago mal registrado (mismo flujo que anular una venta). */
@Component({
  selector: 'stay-void-payment-dialog',
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, NgIcon, Button, Modal],
  viewProviders: [provideIcons({ tablerAlertCircle })],
  templateUrl: './stay-void-payment-dialog.html',
})
export class StayVoidPaymentDialog {
  private fb = inject(FormBuilder);

  open = input(false);
  payment = input<StayPayment | null>(null);
  saving = input(false);
  /** Mensaje del backend (p. ej. 409): explica por qué no se pudo anular. */
  error = input<string | null>(null);

  confirmed = output<string>();
  cancelled = output<void>();
  /** Terminó la animación de salida: recién ahí se pueden limpiar los datos. */
  closed = output<void>();

  readonly reasonMaxLength = REASON_MAX_LENGTH;
  readonly paymentLabel = PAYMENT_METHOD_LABEL;

  voidForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(REASON_MAX_LENGTH)]],
  });

  consequence = computed(() => {
    const payment = this.payment();
    if (!payment) return '';
    return payment.paymentMethod === 'CASH'
      ? `Se descontarán S/ ${payment.amount} del efectivo de la caja y el monto vuelve al saldo pendiente.`
      : 'El pago dejará de contar en la caja y el monto vuelve al saldo pendiente.';
  });

  /** El error se muestra tras intentar anular, no al perder el foco. */
  private submitAttempted = signal(false);

  /** Cada apertura empieza con el formulario limpio. */
  resetOnOpen = effect(() => {
    if (!this.open()) return;
    this.voidForm.reset();
    this.submitAttempted.set(false);
  });

  get reasonInvalid(): boolean {
    return this.submitAttempted() && this.voidForm.controls.reason.invalid;
  }

  onSubmit() {
    if (this.saving()) return;
    const reason = this.voidForm.controls.reason.value.trim();
    if (!reason) {
      this.voidForm.controls.reason.setValue('');
      this.submitAttempted.set(true);
      return;
    }
    this.confirmed.emit(reason);
  }
}
