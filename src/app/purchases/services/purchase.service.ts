import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { CreatePurchaseDto } from '../interfaces/purchase.interface';

const baseUrl = environment.apiUrl + '/purchase'

@Injectable({providedIn: 'root'})
export class PurchaseService {
  private http = inject(HttpClient)

  getPurchases() {
    return this.http.get(`${baseUrl}`)
  }

  registerPurchase(purchaseData: CreatePurchaseDto) {
    return this.http.post(`${baseUrl}`, purchaseData)
  }
}