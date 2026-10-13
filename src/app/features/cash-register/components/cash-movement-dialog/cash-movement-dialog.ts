import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { Modal } from '@/shared/components/modal/modal';
import { MAX_MONEY, moneyValidator, trimmedRequired } from '@/shared/utils/form-validators';
import type { CashMovementType, CreateCashMovementRequest } from '../../interfaces/cash-register.interface';

const REASON_MAX_LENGTH = 500;

const REASON_PRESETS: Record<CashMovementType, string[]> = {
  CASH_IN: ['Fondo adicional para vuelto', 'Inyección de monedas', 'Devolución de dinero'],
  CASH_OUT: ['Compra urgente de insumos', 'Pago de delivery o flete', 'Pago de servicios menores', 'Retiro de seguridad'],
};

@Component({
  selector: 'cash-movement-dialog',
  imports: [ReactiveFormsModule, NgIcon, Button, Modal],
  viewProviders: [provideIcons({ tablerAlertCircle })],
  templateUrl: './cash-movement-dialog.html',
})
export class CashMovementDialog {
  private fb = inject(FormBuilder);

  open = input(false);
  saving = input(false);
  /** Mensaje del backend (409/422): se muestra dentro del modal. */
  error = input<string | null>(null);
  /**
   * Efectivo disponible en gaveta. `null` cuando el rol no lo recibe (conteo ciego):
   * en ese caso no se valida el retiro aquí y decide el backend.
   */
  availableCash = input<number | null>(null);

  confirmed = output<CreateCashMovementRequest>();
  cancelled = output<void>();
  closed = output<void>();

  readonly reasonMaxLength = REASON_MAX_LENGTH;

  form = this.fb.group({
    type: this.fb.nonNullable.control<CashMovementType>('CASH_IN'),
    amount: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      Validators.max(MAX_MONEY),
      moneyValidator,
    ]),
    reason: this.fb.nonNullable.control('', [trimmedRequired, Validators.maxLength(REASON_MAX_LENGTH)]),
  });

  private value = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  private submitAttempted = signal(false);

  type = computed(() => this.value().type ?? 'CASH_IN');
  presets = computed(() => REASON_PRESETS[this.type()]);

  isExcessWithdrawal = computed(() => {
    const available = this.availableCash();
    const amount = this.value().amount;
    return available !== null && this.type() === 'CASH_OUT' && typeof amount === 'number' && amount > available;
  });

  resetOnOpen = effect(() => {
    if (!this.open()) return;
    this.form.reset({ type: 'CASH_IN', amount: null, reason: '' });
    this.submitAttempted.set(false);
  });

  get amountError(): string | null {
    const control = this.form.controls.amount;
    if (!this.submitAttempted() || control.valid) return null;
    if (control.hasError('required')) return 'Ingresa el importe.';
    return 'Ingresa un importe mayor a cero, con hasta dos decimales.';
  }

  get reasonError(): string | null {
    return this.submitAttempted() && this.form.controls.reason.invalid ? 'Indica el motivo del movimiento.' : null;
  }

  setType(type: CashMovementType) {
    this.form.controls.type.setValue(type);
  }

  setReason(reason: string) {
    this.form.controls.reason.setValue(reason);
  }

  onSubmit() {
    if (this.saving()) return;
    this.submitAttempted.set(true);
    if (this.form.invalid || this.isExcessWithdrawal()) return;

    const { type, amount, reason } = this.form.getRawValue();
    this.confirmed.emit({ type, amount: amount!, reason: reason.trim() });
  }
}
