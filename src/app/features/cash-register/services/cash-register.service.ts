import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import type {
  CashMovementPage,
  CashRegister,
  CashRegisterOpened,
  CashRegisterPage,
  CashRegisterQuery,
  CloseCashRegisterRequest,
  CreateCashMovementRequest,
  OpenCashRegisterRequest,
} from '../interfaces/cash-register.interface';

const baseUrl = `${environment.apiUrl}/cash-register`;

@Injectable({ providedIn: 'root' })
export class CashRegisterService {
  private http = inject(HttpClient);

  currentCashRegisterResource = rxResource({
    stream: () => this.loadCurrent(),
  });

  loadCurrent(): Observable<CashRegister | null> {
    return this.http.get<CashRegister | null>(`${baseUrl}/current`);
  }

  open(body: OpenCashRegisterRequest): Observable<CashRegisterOpened> {
    return this.http.post<CashRegisterOpened>(`${baseUrl}/open`, body);
  }

  close(id: string, body: CloseCashRegisterRequest): Observable<void> {
    return this.http.post<void>(`${baseUrl}/${id}/close`, body);
  }

  createMovement(id: string, body: CreateCashMovementRequest): Observable<void> {
    return this.http.post<void>(`${baseUrl}/${id}/movements`, body);
  }

  getRegister(id: string): Observable<CashRegister> {
    return this.http.get<CashRegister>(`${baseUrl}/${id}`);
  }

  /** Paginación por página (1-based); se omiten las claves vacías porque el backend es estricto. */
  getRegisters(query: CashRegisterQuery): Observable<CashRegisterPage> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.status) params = params.set('status', query.status);
    return this.http.get<CashRegisterPage>(baseUrl, { params });
  }

  getMovements(id: string, page = 1, limit = 6): Observable<CashMovementPage> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<CashMovementPage>(`${baseUrl}/${id}/movements`, { params });
  }
}
