import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  const token = authService.token();

  // Sin token no se manda el header: evita enviar "Bearer null".
  const newReq = token
    ? req.clone({ headers: req.headers.append('Authorization', `Bearer ${token}`) })
    : req;

  return next(newReq).pipe(
    catchError((error: unknown) => {
      // 401 = la sesión ya no sirve (vencida, inválida o usuario desactivado):
      // se limpia en un solo lugar y cada pantalla solo decide a dónde ir (error-mapper).
      if (error instanceof HttpErrorResponse && error.status === 401) authService.logout();
      return throwError(() => error);
    }),
  );
}
