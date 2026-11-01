import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { Modal } from '@/shared/components/modal/modal';
import type { InventoryMovement } from '../../interfaces/inventory-movement.interface';
import { REASON_LABELS } from '../../shared/movement-labels';

const REASON_MAX_LENGTH = 500;

/** Qué revierte el backend según el tipo, para que el usuario decida informado. */
function voidConsequence(movement: InventoryMovement): string {
  if (movement.reason === 'SALE') {
    return movement.paymentMethod === 'CASH'
      ? `Se devolverá el stock y se descontarán S/ ${movement.totalAmount} del efectivo de la caja.`
      : 'Se devolverá el stock y la venta dejará de contar en la caja.';
  }
  return movement.movementType === 'IN'
    ? 'Se quitará el stock que entró y el costo vuelve al de antes.'
    : 'Se devolverá el stock retirado.';
}

@Component({
  selector: 'void-movement-dialog',
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, NgIcon, Button, Modal],
  viewProviders: [provideIcons({ tablerAlertCircle })],
  templateUrl: './void-movement-dialog.html',
})
export class VoidMovementDialog {
  private fb = inject(FormBuilder);

  open = input(false);
  movement = input<InventoryMovement | null>(null);
  saving = input(false);
  /** Mensaje del backend (p. ej. 409): explica por qué no se pudo anular. */
  error = input<string | null>(null);

  confirmed = output<string>();
  cancelled = output<void>();
  /** Terminó la animación de salida: recién ahí se pueden limpiar los datos. */
  closed = output<void>();

  readonly reasonMaxLength = REASON_MAX_LENGTH;
  readonly reasonLabels = REASON_LABELS;

  voidForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(REASON_MAX_LENGTH)]],
  });

  consequence = computed(() => {
    const movement = this.movement();
    return movement ? voidConsequence(movement) : '';
  });

  /**
   * El error se muestra tras intentar anular, no al perder el foco: sacar el foco
   * de un campo vacío (p. ej. al cerrar con un clic afuera) no es un error.
   */
  private submitAttempted = signal(false);

  /** Cada apertura empieza con el formulario limpio; al cerrar no se toca. */
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
