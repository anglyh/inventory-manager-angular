import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, effect, inject, input, linkedSignal, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  tablerArrowDownLeft,
  tablerArrowsExchange,
  tablerArrowUpRight,
  tablerChevronLeft,
  tablerChevronRight,
} from '@ng-icons/tabler-icons';
import { CashRegisterService } from '@/features/cash-register/services/cash-register.service';
import type { CashMovementPage } from '@/features/cash-register/interfaces/cash-register.interface';
import { Button } from '@/shared/components/button/button';

const PAGE_SIZE = 10;

/**
 * El paginador es propio: `<app-pagination>` maneja `?page` en la URL y esta lista va
 * incrustada en otras pantallas (la caja abierta y el detalle).
 */
@Component({
  selector: 'cash-register-movement-table',
  imports: [DatePipe, DecimalPipe, NgIcon, Button],
  viewProviders: [
    provideIcons({ tablerArrowDownLeft, tablerArrowsExchange, tablerArrowUpRight, tablerChevronLeft, tablerChevronRight }),
  ],
  templateUrl: './cash-register-movement-table.html',
})
export class CashRegisterMovementTable {
  readonly registerId = input.required<string>();
  readonly refreshKey = input(0);
  /** Caja abierta: usa `/current/movements`, permitido a GUEST (`/:id/movements` es solo ADMIN). */
  readonly current = input(false);
  /** Total de movimientos de la caja, para mostrarlo fuera de la lista. */
  readonly totalChange = output<number>();
  private readonly service = inject(CashRegisterService);

  /** Otra caja empieza en la primera página. */
  readonly page = linkedSignal({ source: this.registerId, computation: () => 1 });

  readonly movementsResource = rxResource({
    params: () => ({ id: this.registerId(), current: this.current(), page: this.page(), refresh: this.refreshKey() }),
    stream: ({ params }) =>
      params.current
        ? this.service.getCurrentMovements(params.page, PAGE_SIZE)
        : this.service.getMovements(params.id, params.page, PAGE_SIZE),
  });

  /** Al cambiar de página se conserva la anterior (atenuada) en vez del esqueleto; otra caja empieza vacía. */
  readonly movements = linkedSignal<
    { id: string; value: CashMovementPage | undefined },
    CashMovementPage | undefined
  >({
    source: () => ({
      id: this.registerId(),
      value: this.movementsResource.hasValue() ? this.movementsResource.value() : undefined,
    }),
    computation: (source, previous) =>
      source.value ?? (previous?.source.id === source.id ? previous.value : undefined),
  });

  private readonly emitTotal = effect(() => {
    const total = this.movements()?.meta.total;
    if (total !== undefined) this.totalChange.emit(total);
  });
}
