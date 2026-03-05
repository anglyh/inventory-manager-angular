import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const token = inject(AuthService).token();
  console.log({token})

  const newReq = req.clone({
    headers: req.headers.append('Authorization', `Bearer ${token}`),
  });

  return next(newReq)
}