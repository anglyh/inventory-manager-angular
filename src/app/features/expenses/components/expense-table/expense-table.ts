import { Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerDots } from '@ng-icons/tabler-icons';
import { Button } from '@/shared/components/button/button';
import type { Expense } from '../../interfaces/expense.interface';
import { EXPENSE_GROUP_LABEL, EXPENSE_SOURCE_LABEL, formatSpentOn } from '../../utils/expense-labels';

/** Gastos del período: fecha, categoría, de dónde salió el dinero y el monto. */
@Component({
  selector: 'expense-table',
  imports: [Button, DecimalPipe, NgIcon],
  viewProviders: [provideIcons({ tablerDots })],
  templateUrl: './expense-table.html',
  host: { class: 'block' },
})
export class ExpenseTable {
  expenses = input.required<Expense[]>();
  /** Fila con una acción en curso. */
  busyId = input<string | null>(null);

  remove = output<Expense>();

  readonly groupLabel = EXPENSE_GROUP_LABEL;
  readonly sourceLabel = EXPENSE_SOURCE_LABEL;
  readonly formatDate = formatSpentOn;

  /** Los dropdown de daisyUI se cierran al perder el foco: tras elegir, se suelta. */
  blurActive() {
    (document.activeElement as HTMLElement | null)?.blur();
  }
}
