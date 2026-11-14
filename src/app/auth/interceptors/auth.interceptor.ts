import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// These endpoints answer their own 401s (wrong password, no session); refreshing on them would loop.
const AUTH_ENDPOINTS = /\/auth\/(login|register|refresh|logout)(\?|$)/;

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);

  if (AUTH_ENDPOINTS.test(req.url)) return next(req);

  return next(withAccessToken(req, authService.accessToken())).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) return throwError(() => error);

      // 401 = the access token expired (15 min) or the session is gone: try the refresh cookie once.
      return authService.refreshSession().pipe(
        switchMap(refreshed => refreshed
          // A second 401 here is final: it is not caught again, so there is no loop.
          ? next(withAccessToken(req, authService.accessToken()))
          // The session is already cleared; each screen decides where to go (error-mapper → /auth/login).
          : throwError(() => error)),
      );
    }),
  );
}

// Sin token no se manda el header: evita enviar "Bearer null".
function withAccessToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}
