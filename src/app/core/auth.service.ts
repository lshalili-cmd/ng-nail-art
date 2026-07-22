import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';

export interface AuthUser {
  id: number; email: string; phone: string; firstName: string; lastName: string; verified: boolean;
  plan: string; planSince: number; imagesUsed: number; imagesExtra: number; packId: string | null; packSince: number;
  role?: string;
}
export interface RegisterData { firstName: string; lastName: string; email: string; phone: string; password: string; }
export interface AuthResult {
  ok: boolean; error?: string; needOtp?: boolean; email?: string; demoOtp?: string; demoLink?: string;
  needEmail?: boolean; channel?: string;
}

interface AuthResp {
  success: boolean; token?: string; user?: AuthUser; needOtp?: boolean; email?: string;
  demoOtp?: string; demoLink?: string; error?: string; code?: string;
  needEmail?: boolean; otpChannel?: string;
}

/**
 * Şifre kuralı — İKİSİNDEN BİRİ geçerli (backend ile birebir aynı):
 *  (a) ESKİ kural: TAM 1 harf + geri kalanı rakam, en az 6 karakter ("a12345").
 *  (b) GÜÇLÜ şifre: en az 8 karakter, en az 1 harf ve 1 rakam ("Gul2026sifre").
 */
export function validPassword(pw: string): boolean {
  if (typeof pw !== 'string') return false;
  const letters = (pw.match(/[A-Za-z]/g) || []).length;
  const digits = (pw.match(/[0-9]/g) || []).length;
  if (pw.length >= 6 && letters === 1 && digits === pw.length - 1) return true;   // (a)
  if (pw.length >= 8 && letters >= 1 && digits >= 1) return true;                 // (b)
  return false;
}

/** JWT token'ını tüm /api isteklerine ekler (giriş yapılmışsa). Göreli '/api' veya
 *  native'de mutlaklaşmış '.../api' isteklerini kapsar (sıradan bağımsız güvenli). */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  if (token && (req.url.startsWith('/api') || req.url.includes('/api/'))) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly KEY = 'ngnail-token';
  readonly token = signal<string | null>(this.loadToken());
  readonly user = signal<AuthUser | null>(null);
  readonly loggedIn = computed(() => !!this.user());

  /** Kayıt → telefona OTP gönderilir (demo modda kod yanıtta döner). */
  async register(d: RegisterData): Promise<AuthResult> {
    try {
      const res = await firstValueFrom(this.http.post<AuthResp>('/api/auth/register', d).pipe(timeout(9000)));
      if (res?.success) return { ok: true, needOtp: !!res.needOtp, email: res.email, demoOtp: res.demoOtp };
      return { ok: false, error: 'Bilinmeyen hata' };
    } catch (e) { return { ok: false, error: this.errMsg(e) }; }
  }

  /** OTP doğrula → başarılıysa giriş yapılır. */
  async verifyOtp(email: string, code: string, remember = true): Promise<AuthResult> {
    try {
      const res = await firstValueFrom(this.http.post<AuthResp>('/api/auth/verify-otp', { email, code }).pipe(timeout(9000)));
      if (res?.success && res.token && res.user) { this.setToken(res.token, remember); this.user.set(res.user); return { ok: true }; }
      return { ok: false, error: 'Hata' };
    } catch (e) { return { ok: false, error: this.errMsg(e) }; }
  }

  /** Kodu YENİDEN gönder → e-posta ile (ilk kod SMS ile 1 kez gitti). */
  async resendOtp(email: string): Promise<AuthResult> {
    try {
      const res = await firstValueFrom(this.http.post<AuthResp>('/api/auth/resend-otp', { email }).pipe(timeout(9000)));
      return { ok: !!res?.success, demoOtp: res?.demoOtp, channel: res?.otpChannel || 'email' };
    } catch (e) { return { ok: false, error: this.errMsg(e) }; }
  }

  async login(email: string, password: string, remember = true): Promise<AuthResult> {
    try {
      const res = await firstValueFrom(this.http.post<AuthResp>('/api/auth/login', { email, password }).pipe(timeout(9000)));
      if (res?.success && res.token && res.user) { this.setToken(res.token, remember); this.user.set(res.user); return { ok: true }; }
      return { ok: false, error: 'Hata' };
    } catch (e) {
      const err = e as { error?: AuthResp };
      if (err?.error?.code === 'NOT_VERIFIED') return { ok: false, needOtp: true, email: err.error.email, error: err.error.error };
      return { ok: false, error: this.errMsg(e) };
    }
  }

  /** Şifremi unuttum → e-postaya 6 haneli KOD gönderilir (demo modda yanıtta döner). */
  async forgot(email: string): Promise<AuthResult> {
    try {
      const res = await firstValueFrom(this.http.post<AuthResp>('/api/auth/forgot', { email }).pipe(timeout(9000)));
      return { ok: !!res?.success, demoOtp: res?.demoOtp };
    } catch (e) { return { ok: false, error: this.errMsg(e) }; }
  }

  /** E-postaya gelen KOD + yeni şifre ile sıfırla. */
  async reset(email: string, code: string, password: string): Promise<AuthResult> {
    try {
      const res = await firstValueFrom(this.http.post<AuthResp>('/api/auth/reset', { email, code, password }).pipe(timeout(9000)));
      return res?.success ? { ok: true } : { ok: false, error: res?.error || 'Hata' };
    } catch (e) { return { ok: false, error: this.errMsg(e) }; }
  }

  /** Giriş yapmış kullanıcının şifresini değiştirir. */
  async changePassword(password: string): Promise<AuthResult> {
    try {
      const res = await firstValueFrom(this.http.post<AuthResp>('/api/auth/change-password', { password }).pipe(timeout(9000)));
      return res?.success ? { ok: true } : { ok: false, error: 'Hata' };
    } catch (e) { return { ok: false, error: this.errMsg(e) }; }
  }

  /** Hesap silme ADIM 1: kimlik doğrula → e-posta ile onay linki gönderilir (hemen silinmez). */
  async deleteAccount(email: string, phone: string, password: string): Promise<AuthResult> {
    try {
      const res = await firstValueFrom(this.http.post<AuthResp>('/api/auth/delete-account', { email, phone, password }).pipe(timeout(9000)));
      if (res?.success) return { ok: true, needEmail: !!res.needEmail, demoLink: res.demoLink };
      return { ok: false, error: 'Hata' };
    } catch (e) { return { ok: false, error: this.errMsg(e) }; }
  }

  /** Hesap silme ADIM 2: e-postadaki linkin jetonuyla kalıcı sil. */
  async confirmDelete(token: string): Promise<AuthResult> {
    try {
      const res = await firstValueFrom(this.http.post<AuthResp>('/api/auth/confirm-delete', { token }).pipe(timeout(9000)));
      if (res?.success) { this.logout(); return { ok: true }; }
      return { ok: false, error: 'Hata' };
    } catch (e) { return { ok: false, error: this.errMsg(e) }; }
  }

  async loadMe(): Promise<void> {
    if (!this.token()) return;
    try {
      const res = await firstValueFrom(this.http.get<AuthResp>('/api/auth/me').pipe(timeout(5000)));
      if (res?.success && res.user) this.user.set(res.user);
    } catch { /* çevrimdışı: token korunur */ }
  }

  logout(): void { this.setToken(null); this.user.set(null); }

  async saveState(s: Partial<AuthUser>): Promise<void> {
    if (!this.token()) return;
    try { await firstValueFrom(this.http.put('/api/auth/state', s).pipe(timeout(6000))); } catch { /* sessiz */ }
  }

  private errMsg(e: unknown): string {
    const err = e as { error?: { error?: string } };
    return err?.error?.error || 'Sunucuya ulaşılamadı (backend kapalı olabilir)';
  }
  private setToken(t: string | null, remember = true): void {
    this.token.set(t);
    try {
      if (t) {
        // "Beni hatırla" işaretliyse kalıcı (localStorage), değilse tarayıcı kapanınca silinir (sessionStorage)
        (remember ? localStorage : sessionStorage).setItem(this.KEY, t);
        (remember ? sessionStorage : localStorage).removeItem(this.KEY);
      } else {
        localStorage.removeItem(this.KEY); sessionStorage.removeItem(this.KEY);
      }
    } catch { /* geç */ }
  }
  private loadToken(): string | null {
    try { return localStorage.getItem(this.KEY) || sessionStorage.getItem(this.KEY); } catch { return null; }
  }
}
