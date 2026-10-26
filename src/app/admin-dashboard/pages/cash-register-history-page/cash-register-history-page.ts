import { Component, computed, effect, inject, linkedSignal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerCashRegister } from '@ng-icons/tabler-icons';
import { CashRegisterService } from '@/features/cash-register/services/cash-register.service';
import { CashRegisterList } from '@/features/cash-register/components/cash-register-list/cash-register-list';
import type { CashRegisterPage, CashRegisterStatus } from '@/features/cash-register/interfaces/cash-register.interface';
import { resolveApiError } from '@/shared/utils/api-error';
import { Button } from '@/shared/components/button/button';
import { Pagination } from '@/shared/components/pagination/pagination';

const PAGE_SIZE = 12;

const STATUS_TABS: { value: CashRegisterStatus | undefined; label: string }[] = [
  { value: undefined, label: 'Todas' },
  { value: 'OPEN', label: 'Abiertas' },
  { value: 'CLOSED', label: 'Cerradas' },
];

@Component({
  selector: 'app-cash-register-history-page',
  imports: [NgIcon, Button, Pagination, CashRegisterList],
  viewProviders: [provideIcons({ tablerCashRegister })],
  templateUrl: './cash-register-history-page.html',
})
export class CashRegisterHistoryPage {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cashRegisterService = inject(CashRegisterService);

  readonly tabs = STATUS_TABS;

  /** La URL es la fuente de verdad: valores desconocidos se ignoran. */
  private params = toSignal(this.route.queryParamMap, { requireSync: true });

  readonly status = computed<CashRegisterStatus | undefined>(() => {
    const value = this.params().get('status');
    return value === 'OPEN' || value === 'CLOSED' ? value : undefined;
  });

  readonly page = computed(() => {
    const value = Number(this.params().get('page'));
    return Number.isSafeInteger(value) && value >= 1 ? value : 1;
  });

  registersResource = rxResource({
    params: () => ({ status: this.status(), page: this.page(), limit: PAGE_SIZE }),
    stream: ({ params }) => this.cashRegisterService.getRegisters(params),
  });

  /**
   * Al cambiar de pestaña o página el resource vacía su valor mientras carga;
   * se conserva el anterior (atenuado) para no mostrar el spinner en cada cambio.
   */
  readonly registers = linkedSignal<CashRegisterPage | undefined, CashRegisterPage | undefined>({
    source: () => (this.registersResource.hasValue() ? this.registersResource.value() : undefined),
    computation: (value, previous) => value ?? previous?.value,
  });

  private resolvedError = computed(() => {
    const error = this.registersResource.error();
    return error ? resolveApiError(error, 'No se pudo cargar el historial.') : null;
  });

  readonly errorMessage = computed(() => this.resolvedError()?.message ?? null);

  /** Sesión vencida: se redirige en lugar de mostrar el error. */
  redirectOnAuthError = effect(() => {
    const redirect = this.resolvedError()?.redirect;
    if (redirect) void this.router.navigate([redirect]);
  });

  selectStatus(status: CashRegisterStatus | undefined) {
    this.navigate({ status: status ?? null, page: null });
  }

  goToCurrent() {
    void this.router.navigateByUrl('/cash-register');
  }

  private navigate(queryParams: Record<string, string | number | null>) {
    void this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }
}
