import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle } from '@ng-icons/tabler-icons';
import { CashRegisterService } from '@/features/cash-register/services/cash-register.service';
import { CashMovementDialog } from '@/features/cash-register/components/cash-movement-dialog/cash-movement-dialog';
import { CloseRegisterDialog } from '@/features/cash-register/components/close-register-dialog/close-register-dialog';
import type {
  CloseCashRegisterRequest,
  CreateCashMovementRequest,
  OpenCashRegisterRequest,
} from '@/features/cash-register/interfaces/cash-register.interface';
import { GlobalNotificationService } from '@/shared/components/global-notification/global-notification.service';
import { AuthService } from '@/auth/services/auth.service';
import { Button } from '@/shared/components/button/button';
import { extractApiError } from '@/api/extract-api-error';
import { resolveApiError } from '@/shared/utils/api-error';
import { CashRegisterOpening } from '@/features/cash-register/components/cash-register-opening/cash-register-opening';
import { CashRegisterSession } from '@/features/cash-register/components/cash-register-session/cash-register-session';
import { CashRegisterMovementTable } from '@/features/cash-register/components/cash-register-movement-table/cash-register-movement-table';

@Component({
  selector: 'app-cash-register-page',
  imports: [
    NgIcon,
    Button,
    CashRegisterSession,
    CashRegisterOpening,
    CashRegisterMovementTable,
    CashMovementDialog,
    CloseRegisterDialog,
  ],
  viewProviders: [provideIcons({ tablerAlertCircle })],
  templateUrl: './cash-register-page.html',
})
export class CashRegisterPage {
  private router = inject(Router);
  private notification = inject(GlobalNotificationService);
  readonly cashRegisterService = inject(CashRegisterService);
  readonly current = this.cashRegisterService.currentCashRegisterResource;
  /** Si una recarga falla se sigue mostrando la última caja conocida. */
  readonly register = this.cashRegisterService.currentCashRegister;
  readonly isAdmin = inject(AuthService).isAdmin;

  readonly opening = signal(false);
  /** El formulario queda bloqueado hasta que llega la caja recién abierta: un segundo toque no es posible. */
  readonly openingBusy = computed(() => this.opening() || this.current.isLoading());
  readonly movementsRefresh = signal(0);
  /** Lo informa la lista de movimientos; el empleado lo ve como conteo, sin montos. */
  readonly movementsCount = signal<number | null>(null);

  readonly movementOpen = signal(false);
  readonly movementSaving = signal(false);
  readonly movementError = signal<string | null>(null);

  readonly closeOpen = signal(false);
  readonly closeSaving = signal(false);
  readonly closeError = signal<string | null>(null);

  readonly busy = computed(() => this.opening() || this.movementSaving() || this.closeSaving());

  /** Solo ADMIN recibe el esperado; `null` significa conteo ciego y decide el backend. */
  readonly expectedCash = computed(() => {
    const raw = this.register()?.summary?.expectedCash;
    return raw === undefined ? null : Number(raw);
  });

  constructor() {
    // El resource vive en root: al volver a Caja se actualizan los totales (no hace nada si ya está cargando).
    this.current.reload();
  }

  openRegister(body: OpenCashRegisterRequest) {
    if (this.openingBusy()) return;
    this.opening.set(true);
    this.cashRegisterService.open(body).subscribe({
      next: () => {
        // Primero se pide la recarga: `isLoading` mantiene el formulario bloqueado al soltar `opening`.
        this.refresh();
        this.opening.set(false);
        this.notification.show('Caja abierta');
      },
      error: error => {
        this.opening.set(false);
        this.notifyError(error, 'No se pudo abrir la caja.');
        // 409: ya había una caja abierta; se muestra la vigente.
        if (extractApiError(error).code === 'CONFLICT') this.refresh();
      },
    });
  }

  openMovement() {
    this.movementError.set(null);
    this.movementOpen.set(true);
  }

  onMovementClosed() {
    this.movementOpen.set(false);
    this.movementError.set(null);
  }

  addMovement(body: CreateCashMovementRequest) {
    const register = this.openRegisterValue();
    if (!register || this.movementSaving()) return;

    this.movementSaving.set(true);
    this.movementError.set(null);
    this.cashRegisterService.createMovement(register.id, body).subscribe({
      next: () => {
        this.movementSaving.set(false);
        this.movementOpen.set(false);
        this.refresh();
        this.notification.show(body.type === 'CASH_IN' ? 'Dinero puesto en la caja' : 'Dinero sacado de la caja');
      },
      error: error => {
        this.movementSaving.set(false);
        const resolved = resolveApiError(error, 'No se pudo guardar. Inténtalo de nuevo.');
        if (resolved.redirect) {
          void this.router.navigate([resolved.redirect]);
          return;
        }
        // 409 (caja cerrada o efectivo insuficiente) y 422 se leen dentro del modal.
        if (this.movementOpen()) this.movementError.set(resolved.message);
        else this.notification.show(resolved.message, 'error');
        this.refresh();
      },
    });
  }

  openClose() {
    this.closeError.set(null);
    this.closeOpen.set(true);
  }

  onCloseClosed() {
    this.closeOpen.set(false);
    this.closeError.set(null);
  }

  closeRegister(body: CloseCashRegisterRequest) {
    const register = this.openRegisterValue();
    if (!register || this.closeSaving()) return;

    this.closeSaving.set(true);
    this.closeError.set(null);
    this.cashRegisterService.close(register.id, body).subscribe({
      next: () => {
        this.closeSaving.set(false);
        this.closeOpen.set(false);
        this.refresh();
        this.notification.show('Caja cerrada');
      },
      error: error => {
        this.closeSaving.set(false);
        const resolved = resolveApiError(error, 'No se pudo cerrar la caja.');
        if (resolved.redirect) {
          void this.router.navigate([resolved.redirect]);
          return;
        }
        const code = extractApiError(error).code;
        // 409/404: la caja ya no está abierta; no tiene sentido mantener el modal.
        if (code === 'CONFLICT' || code === 'NOT_FOUND') {
          this.closeOpen.set(false);
          this.notification.show(resolved.message, 'error');
          this.refresh();
          return;
        }
        // 422 (p. ej. falta la observación del descuadre): el usuario corrige sin perder lo ingresado.
        if (this.closeOpen()) this.closeError.set(resolved.message);
        else this.notification.show(resolved.message, 'error');
      },
    });
  }

  private openRegisterValue() {
    const register = this.register();
    return register?.status === 'OPEN' ? register : null;
  }

  private refresh() {
    this.current.reload();
    this.movementsRefresh.update(value => value + 1);
  }

  private notifyError(error: unknown, fallback: string) {
    const resolved = resolveApiError(error, fallback);
    if (resolved.redirect) void this.router.navigate([resolved.redirect]);
    else this.notification.show(resolved.message, 'error');
  }
}
