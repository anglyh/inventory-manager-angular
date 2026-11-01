import { Component, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerCashRegister, tablerHistory, tablerLockOpen } from '@ng-icons/tabler-icons';
import type { OpenCashRegisterRequest } from '@/features/cash-register/interfaces/cash-register.interface';
import { Button } from '@/shared/components/button/button';
import { MAX_MONEY, moneyValidator } from '@/shared/utils/form-validators';
import { CashStatusPill } from '../cash-status-pill/cash-status-pill';

const NOTES_MAX_LENGTH = 500;

@Component({
  selector: 'cash-register-opening',
  imports: [ReactiveFormsModule, NgIcon, Button, CashStatusPill],
  viewProviders: [provideIcons({ tablerCashRegister, tablerHistory, tablerLockOpen })],
  templateUrl: './cash-register-opening.html',
})
export class CashRegisterOpening {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  busy = input(false);
  /** El historial de cajas es solo para ADMIN. */
  showHistory = input(true);
  submitted = output<OpenCashRegisterRequest>();

  readonly presets = [0, 50, 100, 150, 200, 300];
  readonly notesMaxLength = NOTES_MAX_LENGTH;

  form = this.fb.group({
    openingAmount: this.fb.control<number | null>(100, [
      Validators.required,
      Validators.min(0),
      Validators.max(MAX_MONEY),
      moneyValidator,
    ]),
    notes: this.fb.nonNullable.control('', Validators.maxLength(NOTES_MAX_LENGTH)),
  });

  readonly amount = toSignal(this.form.controls.openingAmount.valueChanges, {
    initialValue: this.form.controls.openingAmount.value,
  });
  private submitAttempted = signal(false);

  get amountError(): string | null {
    const control = this.form.controls.openingAmount;
    if (!this.submitAttempted() || control.valid) return null;
    if (control.hasError('required')) return 'Ingresa el fondo inicial.';
    return 'Ingresa un monto desde 0, con hasta dos decimales.';
  }

  setPreset(amount: number) {
    this.form.controls.openingAmount.setValue(amount);
  }

  openHistory() {
    void this.router.navigateByUrl('/cash-register/history');
  }

  submit() {
    this.submitAttempted.set(true);
    if (this.form.invalid || this.busy()) return;

    const openingAmount = this.form.controls.openingAmount.value!;
    const notes = this.form.controls.notes.value.trim();
    this.submitted.emit(notes ? { openingAmount, notes } : { openingAmount });
  }
}
