import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerAlertCircle, tablerPlus, tablerTag } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import { ModuleTabs } from '@/shared/components/module-tabs/module-tabs';
import { EXPENSES_TABS } from '@/admin-dashboard/module-tabs';
import { GlobalNotificationService } from '@/shared/components/global-notification/global-notification.service';
import { resolveApiError } from '@/shared/utils/api-error';
import { ExpenseService } from '@/features/expenses/services/expense.service';
import { ExpenseCategoryTable } from '@/features/expenses/components/expense-category-table/expense-category-table';
import {
  ExpenseCategoryForm,
  type ExpenseCategorySubmit,
} from '@/features/expenses/components/expense-category-form/expense-category-form';
import { DeleteConfirmDialog } from '@/features/rooms/components/delete-confirm-dialog/delete-confirm-dialog';
import type { ExpenseCategory } from '@/features/expenses/interfaces/expense.interface';

/** Catálogo de categorías de gastos, cada una en su grupo (hospedaje o general). */
@Component({
  selector: 'app-expense-categories-page',
  imports: [Button, NgIcon, ExpenseCategoryTable, ExpenseCategoryForm, DeleteConfirmDialog, ModuleTabs],
  viewProviders: [provideIcons({ tablerAlertCircle, tablerPlus, tablerTag })],
  templateUrl: './expense-categories-page.html',
})
export class ExpenseCategoriesPage {
  private expenseService = inject(ExpenseService);
  private router = inject(Router);
  private notification = inject(GlobalNotificationService);
  readonly moduleTabs = EXPENSES_TABS;

  readonly categoriesResource = rxResource({ stream: () => this.expenseService.getCategories() });
  readonly categories = computed(() => this.categoriesResource.value() ?? []);

  // Formulario
  readonly formOpen = signal(false);
  readonly editing = signal<ExpenseCategory | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  // Acciones de fila
  readonly busyId = signal<string | null>(null);

  // Eliminación
  readonly deleteOpen = signal(false);
  readonly deleteTarget = signal<ExpenseCategory | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  openForm(category: ExpenseCategory | null) {
    this.editing.set(category);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  save(submit: ExpenseCategorySubmit) {
    if (this.saving()) return;
    this.saving.set(true);
    this.formError.set(null);
    const request: Observable<ExpenseCategory> =
      submit.id === null
        ? this.expenseService.createCategory(submit.body)
        : this.expenseService.updateCategory(submit.id, submit.body);
    request.subscribe({
      next: category => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.categoriesResource.reload();
        this.notification.show(submit.id === null ? `Categoría ${category.name} creada` : `Categoría ${category.name} actualizada`);
      },
      error: error => {
        this.saving.set(false);
        const resolved = resolveApiError(error, 'No se pudo guardar la categoría.');
        if (resolved.redirect) void this.router.navigate([resolved.redirect]);
        else this.formError.set(resolved.message);
      },
    });
  }

  toggleActive(category: ExpenseCategory) {
    if (this.busyId()) return;
    this.busyId.set(category.id);
    this.expenseService.updateCategory(category.id, { isActive: !category.isActive }).subscribe({
      next: updated => {
        this.busyId.set(null);
        this.categoriesResource.reload();
        this.notification.show(`Categoría ${updated.name} ${updated.isActive ? 'activada' : 'desactivada'}`);
      },
      error: error => {
        this.busyId.set(null);
        this.notifyError(error, 'No se pudo actualizar la categoría.');
      },
    });
  }

  askDelete(category: ExpenseCategory) {
    this.deleteTarget.set(category);
    this.deleteError.set(null);
    this.deleteOpen.set(true);
  }

  confirmDelete() {
    const category = this.deleteTarget();
    if (!category || this.deleting()) return;
    this.deleting.set(true);
    this.expenseService.deleteCategory(category.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteOpen.set(false);
        this.categoriesResource.reload();
        this.notification.show(`Categoría ${category.name} eliminada`);
      },
      error: error => {
        this.deleting.set(false);
        const resolved = resolveApiError(error, 'No se pudo eliminar la categoría.');
        if (resolved.redirect) void this.router.navigate([resolved.redirect]);
        else this.deleteError.set(resolved.message);
      },
    });
  }

  /** Tras un rechazo por tener gastos, se ofrece desactivarla en su lugar. */
  deactivateInstead() {
    const category = this.deleteTarget();
    if (!category) return;
    this.deleteOpen.set(false);
    if (category.isActive) this.toggleActive(category);
  }

  private notifyError(error: unknown, fallback: string) {
    const resolved = resolveApiError(error, fallback);
    if (resolved.redirect) void this.router.navigate([resolved.redirect]);
    else this.notification.show(resolved.message, 'error');
  }
}
