import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { BarcodeLookup, Product, ProductOption, ProductUpsertBody, ProductWithStock } from '../interfaces/product.interface';
import { environment } from '@environments/environment';
import { Options, PaginatedResponse } from '@/shared/interfaces/pagination.interface';

const baseUrl = environment.apiUrl + '/product'

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient)

  /**
   * `categoryId`: ids separados por coma; "none" pide los productos sin categoría.
   * `stock: 'low'`: solo los que están en o bajo el mínimo (por reponer).
   */
  getProducts(options: Options & { categoryId?: string; stock?: 'low' }): Observable<PaginatedResponse<ProductWithStock>> {
    const { page = 1, limit = 12, searchTerm, categoryId, stock } = options;

    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit)

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm)
    }

    if (categoryId) {
      params = params.set('categoryId', categoryId)
    }

    if (stock) {
      params = params.set('stock', stock)
    }

    return this.http.get<PaginatedResponse<ProductWithStock>>(`${baseUrl}`, {
      params
    })
  }

  /** Producto de la tienda con ese código o datos sugeridos de una base abierta. */
  lookupBarcode(code: string): Observable<BarcodeLookup> {
    return this.http.get<BarcodeLookup>(`${baseUrl}/barcode-lookup/${encodeURIComponent(code)}`);
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${baseUrl}/${id}`);
  }

  listProductOptions(): Observable<ProductOption[]> {
    return this.http.get<ProductOption[]>(`${baseUrl}/options`);
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
