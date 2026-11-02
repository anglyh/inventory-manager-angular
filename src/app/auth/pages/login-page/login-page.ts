import { Component, inject, signal } from '@angular/core';
import { Router } from "@angular/router";
import { AuthService } from '../../services/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormUtils } from '@/utils/form-utils';
import { FormErrorLabel } from 'src/app/shared/components/form-error-label/form-error-label';
import { Button } from 'src/app/shared/components/button/button';
import { extractApiError } from 'src/app/api/extract-api-error';
import { resolveApiError } from '@/shared/utils/api-error';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerEye, tablerEyeOff } from '@ng-icons/tabler-icons';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, FormErrorLabel, Button, NgIcon],
  viewProviders: [provideIcons({ tablerEye, tablerEyeOff })],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private fb = inject(FormBuilder);
  hasError = signal(false);
  
  private router = inject(Router);
  private authService = inject(AuthService);
  formUtils = FormUtils

  isLoading = signal(false)
  errorMessage = signal('')
  showPassword = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.pattern(FormUtils.emailPattern)]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  })

  onSubmit(): void {

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;
    if (!email || !password) return;

    this.isLoading.set(true)
    this.hasError.set(false)
    this.errorMessage.set('')

    this.authService.login(email, password).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err) => {
        const apiError = extractApiError(err)
        // Here a 401 is the login's own answer (wrong password or deactivated user), not an expired session.
        this.errorMessage.set(apiError.code === 'UNAUTHORIZED'
          ? apiError.message
          : resolveApiError(err, 'No se pudo iniciar sesión').message)
        this.isLoading.set(false);
        this.hasError.set(true);
      }
    })
  }
}
