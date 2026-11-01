import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import type { ReportOverview } from '../interfaces/report.interface';

const baseUrl = environment.apiUrl + '/report';

/** Instantes ISO; `to` es exclusivo. */
export interface IsoRange {
  from: string;
  to: string;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);

  /** Sin `compare`, el backend compara contra el mismo largo justo antes de `from`. */
  getOverview(range: IsoRange, compare?: IsoRange): Observable<ReportOverview> {
    let params = new HttpParams().set('from', range.from).set('to', range.to);
    if (compare) params = params.set('compareFrom', compare.from).set('compareTo', compare.to);
    return this.http.get<ReportOverview>(`${baseUrl}/overview`, { params });
  }
}
