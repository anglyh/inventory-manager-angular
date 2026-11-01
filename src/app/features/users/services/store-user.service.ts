import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import type { CreateStoreUserRequest, StoreUser, UpdateStoreUserRequest } from '../interfaces/store-user.interface';

const baseUrl = environment.apiUrl + '/store-user';

@Injectable({ providedIn: 'root' })
export class StoreUserService {
  private http = inject(HttpClient);

  list(): Observable<StoreUser[]> {
    return this.http.get<StoreUser[]>(baseUrl);
  }

  /** El backend siempre lo crea como GUEST en la tienda del admin. */
  create(data: CreateStoreUserRequest): Observable<StoreUser> {
    return this.http.post<StoreUser>(baseUrl, data);
  }

  /** Solo empleados (GUEST): un desactivado pierde el acceso en su siguiente petición. */
  update(id: string, data: UpdateStoreUserRequest): Observable<StoreUser> {
    return this.http.patch<StoreUser>(`${baseUrl}/${id}`, data);
  }
}
