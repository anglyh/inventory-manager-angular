import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormUtils } from '@/utils/form-utils';
import { FormErrorLabel } from "src/app/shared/components/form-error-label/form-error-label";

@Component({
  selector: 'app-register-page',
  imports: [RouterLink, ReactiveFormsModule, FormErrorLabel],
  templateUrl: './register-page.html',
})
export class RegisterPage {
  private fb = inject(FormBuilder)

  private router = inject(Router)
  private authService = inject(AuthService)
  formUtils = FormUtils;

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

    this.authService.register(name, email, password).subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.router.navigateByUrl('/')
        return
      }
    })
  }
}
