import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthResponse } from '../interfaces/auth-response.interface';
import { User } from '../interfaces/user.interface';
import { catchError, finalize, map, Observable, of, shareReplay, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { environment } from '@environments/environment';

const baseUrl = environment.apiUrl + '/auth';
type AuthStatus = 'authenticated' | 'not-authenticated' | 'checking';

// Lets the browser store and send the HttpOnly refresh token cookie (also when the API is on another port in dev).
const withCookies = { withCredentials: true };

@Injectable({providedIn: 'root'})
export class AuthService {
  private _authStatus = signal<AuthStatus>('checking');
  private _user = signal<User | null>(null);
  // Memory only, never localStorage: after a reload the refresh token cookie restores it.
  private _accessToken = signal<string | null>(null);
  // Shared by every caller while a refresh runs, so the cookie is rotated once
  // instead of several times in parallel.
  private refreshInFlight: Observable<boolean> | null = null;

  private http = inject(HttpClient);

  constructor() {
    // Before the cookie sessions the JWT (valid for 7 days) lived here; drop any copy left behind.
    localStorage.removeItem('token');
  }

  checkStatusResource = rxResource({
    stream: () => this.checkAuthStatus()
  })

  authStatus = computed<AuthStatus>(() => {
    if (this.checkStatusResource.isLoading()) return 'checking';

    return this._user() ? 'authenticated' : 'not-authenticated'
  })

  user = computed<User | null>(() => this._user())
  accessToken = computed<string | null>(() => this._accessToken())
  /** Para la UI (menú, botones, guards). La autorización real la decide el backend. */
  isAdmin = computed(() => this._user()?.role === 'ADMIN')

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<AuthResponse>(`${baseUrl}/login`, {
      email,
      password
    }, withCookies)
    .pipe(
      map(res => this.handleAuthSuccess(res)),
      // The page shows the reason: wrong password, deactivated user or too many attempts.
      catchError((error: unknown) => {
        this.clearSession();
        return throwError(() => error);
      })
    )
  }

  register(name: string, email: string, password: string): Observable<boolean> {
    return this.http.post<AuthResponse>(`${baseUrl}/register`, {
      name,
      email,
      password
    }, withCookies)
      .pipe(
        map(res => this.handleAuthSuccess(res)),
        // sin catchError → el error llega al componente
      );
  }

  /** Guards and app start: an existing session in memory, or one restored from the cookie. */
  checkAuthStatus(): Observable<boolean> {
    if (this._user() && this._accessToken()) return of(true);
    return this.refreshSession();
  }

  /** Trades the refresh token cookie for a new access token. Emits false when there is no valid session. */
  refreshSession(): Observable<boolean> {
    this.refreshInFlight ??= this.http.post<AuthResponse>(`${baseUrl}/refresh`, {}, withCookies)
      .pipe(
        map(res => this.handleAuthSuccess(res)),
        catchError(() => this.handleAuthError()),
        finalize(() => this.refreshInFlight = null),
        shareReplay(1)
      )

    return this.refreshInFlight;
  }

  /**
   * Forgets the session here and asks the backend to revoke it and drop the cookie.
   * Navigate only after it completes: until then the cookie could restore the session.
   */
  logout(): Observable<void> {
    this.clearSession();

    return this.http.post<void>(`${baseUrl}/logout`, {}, withCookies)
      .pipe(
        // Even if the request fails the local session is already gone.
        catchError(() => of(undefined))
      )
  }

  /** Local cleanup only, e.g. after the backend answered 401 and already dropped the cookie. */
  clearSession() {
    this._user.set(null)
    this._authStatus.set('not-authenticated')
    this._accessToken.set(null)
  }

  private handleAuthSuccess({ accessToken, user }: AuthResponse) {
    this._user.set(user);
    this._authStatus.set('authenticated')
    this._accessToken.set(accessToken)
    return true
  }

  private handleAuthError() {
    this.clearSession()
    return of(false)
  }
}
