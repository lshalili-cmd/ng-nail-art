import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';

export interface ProviderInfo { id: string; ready: boolean; }
export interface PayStatus { providers: ProviderInfo[]; anyReady: boolean; mode: 'live' | 'demo'; }
export interface CheckoutInput {
  kind: 'plan' | 'pack'; itemId: string; itemName: string;
  amount: number; currency?: string; provider?: string;
}
export interface CheckoutResult { mode: 'live' | 'demo'; provider: string; url?: string; ref: string; }

/**
 * Çok sağlayıcılı ödeme istemcisi (iyzico / Stripe / PayTR).
 * Backend hazırsa gerçek/oturum akışını kullanır; kapalıysa yerel DEMO'ya düşer
 * (gerçek para hareketi yok) — böylece satın alma akışı her koşulda tamamlanır.
 */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  readonly status = signal<PayStatus>({
    providers: [
      { id: 'iyzico', ready: false }, { id: 'stripe', ready: false }, { id: 'paytr', ready: false },
    ],
    anyReady: false, mode: 'demo',
  });

  /** Sağlayıcı durumunu backend'den yükler (sessiz-başarısız → demo kalır). */
  async loadStatus(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; data: PayStatus }>('/api/payments/status').pipe(timeout(3000)),
      );
      if (res?.success && res.data) this.status.set(res.data);
    } catch { /* demo kalır */ }
  }

  /** Ödeme oturumu başlatır. Backend yoksa yerel demo sonucu döner. */
  async checkout(input: CheckoutInput): Promise<CheckoutResult> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; data: CheckoutResult }>('/api/payments/checkout', input).pipe(timeout(9000)),
      );
      if (res?.success && res.data) return res.data;
    } catch { /* yerel demo'ya düş */ }
    return { mode: 'demo', provider: input.provider || 'demo', ref: 'local_' + Date.now() };
  }

  /** Başarı onayı (demo). Gerçek sağlayıcıda webhook/callback yapar. */
  async confirm(ref: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post('/api/payments/confirm', { ref }).pipe(timeout(5000)),
      );
    } catch { /* sessiz geç */ }
  }
}
