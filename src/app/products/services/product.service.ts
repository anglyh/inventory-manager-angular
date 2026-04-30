import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { Product, ProductUpsertBody, ProductWithStock } from '../interfaces/product.interface';
import { environment } from '@environments/environment';
import { Options, PaginatedResponse } from '@/shared/interfaces/pagination.interface';

const baseUrl = environment.apiUrl + '/product'

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient)

  getProducts(options: Options): Observable<PaginatedResponse<ProductWithStock>> {
    const { page = 1, limit = 12, searchTerm, category } = options;

    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit)

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm)
    }

    if (category) {
      params = params.set('category', category)
    }

    return this.http.get<PaginatedResponse<ProductWithStock>>(`${baseUrl}`, {
      params
    })
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${baseUrl}/${id}`);
  }

  listProductOptions(): Observable<Product[]> {
    return this.http.get<Product[]>(`${baseUrl}/options`);
  }

  createProduct(product: ProductUpsertBody): Observable<Product> {
    return this.http.post<Product>(`${baseUrl}`, product);
  }

  updateProduct(id: string, product: Partial<ProductUpsertBody>): Observable<Product> {
    return this.http.put<Product>(`${baseUrl}/${id}`, product);
  }

  deleteProduct(id: string): Observable<void> {
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
