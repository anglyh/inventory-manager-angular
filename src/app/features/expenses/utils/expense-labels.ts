import type { ExpenseGroup, ExpenseSource } from '../interfaces/expense.interface';

export const EXPENSE_GROUP_LABEL: Record<ExpenseGroup, string> = {
  LODGING: 'Hospedaje',
  GENERAL: 'General',
};

export const EXPENSE_SOURCE_LABEL: Record<ExpenseSource, string> = {
  CASH_REGISTER: 'Caja',
  OUTSIDE: 'Fuera de caja',
};

/** `YYYY-MM-DD` (día Lima, sin hora) → "5 oct 2026"; se lee como UTC para no correr el día. */
export function formatSpentOn(plain: string): string {
  return new Date(`${plain}T00:00:00Z`)
    .toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .replace(/\./g, '');
}
