import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  tablerAlertCircle,
  tablerCheck,
  tablerLock,
  tablerScale,
  tablerTrendingDown,
  tablerTrendingUp,
} from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { Modal } from '@/shared/components/modal/modal';
import { MAX_MONEY, moneyValidator } from '@/shared/utils/form-validators';
import type { CloseCashRegisterRequest } from '../../interfaces/cash-register.interface';
import { DIFFERENCE_VIEW, differenceTone } from '../../shared/cash-register-format';

const NOTES_MAX_LENGTH = 500;

@Component({
  selector: 'close-register-dialog',
  imports: [ReactiveFormsModule, DecimalPipe, NgIcon, Button, Modal],
  viewProviders: [
    provideIcons({ tablerAlertCircle, tablerCheck, tablerLock, tablerScale, tablerTrendingDown, tablerTrendingUp }),
  ],
  templateUrl: './close-register-dialog.html',
})
export class CloseRegisterDialog {
  private fb = inject(FormBuilder);

  open = input(false);
  saving = input(false);
  /** Mensaje del backend (p. ej. 422 por falta de observación): se muestra dentro del modal. */
  error = input<string | null>(null);
  /**
   * Efectivo esperado. `null` para el conteo ciego: no se decide aquí si la
   * observación es obligatoria, lo informa el backend.
   */
  expectedCash = input<number | null>(null);

  confirmed = output<CloseCashRegisterRequest>();
  cancelled = output<void>();
  closed = output<void>();

  readonly notesMaxLength = NOTES_MAX_LENGTH;
  readonly differenceView = DIFFERENCE_VIEW;

  form = this.fb.group({
    closingAmount: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(MAX_MONEY),
      moneyValidator,
    ]),
    notes: this.fb.nonNullable.control('', Validators.maxLength(NOTES_MAX_LENGTH)),
  });

  private submitAttempted = signal(false);
  /** Descuadre detectado localmente cuando se conoce el esperado (solo ADMIN). */
  localError = signal<string | null>(null);

  private counted = toSignal(this.form.controls.closingAmount.valueChanges, { initialValue: null });

  /** Diferencia en vivo mientras se escribe; solo con el esperado (ADMIN). */
  readonly preview = computed(() => {
    const expected = this.expectedCash();
    const counted = this.counted();
    if (expected === null || typeof counted !== 'number' || counted < 0) return null;
    const diff = Math.round((counted - expected) * 100) / 100;
    return { tone: differenceTone(String(diff)), amount: Math.abs(diff) };
  });

  resetOnOpen = effect(() => {
    if (!this.open()) return;
    this.form.reset({ closingAmount: null, notes: '' });
    this.submitAttempted.set(false);
    this.localError.set(null);
  });

  get amountError(): string | null {
    const control = this.form.controls.closingAmount;
    if (!this.submitAttempted() || control.valid) return null;
    if (control.hasError('required')) return 'Ingresa cuánto contaste.';
    return 'Ingresa un monto desde 0, con hasta dos decimales.';
  }

  onSubmit() {
    if (this.saving()) return;
    this.submitAttempted.set(true);
    this.localError.set(null);
    if (this.form.invalid) return;

    const closingAmount = this.form.controls.closingAmount.value!;
    const notes = this.form.controls.notes.value.trim();
    const expected = this.expectedCash();

    if (expected !== null && !notes) {
      const diff = Math.round((closingAmount - expected) * 100) / 100;
      if (diff !== 0) {
        const label = diff < 0 ? 'Faltan' : 'Sobran';
        this.localError.set(`${label} S/ ${Math.abs(diff).toFixed(2)}. Escribe en la nota por qué, para poder cerrar.`);
        return;
      }
    }

    this.confirmed.emit(notes ? { closingAmount, notes } : { closingAmount });
  }
}
