import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import type {
  CreateExpenseCategoryRequest,
  CreateExpenseRequest,
  Expense,
  ExpenseCategory,
  ExpensePage,
  ExpenseQuery,
  UpdateExpenseCategoryRequest,
} from '../interfaces/expense.interface';

const expenseUrl = `${environment.apiUrl}/expense`;
const categoryUrl = `${environment.apiUrl}/expense-category`;

/** Gastos del negocio y su catálogo de categorías (solo admin). */
@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private http = inject(HttpClient);

  /** Se omiten las claves vacías porque el backend es estricto. */
  getExpenses(query: ExpenseQuery): Observable<ExpensePage> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, value);
    }
    return this.http.get<ExpensePage>(expenseUrl, { params });
  }

  createExpense(body: CreateExpenseRequest): Observable<Expense> {
    return this.http.post<Expense>(expenseUrl, body);
  }

  deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${expenseUrl}/${id}`);
  }

  getCategories(): Observable<ExpenseCategory[]> {
    return this.http.get<ExpenseCategory[]>(categoryUrl);
  }

  createCategory(body: CreateExpenseCategoryRequest): Observable<ExpenseCategory> {
    return this.http.post<ExpenseCategory>(categoryUrl, body);
  }

  updateCategory(id: string, body: UpdateExpenseCategoryRequest): Observable<ExpenseCategory> {
    return this.http.patch<ExpenseCategory>(`${categoryUrl}/${id}`, body);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${categoryUrl}/${id}`);
  }
}
