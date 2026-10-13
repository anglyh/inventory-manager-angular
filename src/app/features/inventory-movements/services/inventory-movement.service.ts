import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import type { InventoryMovement, InventoryMovementQuery, InventoryMovementsPage, VoidMovementRequest } from '../interfaces/inventory-movement.interface';
import type { CreatePurchaseRequest } from '../interfaces/purchase.interface';
import type { CreateSaleRequest } from '../interfaces/sale.interface';
import type {
  CreateInitialLoadRequest,
  CreateLossRequest,
  StockCountRequest,
} from '../interfaces/other-movement-request.interface';

const baseUrl = environment.apiUrl + "/inventory-movement"

@Injectable({providedIn: 'root'})
export class InventoryMovementService {
  private http = inject(HttpClient)

  getMovements(query: InventoryMovementQuery): Observable<InventoryMovementsPage> {
    let params = new HttpParams()

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, value)
    }

    return this.http.get<InventoryMovementsPage>(baseUrl, { params })
  }

  getMovement(id: string): Observable<InventoryMovement> {
    return this.http.get<InventoryMovement>(`${baseUrl}/${id}`)
  }

  voidMovement(id: string, data: VoidMovementRequest) {
    return this.http.post<void>(`${baseUrl}/${id}/void`, data)
  }

  registerPurchase(data: CreatePurchaseRequest) {
    return this.http.post<void>(`${baseUrl}/purchases`, data)
  }

  registerSale(data: CreateSaleRequest) {
    return this.http.post(`${baseUrl}/sales`, data);
  }

  registerLoss(data: CreateLossRequest) {
    return this.http.post<void>(`${baseUrl}/losses`, data)
  }

  registerStockCount(data: StockCountRequest) {
    return this.http.post<void>(`${baseUrl}/stock-counts`, data)
  }

  registerInitialLoad(data: CreateInitialLoadRequest) {
    return this.http.post<void>(`${baseUrl}/initial-loads`, data)
  }
}
