import { Component, computed, effect, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerArrowLeft, tablerReceipt } from '@ng-icons/tabler-icons';
import { CashRegisterService } from '@/features/cash-register/services/cash-register.service';
import { CashRegisterSummary } from '@/features/cash-register/components/cash-register-summary/cash-register-summary';
import { extractApiError } from '@/api/extract-api-error';
import { resolveApiError } from '@/shared/utils/api-error';
import { CashRegisterMovementTable } from '@/features/cash-register/components/cash-register-movement-table/cash-register-movement-table';

@Component({
  selector: 'app-cash-register-detail-page',
  imports: [DatePipe, RouterLink, NgIcon, CashRegisterSummary, CashRegisterMovementTable],
  viewProviders: [provideIcons({ tablerArrowLeft, tablerReceipt })],
  templateUrl: './cash-register-detail-page.html',
})
export class CashRegisterDetailPage {
  private router = inject(Router);
  private cashRegisterService = inject(CashRegisterService);

  readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map(params => params.get('id') ?? '')), {
    requireSync: true,
  });

  registerResource = rxResource({
    params: () => this.id() || undefined,
    stream: ({ params: id }) => this.cashRegisterService.getRegister(id),
  });

  /** 404 y un id con formato inválido (422) se muestran igual: la caja no existe. */
  readonly notFound = computed(() => {
    const error = this.registerResource.error();
    if (!this.id()) return true;
    if (!error) return false;
    const code = extractApiError(error).code;
    return code === 'NOT_FOUND' || code === 'VALIDATION_ERROR';
  });

  private resolvedError = computed(() => {
    const error = this.registerResource.error();
    return error ? resolveApiError(error, 'No se pudo cargar la caja.') : null;
  });

  readonly errorMessage = computed(() => this.resolvedError()?.message ?? null);

  redirectOnAuthError = effect(() => {
    const redirect = this.resolvedError()?.redirect;
    if (redirect) void this.router.navigate([redirect]);
  });
}
