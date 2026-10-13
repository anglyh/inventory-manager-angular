import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import type { ReportOverview } from '../interfaces/report.interface';

const baseUrl = environment.apiUrl + '/report';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);

  getOverview(from: string, to: string): Observable<ReportOverview> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<ReportOverview>(`${baseUrl}/overview`, { params });
  }
}
