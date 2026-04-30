import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Category, CategoryUpsertBody } from '../interfaces/category.interface';

const baseUrl = environment.apiUrl + '/category';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);

  list(): Observable<Category[]> {
    return this.http.get<Category[]>(baseUrl);
  }

  create(payload: CategoryUpsertBody): Observable<Category> {
    return this.http.post<Category>(baseUrl, payload);
  }

  update(id: string, payload: CategoryUpsertBody): Observable<Category> {
    return this.http.put<Category>(`${baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${baseUrl}/${id}`);
  }
}

