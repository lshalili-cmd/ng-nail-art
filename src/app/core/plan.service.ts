import { Injectable, computed, signal } from '@angular/core';

/** Plan başına abonelik süresi (gün). Ücretsiz/paketsiz için süre yok. */
const PERIOD_DAYS: Record<string, number> = {
  monthly: 30,
  yearly: 365,
  pro: 30,
  pro_yearly: 365,
};
const DAY_MS = 24 * 60 * 60 * 1000;

interface PlanState {
  id: string;
  /** Planın seçildiği (satın alındığı) an — ms. */
  since: number;
}

/**
 * Kullanıcının seçili üyelik planını ve satın alma tarihini kalıcı tutar (localStorage).
 * Bitiş tarihi geçtiğinde plan "aktif değil" sayılır; o zaman her plan yeniden seçilebilir
 * (düşürme dahil). Aktifken yalnızca yükseltme yapılabilir — çakallığı engellemek için.
 */
@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly KEY = 'ngnail-plan';
  private readonly state = signal<PlanState>(this.load());

  /** Seçili plan id'si. */
  readonly current = computed(() => this.state().id);

  /** Planın bitiş anı (ms). Süresiz plan (free) için null. */
  readonly expiresAt = computed<number | null>(() => {
    const s = this.state();
    const days = PERIOD_DAYS[s.id];
    return days ? s.since + days * DAY_MS : null;
  });

  /** Plan hâlâ aktif mi? (Ücretli plan ve bitiş tarihi geçmemiş.) */
  readonly active = computed<boolean>(() => {
    const exp = this.expiresAt();
    return exp !== null && this.now() < exp;
  });

  select(id: string): void {
    const next: PlanState = { id, since: this.now() };
    this.state.set(next);
    try { localStorage.setItem(this.KEY, JSON.stringify(next)); } catch { /* yoksa geç */ }
  }

  /** Anlık durum (senkron için). */
  snapshot(): PlanState { return this.state(); }

  /** Sunucudan gelen planı uygular (cihazlar arası senkron). */
  applyServer(id: string, since: number): void {
    const next: PlanState = { id: id || 'free', since: since || this.now() };
    this.state.set(next);
    try { localStorage.setItem(this.KEY, JSON.stringify(next)); } catch { /* geç */ }
  }

  private now(): number {
    return Date.now();
  }

  private load(): PlanState {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<PlanState>;
        if (p && typeof p.id === 'string') {
          return { id: p.id, since: typeof p.since === 'number' ? p.since : this.now() };
        }
      }
    } catch { /* bozuksa varsayılan */ }
    return { id: 'free', since: this.now() };
  }
}
