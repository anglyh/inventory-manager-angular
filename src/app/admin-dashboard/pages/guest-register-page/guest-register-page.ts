import { Button } from '@/shared/components/button/button';
import { Component, computed, effect, inject, untracked } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle } from '@ng-icons/tabler-icons';
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
  imports: [Button, ReactiveFormsModule, NgIcon, Pagination, GuestRegisterTable],
  viewProviders: [provideIcons({ tablerAlertCircle })],
  templateUrl: './guest-register-page.html',
})
export class GuestRegisterPage {
  private stayService = inject(StayService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder).nonNullable;
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

  readonly staysResource = rxResource({
    params: () => ({ ...this.range(), page: this.paginationService.currentPage() }),
    stream: ({ params }) =>
      this.stayService.getStays({
        from: limaPlainDateToStartISO(params.from),
        to: limaPlainDateToEndISO(params.to),
        page: params.page,
        limit: PAGE_SIZE,
      }),
  });

  readonly stays = computed(() => this.staysResource.value()?.data ?? []);
  readonly meta = computed(() => this.staysResource.value()?.meta ?? null);
  readonly pendingMigrations = computed(
    () => this.stays().filter(stay => stay.hasForeignGuests && !stay.migrationsReportedAt).length,
  );

  form = this.fb.group({
    from: this.fb.control('', Validators.required),
    to: this.fb.control('', Validators.required),
  });

  syncForm = effect(() => {
    const range = this.range();
    untracked(() => this.form.setValue(range));
  });

  openStay(id: string) {
    void this.router.navigate(['/rooms/stay', id]);
  }

  apply() {
    if (this.form.invalid) return;
    const { from, to } = this.form.getRawValue();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { from, to, page: null },
      queryParamsHandling: 'merge',
    });
  }
}
