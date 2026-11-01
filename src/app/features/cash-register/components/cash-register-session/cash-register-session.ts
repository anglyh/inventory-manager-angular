import { Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  tablerArrowsExchange,
  tablerCashBanknote,
  tablerCashRegister,
  tablerHistory,
  tablerLock,
} from '@ng-icons/tabler-icons';
import type { CashRegister } from '@/features/cash-register/interfaces/cash-register.interface';
import { cashBreakdown } from '@/features/cash-register/utils/cash-breakdown';
import { elapsedLabel } from '@/features/cash-register/shared/cash-register-format';
import { Button } from '@/shared/components/button/button';
import { CashAmount } from '../cash-amount/cash-amount';
import { CashBreakdownList } from '../cash-breakdown-list/cash-breakdown-list';
import { CashSalesTiles } from '../cash-sales-tiles/cash-sales-tiles';
import { CashStatTile } from '../cash-stat-tile/cash-stat-tile';
import { CashStatusPill } from '../cash-status-pill/cash-status-pill';

@Component({
  selector: 'cash-register-session',
  imports: [
    DatePipe,
    NgIcon,
    Button,
    CashAmount,
    CashBreakdownList,
    CashSalesTiles,
    CashStatTile,
    CashStatusPill,
  ],
  viewProviders: [
    provideIcons({
      tablerArrowsExchange,
      tablerCashBanknote,
      tablerCashRegister,
      tablerHistory,
      tablerLock,
    }),
  ],
  templateUrl: './cash-register-session.html',
})
export class CashRegisterSession {
  private router = inject(Router);

  register = input.required<CashRegister>();
  busy = input(false);
  /**
   * ADMIN ve el efectivo, las ventas y el historial. El empleado hace el cierre ciego:
   * no ve ningún monto de la caja (el backend solo le envía la cantidad de ventas).
   */
  admin = input(false);
  /** Total de movimientos de la caja (lo informa la lista); `null` mientras carga. */
  movementsCount = input<number | null>(null);

  movementRequested = output<void>();
  closeRequested = output<void>();

  /** Reloj de la pantalla: el tiempo abierta se actualiza cada minuto. */
  private readonly now = signal(Date.now());

  readonly elapsed = computed(() => elapsedLabel(this.register().openedAt, this.now()));
  /** Si la caja se abrió otro día, la hora va con la fecha. */
  readonly openedFormat = computed(() =>
    new Date(this.register().openedAt).toDateString() === new Date(this.now()).toDateString()
      ? 'h:mm a'
      : 'd MMM · h:mm a',
  );

  /** Sin la fila "Esperado": el total ya se muestra grande en la card oscura. */
  readonly cashRows = computed(() => cashBreakdown(this.register(), { includeExpected: false }));

  readonly salesCount = computed(() => this.register().summary?.salesCount ?? null);

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  openHistory() {
    void this.router.navigateByUrl('/cash-register/history');
  }
}
