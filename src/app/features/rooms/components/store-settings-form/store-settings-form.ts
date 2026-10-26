import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '@/shared/components/button/button';
import type { StoreSettings, UpdateStoreSettingsRequest } from '../../interfaces/room.interface';

/** Hora de salida de las noches y tolerancia antes de sugerir horas extra. */
@Component({
  selector: 'store-settings-form',
  imports: [ReactiveFormsModule, Button],
  templateUrl: './store-settings-form.html',
  host: { class: 'block' },
})
export class StoreSettingsForm {
  private fb = inject(FormBuilder).nonNullable;

  settings = input.required<StoreSettings>();
  saving = input(false);

  submitted = output<UpdateStoreSettingsRequest>();

  readonly submitAttempted = signal(false);

  form = this.fb.group({
    checkoutTime: this.fb.control('12:00', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):[0-5]\d$/)]),
    extraToleranceMinutes: this.fb.control<number | null>(0, [Validators.required, Validators.min(0), Validators.max(720)]),
  });

  syncSettings = effect(() => {
    const settings = this.settings();
    untracked(() => {
      this.form.reset({ checkoutTime: settings.checkoutTime.slice(0, 5), extraToleranceMinutes: settings.extraToleranceMinutes });
      this.submitAttempted.set(false);
    });
  });

  onSubmit() {
    if (this.saving()) return;
    this.submitAttempted.set(true);
    if (this.form.invalid) return;
    const { checkoutTime, extraToleranceMinutes } = this.form.getRawValue();
    this.submitted.emit({ checkoutTime, extraToleranceMinutes: extraToleranceMinutes! });
  }
}
