import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { Modal } from '@/shared/components/modal/modal';
import { MAX_MONEY, moneyValidator } from '@/shared/utils/form-validators';
import type { CreateStayChargeRequest, SuggestedExtra } from '../../interfaces/stay.interface';

/**
 * Agrega a la cuenta las horas extra antes de la salida, con lo sugerido precargado.
 * Es el único cargo que se hace a mano: los productos se registran como venta.
 */
@Component({
  selector: 'stay-charge-dialog',
  imports: [ReactiveFormsModule, DecimalPipe, NgIcon, Button, Modal],
  viewProviders: [provideIcons({ tablerAlertCircle })],
  templateUrl: './stay-charge-dialog.html',
})
export class StayChargeDialog {
  private fb = inject(FormBuilder).nonNullable;

  open = input(false);
  saving = input(false);
  error = input<string | null>(null);
  suggestedExtra = input<SuggestedExtra | null>(null);

  confirmed = output<CreateStayChargeRequest>();
  cancelled = output<void>();
  closed = output<void>();

  form = this.fb.group({
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01), Validators.max(MAX_MONEY), moneyValidator]),
  });

  readonly submitAttempted = signal(false);

  resetOnOpen = effect(() => {
    if (!this.open()) return;
    const extra = this.suggestedExtra();
    untracked(() => {
      this.form.reset({ amount: extra ? Number(extra.amount) : null });
      this.submitAttempted.set(false);
    });
  });

  onSubmit() {
    if (this.saving()) return;
    this.submitAttempted.set(true);
    const extra = this.suggestedExtra();
    if (this.form.invalid || !extra) return;
    this.confirmed.emit({
      kind: 'EXTRA_HOURS',
      description: `${extra.hours} ${extra.hours === 1 ? 'hora extra' : 'horas extra'}`,
      suggestedAmount: Number(extra.amount),
      amount: this.form.getRawValue().amount!,
    });
  }
}
