import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormUtils } from '@/utils/form-utils';
import { FormErrorLabel } from "src/app/shared/components/form-error-label/form-error-label";
import { Button } from 'src/app/shared/components/button/button';
import { extractApiError } from 'src/app/api/extract-api-error';
import { mapApiError } from 'src/app/api/error-mapper';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerEye, tablerEyeOff } from '@ng-icons/tabler-icons';

@Component({
  selector: 'app-register-page',
  imports: [RouterLink, ReactiveFormsModule, FormErrorLabel, Button, NgIcon],
  viewProviders: [provideIcons({ tablerEye, tablerEyeOff })],
  templateUrl: './register-page.html',
})
export class RegisterPage {
  private fb = inject(FormBuilder)

  private router = inject(Router)
  private authService = inject(AuthService)
  formUtils = FormUtils;

  isLoading = signal(false);
  hasError = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  registerForm = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.pattern(FormUtils.emailPattern)]],
    password: ['', [Validators.required]],
    confirmPassword: ['', [Validators.required]],
  },
  {
    validators: [this.formUtils.isFieldOneEqualFieldTwo('password', 'confirmPassword')]
  })

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return
    }

    const { name, email, password } = this.registerForm.value;
    if (!name || !email || !password) return;

    this.isLoading.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');

    this.authService.register(name, email, password).subscribe({
      next: (isAuthenticated) => {
        this.isLoading.set(false);
        if (isAuthenticated) {
          this.router.navigateByUrl('/')
          return
        }
        this.hasError.set(true);
        this.errorMessage.set('No se pudo completar el registro');
      },
      error: (err) => {
        const apiError = extractApiError(err);
        const mapped = mapApiError(apiError);

        if (mapped.redirect) {
          this.router.navigateByUrl(mapped.redirect);
          return;
        }

        this.isLoading.set(false);
        this.hasError.set(true);
        this.errorMessage.set(mapped.toast ?? 'No se pudo completar el registro');
      }
    });
  }
}
