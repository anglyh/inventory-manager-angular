import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthResponse } from '../interfaces/auth-response.interface';
import { User } from '../interfaces/user.interface';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { environment } from '@environments/environment';

const baseUrl = environment.apiUrl + '/auth';
type AuthStatus = 'authenticated' | 'not-authenticated' | 'checking';

@Injectable({providedIn: 'root'})
export class AuthService {
  private _authStatus = signal<AuthStatus>('checking');
  private _user = signal<User | null>(null);
  private _token = signal<string | null>(localStorage.getItem('token'))

  private http = inject(HttpClient);

  checkStatusResource = rxResource({
    stream: () => this.checkAuthStatus()
  })

  authStatus = computed<AuthStatus>(() => {
    if (this._authStatus() === 'checking') return 'checking'
    if (this._user()) return 'authenticated'

    return 'not-authenticated'
  })

  user = computed<User | null>(() => this._user())
  token = computed<string | null>(() => this._token())

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<AuthResponse>(`${baseUrl}/login`, {
      email,
      password
    })
    .pipe(
      tap(res => console.log(res)),
      map(res => this.handleAuthSuccess(res)),
      catchError((error: any) => this.handleAuthError(error))
    )
  }

  register(name: string, email: string, password: string): Observable<boolean> {
    return this.http.post<AuthResponse>(`${baseUrl}/register`, {
      name,
      email,
      password
    })
    .pipe(
      map(res => this.handleAuthSuccess(res)),
      catchError((error: any) => this.handleAuthError(error))
    )
  }

  checkAuthStatus(): Observable<boolean> {
    const token = localStorage.getItem('token');
    if (!token) {
      this.logout();
      return of(false);
    }

    return this.http.get<AuthResponse>(`${baseUrl}/check-status`)
    .pipe(
      map(res => this.handleAuthSuccess(res)),
      catchError((error: any) => this.handleAuthError(error))
    )
  }

  logout() {
    this._user.set(null)
    this._authStatus.set('not-authenticated')
    this._token.set(null)
    localStorage.removeItem('token')
  }

  private handleAuthSuccess({ token, user }: AuthResponse) {
    console.log({token, user})
    this._user.set(user);
    this._authStatus.set('authenticated')
    this._token.set(token)
    localStorage.setItem('token', token)
    return true
  }

  private handleAuthError(error: any) {
    this.logout();
    return of(false)
  }
}