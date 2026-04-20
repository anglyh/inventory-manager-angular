import { Injectable, inject } from '@angular/core';
import { Observable } from 'node_modules/rxjs/dist/types';
import { CursorPaginatedResponse, PaginatedResponse } from 'src/app/shared/interfaces/pagination.interface';
import { environment } from 'src/environments/environment';
import { CreateInventoryMovement, InventoryMovement } from '../interfaces/inventory-movement.interface';
import { HttpClient, HttpParams } from '@angular/common/http';

const baseUrl = environment.apiUrl + "/inventory-movement"

interface Options { 
  limit?: number;
  cursorDate?: string;
  cursorId?: string;
}

@Injectable({providedIn: 'root'})
export class InventoryMovementService {
  private http = inject(HttpClient)  

  getEntries(options: Options): Observable<CursorPaginatedResponse<InventoryMovement>> {
    const { limit = 12, cursorDate, cursorId } = options
    let params = new HttpParams()
      .set('limit', limit)

    if (cursorDate && cursorId) {
      params = params.set('cursorDate', cursorDate)
                     .set('cursorId', cursorId)
    }

    return this.http.get<CursorPaginatedResponse<InventoryMovement>>(`${baseUrl}/entries`,  { params })
  }

  registerEntry(data: CreateInventoryMovement) {
    return this.http.post(`${baseUrl}/entries`, data)
  }

  registerExit(data: CreateInventoryMovement) {
    return this.http.post(`${baseUrl}/exits`, data);
  }

  getExits(options: Options): Observable<CursorPaginatedResponse<InventoryMovement>> {
    const { limit = 12, cursorDate, cursorId } = options

    let params = new HttpParams()
      .set('limit', limit)

    if (cursorDate && cursorId) {
      params = params.set('cursorDate', cursorDate)
                     .set('cursorId', cursorId)
    }

    return this.http.get<CursorPaginatedResponse<InventoryMovement>>(`${baseUrl}/exits`, { params })
  }
}