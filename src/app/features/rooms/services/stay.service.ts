import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import type { DocumentType, Guest } from '../interfaces/room.interface';
import type {
  CheckInRequest,
  CheckOutRequest,
  CreateStayChargeRequest,
  CreateStayPaymentRequest,
  StayDetail,
  StayPage,
  StayQuery,
} from '../interfaces/stay.interface';

const stayUrl = `${environment.apiUrl}/stay`;
const guestUrl = `${environment.apiUrl}/guest`;

@Injectable({ providedIn: 'root' })
export class StayService {
  private http = inject(HttpClient);

  findGuest(documentType: DocumentType, documentNumber: string): Observable<Guest | null> {
    const params = new HttpParams().set('documentType', documentType).set('documentNumber', documentNumber);
    return this.http.get<Guest | null>(guestUrl, { params });
  }

  checkIn(body: CheckInRequest): Observable<StayDetail> {
    return this.http.post<StayDetail>(stayUrl, body);
  }

  /** Se omiten las claves vacías porque el backend es estricto. */
  getStays(query: StayQuery): Observable<StayPage> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, value);
    }
    return this.http.get<StayPage>(stayUrl, { params });
  }

  getStay(id: string): Observable<StayDetail> {
    return this.http.get<StayDetail>(`${stayUrl}/${id}`);
  }

  addCharge(id: string, body: CreateStayChargeRequest): Observable<StayDetail> {
    return this.http.post<StayDetail>(`${stayUrl}/${id}/charge`, body);
  }

  addPayment(id: string, body: CreateStayPaymentRequest): Observable<StayDetail> {
    return this.http.post<StayDetail>(`${stayUrl}/${id}/payment`, body);
  }

  checkOut(id: string, body: CheckOutRequest): Observable<StayDetail> {
    return this.http.post<StayDetail>(`${stayUrl}/${id}/check-out`, body);
  }

  setMigrationsReported(id: string, reported: boolean): Observable<StayDetail> {
    return this.http.patch<StayDetail>(`${stayUrl}/${id}/migrations`, { reported });
  }
}
