import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CashRegisterService } from '@/features/cash-register/services/cash-register.service';

const PAGE_SIZE = 6;

@Component({
  selector: 'cash-register-movement-table',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './cash-register-movement-table.html',
})
export class CashRegisterMovementTable {
  readonly registerId = input.required<string>();
  readonly refreshKey = input(0);
  private readonly service = inject(CashRegisterService);

  /** Otra caja empieza en la primera página. */
  readonly page = linkedSignal({ source: this.registerId, computation: () => 1 });

  readonly movementsResource = rxResource({
    params: () => ({ id: this.registerId(), page: this.page(), refresh: this.refreshKey() }),
    stream: ({ params }) => this.service.getMovements(params.id, params.page, PAGE_SIZE),
  });
}
