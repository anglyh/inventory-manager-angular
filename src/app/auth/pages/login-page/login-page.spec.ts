import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoginPage } from './login-page';

describe('LoginPage errors', () => {
  it('shows the reason the backend gives instead of a generic wrong-password message', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const page = TestBed.createComponent(LoginPage).componentInstance;
    const http = TestBed.inject(HttpTestingController);
    const message = 'Demasiados intentos. Inténtalo de nuevo en 15 minutos.';

    page.loginForm.setValue({ email: 'rosa@hostal.pe', password: 'Secret1234567' });
    page.onSubmit();
    http.expectOne(req => req.url.endsWith('/auth/login')).flush(
      { success: false, error: { code: 'TOO_MANY_REQUESTS', message } },
      { status: 429, statusText: 'Too Many Requests' },
    );

    expect(page.errorMessage()).toBe(message);
    expect(page.isLoading()).toBe(false);
  });
});
