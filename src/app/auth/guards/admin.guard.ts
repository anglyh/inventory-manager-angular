import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Rutas solo para ADMIN. Corre dentro del layout ya autenticado (AuthenticatedGuard
 * cargó al usuario), así que basta con leer el rol. Un GUEST va a su pantalla principal.
 */
export const AdminGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  return authService.isAdmin() || inject(Router).createUrlTree(['/sales']);
};
