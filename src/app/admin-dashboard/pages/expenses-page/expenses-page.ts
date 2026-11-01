import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle, tablerPlus, tablerReceipt } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { ModuleTabs } from '@/shared/components/module-tabs/module-tabs';
import { DateRangeFilter } from '@/shared/components/date-range-filter/date-range-filter';
import type { DateRangeValue } from '@/shared/components/date-range-filter/date-range';
import { Pagination } from '@/shared/components/pagination/pagination';
import { PaginationService } from '@/shared/components/pagination/pagination.service';
import { GlobalNotificationService } from '@/shared/components/global-notification/global-notification.service';
import { resolveApiError } from '@/shared/utils/api-error';
import { EXPENSES_TABS } from '@/admin-dashboard/module-tabs';
import { ExpenseService } from '@/features/expenses/services/expense.service';
import { ExpenseTable } from '@/features/expenses/components/expense-table/expense-table';
import { ExpenseForm } from '@/features/expenses/components/expense-form/expense-form';
import { DeleteConfirmDialog } from '@/features/rooms/components/delete-confirm-dialog/delete-confirm-dialog';
import { CashRegisterService } from '@/features/cash-register/services/cash-register.service';
import type { CreateExpenseRequest, Expense, ExpenseGroup } from '@/features/expenses/interfaces/expense.interface';
import {
  getLimaTodayPlainDate,
  getPeriodRange,
  limaPlainDateToEndISO,
  limaPlainDateToStartISO,
  parsePlainDate,
} from '@/features/reports/utils/lima-profit-range';

const PAGE_SIZE = 20;

const GROUP_FILTERS: { value: ExpenseGroup | null; label: string }[] = [
  { value: null, label: 'Todos' },
  { value: 'LODGING', label: 'Hospedaje' },
  { value: 'GENERAL', label: 'Generales' },
];

function parseGroup(value: string | null): ExpenseGroup | null {
  return value === 'LODGING' || value === 'GENERAL' ? value : null;
}

/** Gastos de un período (rango y grupo en la URL), con su total y el registro de nuevos gastos. */
@Component({
  selector: 'app-expenses-page',
  imports: [Button, DecimalPipe, DateRangeFilter, NgIcon, ModuleTabs, Pagination, ExpenseTable, ExpenseForm, DeleteConfirmDialog],
  viewProviders: [provideIcons({ tablerAlertCircle, tablerPlus, tablerReceipt })],
  templateUrl: './expenses-page.html',
})
export class ExpensesPage {
  private expenseService = inject(ExpenseService);
  private cashRegisterService = inject(CashRegisterService);
  private notification = inject(GlobalNotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly paginationService = inject(PaginationService);

  readonly moduleTabs = EXPENSES_TABS;
  readonly groupFilters = GROUP_FILTERS;
  readonly today = getLimaTodayPlainDate();
  private readonly defaultRange = getPeriodRange('month', this.today);

  /** Rango (días Lima, inclusivos) y grupo en la URL; por defecto, el mes actual y todos. */
  readonly filters = toSignal(
    this.route.queryParamMap.pipe(
      map(params => {
        const from = parsePlainDate(params.get('from')) ?? this.defaultRange.from;
        const to = parsePlainDate(params.get('to')) ?? this.defaultRange.to;
        const range = from <= to ? { from, to } : { from: to, to: from };
        return { ...range, group: parseGroup(params.get('group')) };
      }),
    ),
    { initialValue: { ...this.defaultRange, group: null as ExpenseGroup | null } },
  );

  readonly expensesResource = rxResource({
    params: () => ({ ...this.filters(), page: this.paginationService.currentPage() }),
    stream: ({ params }) =>
      this.expenseService.getExpenses({
        from: limaPlainDateToStartISO(params.from),
        to: limaPlainDateToEndISO(params.to),
        group: params.group ?? undefined,
        page: params.page,
        limit: PAGE_SIZE,
      }),
  });

  readonly categoriesResource = rxResource({ stream: () => this.expenseService.getCategories() });

  readonly expenses = computed(() => this.expensesResource.value()?.data ?? []);
  readonly meta = computed(() => this.expensesResource.value()?.meta ?? null);
  readonly totalAmount = computed(() => this.expensesResource.value()?.totalAmount ?? null);
  readonly categories = computed(() => this.categoriesResource.value() ?? []);

  // Registro
  readonly formOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  // Eliminación
  readonly deleteOpen = signal(false);
  readonly deleteTarget = signal<Expense | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  applyRange({ from, to }: DateRangeValue) {
    if (!from || !to) return;
    this.navigate({ from, to });
  }

  selectGroup(group: ExpenseGroup | null) {
    this.navigate({ group });
  }

  openForm() {
    this.formError.set(null);
    this.formOpen.set(true);
    // Puede haber categorías nuevas desde la otra pestaña.
    this.categoriesResource.reload();
  }

  save(body: CreateExpenseRequest) {
    if (this.saving()) return;
    this.saving.set(true);
    this.formError.set(null);
    this.expenseService.createExpense(body).subscribe({
      next: expense => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.afterChange(expense);
        this.notification.show(`Gasto de ${expense.categoryName} registrado`);
      },
      error: error => {
        this.saving.set(false);
        const resolved = resolveApiError(error, 'No se pudo registrar el gasto.');
        if (resolved.redirect) void this.router.navigate([resolved.redirect]);
        else this.formError.set(resolved.message);
      },
    });
  }

  askDelete(expense: Expense) {
    this.deleteTarget.set(expense);
    this.deleteError.set(null);
    this.deleteOpen.set(true);
  }

  confirmDelete() {
    const expense = this.deleteTarget();
    if (!expense || this.deleting()) return;
    this.deleting.set(true);
    this.expenseService.deleteExpense(expense.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteOpen.set(false);
        this.afterChange(expense);
        this.notification.show('Gasto eliminado');
      },
      error: error => {
        this.deleting.set(false);
        const resolved = resolveApiError(error, 'No se pudo eliminar el gasto.');
        if (resolved.redirect) void this.router.navigate([resolved.redirect]);
        else this.deleteError.set(resolved.message);
      },
    });
  }

  deleteHint(expense: Expense | null): string {
    return expense?.source === 'CASH_REGISTER'
      ? 'Ese dinero vuelve a contar como parte de la caja.'
      : 'Esta acción no se puede deshacer.';
  }

  /** Recarga la lista y, si el dinero salió de la caja, el efectivo esperado de la caja abierta. */
  private afterChange(expense: Expense) {
    this.expensesResource.reload();
    if (expense.source === 'CASH_REGISTER') this.cashRegisterService.currentCashRegisterResource.reload();
  }

  private navigate(queryParams: Record<string, string | null>) {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...queryParams, page: null },
      queryParamsHandling: 'merge',
    });
  }
}
