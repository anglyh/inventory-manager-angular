import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import type { Supplier, SupplierInput } from '../interfaces/supplier.interface';

const baseUrl = environment.apiUrl + '/supplier';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private http = inject(HttpClient);

  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(baseUrl);
  }

  createSupplier(data: SupplierInput): Observable<Supplier> {
    return this.http.post<Supplier>(baseUrl, data);
  }

  updateSupplier(id: string, data: SupplierInput): Observable<Supplier> {
    return this.http.put<Supplier>(`${baseUrl}/${id}`, data);
  }

  /** 409 si tiene compras: se conserva para no romper el historial. */
  deleteSupplier(id: string): Observable<void> {
    return this.http.delete<void>(`${baseUrl}/${id}`);
  }
}
