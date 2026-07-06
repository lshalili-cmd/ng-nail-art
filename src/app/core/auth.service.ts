import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';

export interface AuthUser {
  id: number; email: string; plan: string; planSince: number;
  imagesUsed: number; imagesExtra: number; packId: string | null; packSince: number;
}
export interface AuthResult { ok: boolean; error?: string; }

/** JWT token'ını tüm /api isteklerine ekler (giriş yapılmışsa). */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  if (token && req.url.startsWith('/api')) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};

/**
 * Kullanıcı kimliği (JWT). Giriş yapılmazsa uygulama "guest" olarak çalışmaya devam eder.
 * Giriş yapılınca token saklanır; plan/kota/favoriler cihazlar arası senkronlanır (SyncService).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly KEY = 'ngnail-token';
  readonly token = signal<string | null>(this.loadToken());
  readonly user = signal<AuthUser | null>(null);
  readonly loggedIn = computed(() => !!this.user());

  register(email: string, password: string): Promise<AuthResult> { return this.auth('/api/auth/register', email, password); }
  login(email: string, password: string): Promise<AuthResult> { return this.auth('/api/auth/login', email, password); }

  private async auth(url: string, email: string, password: string): Promise<AuthResult> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; token: string; user: AuthUser }>(url, { email, password }).pipe(timeout(9000)),
      );
      if (res?.success) { this.setToken(res.token); this.user.set(res.user); return { ok: true }; }
      return { ok: false, error: 'Bilinmeyen hata' };
    } catch (e: unknown) {
      const err = e as { error?: { error?: string } };
      return { ok: false, error: err?.error?.error || 'Sunucuya ulaşılamadı (backend kapalı olabilir)' };
    }
  }

  /** Uygulama açılışında: token varsa kullanıcıyı yükle. */
  async loadMe(): Promise<void> {
    if (!this.token()) return;
    try {
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; user: AuthUser }>('/api/auth/me').pipe(timeout(5000)),
      );
      if (res?.success) this.user.set(res.user);
    } catch { /* çevrimdışı: token korunur */ }
  }

  logout(): void { this.setToken(null); this.user.set(null); }

  /** Plan/kota durumunu kullanıcıya kaydeder (cihazlar arası). */
  async saveState(s: Partial<AuthUser>): Promise<void> {
    if (!this.token()) return;
    try { await firstValueFrom(this.http.put('/api/auth/state', s).pipe(timeout(6000))); } catch { /* sessiz */ }
  }

  private setToken(t: string | null): void {
    this.token.set(t);
    try { if (t) localStorage.setItem(this.KEY, t); else localStorage.removeItem(this.KEY); } catch { /* geç */ }
  }
  private loadToken(): string | null {
    try { return localStorage.getItem(this.KEY); } catch { return null; }
  }
}
