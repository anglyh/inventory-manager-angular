import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { Product, ProductWithStock } from '../interfaces/product.interface';
import { environment } from '@environments/environment';
import { PaginatedResponse } from '@/shared/interfaces/pagination.interface';

const baseUrl = environment.apiUrl + '/product'

interface Options {
  page?: number,
  limit?: number,
  searchTerm?: string,
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient)

  getProducts(options: Options): Observable<PaginatedResponse<ProductWithStock>> {
    const { page = 1, limit = 12, searchTerm } = options;

    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit)

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm)
    }

    return this.http.get<PaginatedResponse<ProductWithStock>>(`${baseUrl}`, {
      params
    })
      .pipe(
        tap(res => console.log(res))
      )
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${baseUrl}/${id}`);
  }

  listProductOptions(): Observable<Product[]> {
    return this.http.get<Product[]>(`${baseUrl}/options`);
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${baseUrl}`, product);
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${baseUrl}/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${baseUrl}/${id}`);
  }

  getByName(searchTerm: string): Observable<Product[]> {
    if (!searchTerm) return of();

    return this.http.get<Product[]>(`${baseUrl}/search/by-name`, {
      params: {
        searchTerm
      }
    })
    .pipe(
      tap(res => console.log(res))
    )
  }
}
