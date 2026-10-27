import { Button } from '@/shared/components/button/button';
import { Component, computed, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { DateRangeFilter } from '@/shared/components/date-range-filter/date-range-filter';
import type { DateRangeValue } from '@/shared/components/date-range-filter/date-range';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle, tablerPlaneArrival, tablerX } from '@ng-icons/tabler-icons';
import { Pagination } from '@/shared/components/pagination/pagination';
import { PaginationService } from '@/shared/components/pagination/pagination.service';
import { StayService } from '@/features/rooms/services/stay.service';
import { GuestRegisterTable } from '@/features/rooms/components/guest-register-table/guest-register-table';
import {
  getLimaTodayPlainDate,
  getPeriodRange,
  limaPlainDateToEndISO,
  limaPlainDateToStartISO,
  parsePlainDate,
} from '@/features/reports/utils/lima-profit-range';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-guest-register-page',
  imports: [Button, DateRangeFilter, NgIcon, Pagination, GuestRegisterTable],
  viewProviders: [provideIcons({ tablerAlertCircle, tablerPlaneArrival, tablerX })],
  templateUrl: './guest-register-page.html',
})
export class GuestRegisterPage {
  private stayService = inject(StayService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly paginationService = inject(PaginationService);

  readonly today = getLimaTodayPlainDate();
  private readonly defaultRange = getPeriodRange('month', this.today);

  /** Rango en la URL (días Lima, inclusivos); por defecto, el mes actual. */
  readonly range = toSignal(
    this.route.queryParamMap.pipe(
      map(params => {
        const from = parsePlainDate(params.get('from')) ?? this.defaultRange.from;
        const to = parsePlainDate(params.get('to')) ?? this.defaultRange.to;
        return from <= to ? { from, to } : { from: to, to: from };
      }),
    ),
    { initialValue: this.defaultRange },
  );

  /**
   * `?migrations=pending`: solo estadías con extranjeros sin reportar a Migraciones.
   * Es una foto de lo pendiente, así que ignora el rango de fechas.
   */
  readonly pendingOnly = toSignal(
    this.route.queryParamMap.pipe(map(params => params.get('migrations') === 'pending')),
    { initialValue: this.route.snapshot.queryParamMap.get('migrations') === 'pending' },
  );

  readonly staysResource = rxResource({
    params: () => ({ ...this.range(), pendingOnly: this.pendingOnly(), page: this.paginationService.currentPage() }),
    stream: ({ params }) =>
      this.stayService.getStays(
        params.pendingOnly
          ? { migrations: 'pending', page: params.page, limit: PAGE_SIZE }
          : {
              from: limaPlainDateToStartISO(params.from),
              to: limaPlainDateToEndISO(params.to),
              page: params.page,
              limit: PAGE_SIZE,
            },
      ),
  });

  readonly stays = computed(() => this.staysResource.value()?.data ?? []);
  readonly meta = computed(() => this.staysResource.value()?.meta ?? null);
  readonly pendingMigrations = computed(
    () => this.stays().filter(stay => stay.hasForeignGuests && !stay.migrationsReportedAt).length,
  );

  openStay(id: string) {
    void this.router.navigate(['/rooms/stay', id]);
  }

  setPendingOnly(pending: boolean) {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { migrations: pending ? 'pending' : null, page: null },
      queryParamsHandling: 'merge',
    });
  }

  apply({ from, to }: DateRangeValue) {
    if (!from || !to) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { from, to, page: null },
      queryParamsHandling: 'merge',
    });
  }
}
