import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerEye, tablerEyeOff } from '@ng-icons/tabler-icons';
import { FormUtils } from '@/utils/form-utils';
import { FormErrorLabel } from '@/shared/components/form-error-label/form-error-label';
import type { CreateStoreUserRequest } from '../../interfaces/store-user.interface';

@Component({
  selector: 'store-user-form',
  imports: [ReactiveFormsModule, NgIcon, FormErrorLabel],
  viewProviders: [provideIcons({ tablerEye, tablerEyeOff })],
  templateUrl: './store-user-form.html',
})
export class StoreUserForm {
  private fb = inject(FormBuilder);

  saving = input(false);
  error = input<string | null>(null);
  /** El contenedor lo incrementa al guardar para limpiar el formulario. */
  resetKey = input(0);
  submitted = output<CreateStoreUserRequest>();

  formUtils = FormUtils;
  showPassword = signal(false);

  // Mismas reglas que el backend (createUserSchema): la mayoría de errores no llega al servidor.
  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.pattern(FormUtils.emailPattern)]],
    password: ['', [Validators.required, Validators.minLength(12), Validators.pattern(/[A-Z]/)]],
  });

  constructor() {
    effect(() => {
      if (this.resetKey() === 0) return;
      this.form.reset();
      this.showPassword.set(false);
    });
  }

  submit() {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, email, password } = this.form.getRawValue();
    this.submitted.emit({ name: name.trim(), email: email.trim(), password });
  }
}
