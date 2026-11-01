import type { components, paths } from 'src/app/api/generated/schema';

type Schemas = components['schemas'];

export type ExpenseGroup = Schemas['ExpenseGroup'];
export type ExpenseSource = Schemas['ExpenseSource'];

export type Expense = Schemas['Expense'];
export type ExpensePage = Schemas['ExpensePage'];
export type ExpenseQuery = NonNullable<paths['/api/expense']['get']['parameters']['query']>;
export type CreateExpenseRequest = Schemas['CreateExpense'];

export type ExpenseCategory = Schemas['ExpenseCategory'];
export type CreateExpenseCategoryRequest = Schemas['CreateExpenseCategory'];
export type UpdateExpenseCategoryRequest = Schemas['UpdateExpenseCategory'];
