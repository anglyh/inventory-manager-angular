import { inject, Injectable, linkedSignal, type ResourceStatus } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '@/auth/services/auth.service';
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
  private auth = inject(AuthService);

  /**
   * Depende del usuario: al cerrar sesión queda vacío (idle) y al entrar otro usuario se consulta
   * de nuevo, así un GUEST nunca ve el resumen que había cargado un ADMIN.
   */
  currentCashRegisterResource = rxResource({
    params: () => this.auth.user()?.id,
    stream: () => this.loadCurrent(),
  });

  /**
   * Última caja conocida: si una recarga falla se conserva la anterior para no tapar la pantalla.
   * `undefined` = todavía no se sabe; `null` = no hay caja abierta.
   */
  readonly currentCashRegister = linkedSignal<
    { status: ResourceStatus; value: CashRegister | null | undefined },
    CashRegister | null | undefined
  >({
    source: () => {
      const resource = this.currentCashRegisterResource;
      return { status: resource.status(), value: resource.hasValue() ? resource.value() : undefined };
    },
    // Solo un error o una recarga conservan lo anterior; sin sesión u otro usuario se descarta.
    computation: (source, previous) =>
      source.value !== undefined || (source.status !== 'error' && source.status !== 'reloading')
        ? source.value
        : previous?.value,
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

  getCurrentMovements(page = 1, limit = 6): Observable<CashMovementPage> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<CashMovementPage>(`${baseUrl}/current/movements`, { params });
  }

  getMovements(id: string, page = 1, limit = 6): Observable<CashMovementPage> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<CashMovementPage>(`${baseUrl}/${id}/movements`, { params });
  }
}
