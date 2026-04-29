import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from "@angular/router";
import { AuthService } from '../../services/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormUtils } from '@/utils/form-utils';
import { FormErrorLabel } from 'src/app/shared/components/form-error-label/form-error-label';
import { Button } from 'src/app/shared/components/button/button';
import { extractApiError } from 'src/app/api/extract-api-error';
import { mapApiError } from 'src/app/api/error-mapper';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerEye, tablerEyeOff } from '@ng-icons/tabler-icons';

@Component({
  selector: 'app-login-page',
  imports: [RouterLink, ReactiveFormsModule, FormErrorLabel, Button, NgIcon],
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
      next: (isAuthenticated) => {
        if (isAuthenticated) {
          this.router.navigateByUrl('/')
          return;
        } else {
          this.isLoading.set(false);
          this.hasError.set(true);
          this.errorMessage.set('Credenciales inválidas');
        }
      },
      error: (err) => {
        const apiError = extractApiError(err)
        const mapped = mapApiError(apiError)

        if (mapped.redirect) {
          this.router.navigateByUrl(mapped.redirect);
          return;
        }

        if (mapped.toast) this.errorMessage.set(mapped.toast)
        
        this.isLoading.set(false);
        this.hasError.set(true);
      }
    })
  }
}
