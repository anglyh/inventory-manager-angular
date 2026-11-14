import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

const user = { id: '11111111-1111-4111-8111-111111111111', name: 'Rosa', email: 'rosa@hostal.pe', role: 'ADMIN' as const };
const unauthorized = { success: false, error: { code: 'UNAUTHORIZED', message: 'Token inválido o expirado' } };

describe('auth interceptor + AuthService (refresh cookie)', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;

  /** Logs in so the service holds an access token, answering the startup refresh first. */
  const loginAs = async (accessToken: string) => {
    const login = firstValueFrom(auth.login('rosa@hostal.pe', 'Secret1234567'));
    const req = backend.expectOne(r => r.url.endsWith('/auth/login'));
    expect(req.request.withCredentials).toBe(true);
    req.flush({ accessToken, user });
    await login;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => backend.verify());

  it('keeps the access token in memory only, never in localStorage', async () => {
    await loginAs('access-1');

    expect(auth.accessToken()).toBe('access-1');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('sends the access token as a Bearer header', async () => {
    await loginAs('access-1');

    const done = firstValueFrom(http.get('/api/room'));
    const req = backend.expectOne('/api/room');
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-1');
    req.flush([]);
    await done;
  });

  it('on 401 refreshes once with the cookie and retries with the new token', async () => {
    await loginAs('expired');

    const result = firstValueFrom(http.get<string[]>('/api/room'));
    backend.expectOne('/api/room').flush(unauthorized, { status: 401, statusText: 'Unauthorized' });

    const refresh = backend.expectOne(r => r.url.endsWith('/auth/refresh'));
    expect(refresh.request.method).toBe('POST');
    expect(refresh.request.withCredentials).toBe(true);
    refresh.flush({ accessToken: 'fresh', user });

    const retry = backend.expectOne('/api/room');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer fresh');
    retry.flush(['101']);

    expect(await result).toEqual(['101']);
    expect(auth.accessToken()).toBe('fresh');
  });

  it('parallel 401s share a single refresh (the cookie is rotated once)', async () => {
    await loginAs('expired');

    const a = firstValueFrom(http.get('/api/room'));
    const b = firstValueFrom(http.get('/api/guest'));
    backend.expectOne('/api/room').flush(unauthorized, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/guest').flush(unauthorized, { status: 401, statusText: 'Unauthorized' });

    backend.expectOne(r => r.url.endsWith('/auth/refresh')).flush({ accessToken: 'fresh', user });
    backend.expectOne('/api/room').flush([]);
    backend.expectOne('/api/guest').flush([]);
    await Promise.all([a, b]);
  });

  it('when the refresh fails it clears the session and passes the 401 on (no loop)', async () => {
    await loginAs('expired');

    const result = firstValueFrom(http.get('/api/room'));
    backend.expectOne('/api/room').flush(unauthorized, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne(r => r.url.endsWith('/auth/refresh')).flush(unauthorized, { status: 401, statusText: 'Unauthorized' });

    const error = await result.catch(e => e);
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect(error.status).toBe(401);
    expect(auth.user()).toBeNull();
    expect(auth.accessToken()).toBeNull();
    backend.expectNone('/api/room');
  });

  it('a 401 from login is the login answer: no refresh attempt', async () => {
    const result = firstValueFrom(auth.login('rosa@hostal.pe', 'wrong'));
    backend.expectOne(r => r.url.endsWith('/auth/login'))
      .flush({ success: false, error: { code: 'UNAUTHORIZED', message: 'Correo electrónico o contraseña incorrectos' } },
        { status: 401, statusText: 'Unauthorized' });

    // The page still receives the error to show the backend's reason.
    expect((await result.catch(e => e)).status).toBe(401);
    backend.expectNone(r => r.url.endsWith('/auth/refresh'));
  });

  it('checkAuthStatus restores the session from the cookie after a reload', async () => {
    const status = firstValueFrom(auth.checkAuthStatus());
    backend.expectOne(r => r.url.endsWith('/auth/refresh')).flush({ accessToken: 'restored', user });

    expect(await status).toBe(true);
    expect(auth.user()).toEqual(user);
    expect(auth.accessToken()).toBe('restored');
  });

  it('checkAuthStatus without a valid cookie is simply not authenticated', async () => {
    const status = firstValueFrom(auth.checkAuthStatus());
    backend.expectOne(r => r.url.endsWith('/auth/refresh')).flush(unauthorized, { status: 401, statusText: 'Unauthorized' });

    expect(await status).toBe(false);
    expect(auth.user()).toBeNull();
  });

  it('logout clears the local session and asks the backend to revoke the cookie', async () => {
    await loginAs('access-1');

    const done = firstValueFrom(auth.logout());
    expect(auth.user()).toBeNull();
    expect(auth.accessToken()).toBeNull();
    const req = backend.expectOne(r => r.url.endsWith('/auth/logout'));
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(null, { status: 204, statusText: 'No Content' });
    await done;
  });

  it('logout still completes if the backend is unreachable', async () => {
    await loginAs('access-1');

    const done = firstValueFrom(auth.logout(), { defaultValue: undefined });
    backend.expectOne(r => r.url.endsWith('/auth/logout')).error(new ProgressEvent('error'));
    await expect(done).resolves.toBeUndefined();
  });
});
