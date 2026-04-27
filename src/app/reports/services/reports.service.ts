import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ProfitByProductResponse,
  ProfitSummaryResponse,
} from '../interfaces/report.interface';

const baseUrl = environment.apiUrl + '/report';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);

  getProfitSummary(from: string, to: string): Observable<ProfitSummaryResponse> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<ProfitSummaryResponse>(`${baseUrl}/profit/summary`, {
      params,
    });
  }

  getProfitByProduct(
    from: string,
    to: string,
    limit: number,
  ): Observable<ProfitByProductResponse> {
    const params = new HttpParams()
      .set('from', from)
      .set('to', to)
      .set('limit', String(limit));
    return this.http.get<ProfitByProductResponse>(`${baseUrl}/profit/by-product`, {
      params,
    });
  }
}
