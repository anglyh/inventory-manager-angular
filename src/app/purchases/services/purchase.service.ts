import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';

const baseUrl = environment.apiUrl + '/purchase'

@Injectable({providedIn: 'root'})
export class PurchaseService {
  private http = inject(HttpClient)

  getPurchases() {
    return this.http.get(`${baseUrl}`)
  }
}