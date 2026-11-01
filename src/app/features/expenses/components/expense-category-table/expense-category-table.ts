import { Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerDots } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import type { ExpenseCategory } from '../../interfaces/expense.interface';
import { EXPENSE_GROUP_LABEL } from '../../utils/expense-labels';

/** Categorías de gastos con su grupo, cuántos gastos tienen y acciones por fila. */
@Component({
  selector: 'expense-category-table',
  imports: [Button, NgIcon],
  viewProviders: [provideIcons({ tablerDots })],
  templateUrl: './expense-category-table.html',
  host: { class: 'block' },
})
export class ExpenseCategoryTable {
  categories = input.required<ExpenseCategory[]>();
  /** Fila con una acción en curso. */
  busyId = input<string | null>(null);

  edit = output<ExpenseCategory>();
  toggleActive = output<ExpenseCategory>();
  remove = output<ExpenseCategory>();

  readonly groupLabel = EXPENSE_GROUP_LABEL;

  /** Los dropdown de daisyUI se cierran al perder el foco: tras elegir, se suelta. */
  blurActive() {
    (document.activeElement as HTMLElement | null)?.blur();
  }
}
