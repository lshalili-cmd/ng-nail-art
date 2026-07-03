import { Injectable, computed, inject, signal } from '@angular/core';
import { PlanService } from './plan.service';

/** Plan başına aylık görsel üretim hakkı (financial-config.json ile uyumlu). */
const PLAN_MONTHLY: Record<string, number> = {
  free: 1,
  monthly: 30,
  yearly: 30,
  pro: 100,
  pro_yearly: 100,
};

interface QuotaState {
  /** Dönem anahtarı: plan + bitiş tarihi. Değişince kullanım sıfırlanır. */
  key: string;
  /** Bu dönemde kullanılan plan görseli. */
  used: number;
  /** Ek paketlerden gelen, dönemden bağımsız görsel bakiyesi. */
  extra: number;
}

/**
 * Kullanıcının görsel üretim hakkını tutar:
 *  - Plan aylık hakkı (dönem başında yenilenir),
 *  - Ek paketlerden alınan görsel bakiyesi (birikir, dönemden bağımsız).
 * Üretimde önce plan hakkı, o bitince ek paket bakiyesi harcanır.
 */
@Injectable({ providedIn: 'root' })
export class ImageQuotaService {
  private readonly plan = inject(PlanService);
  private readonly KEY = 'ngnail-quota';
  private readonly state = signal<QuotaState>(this.load());

  /** Mevcut planın aylık görsel hakkı. */
  readonly planQuota = computed(() => PLAN_MONTHLY[this.plan.current()] ?? 0);

  /** Bu dönemin anahtarı (plan + bitiş tarihi). */
  private readonly periodKey = computed(() => `${this.plan.current()}|${this.plan.expiresAt() ?? 'free'}`);

  /** Dönem değiştiyse kullanım sıfırlanmış hâlde okur. */
  private readonly synced = computed<QuotaState>(() => {
    const s = this.state();
    return s.key === this.periodKey() ? s : { key: this.periodKey(), used: 0, extra: s.extra };
  });

  /** Plandan kalan görsel hakkı. */
  readonly planLeft = computed(() => Math.max(0, this.planQuota() - this.synced().used));
  /** Ek paket bakiyesi. */
  readonly extraLeft = computed(() => this.synced().extra);
  /** Toplam kullanılabilir görsel. */
  readonly remaining = computed(() => this.planLeft() + this.extraLeft());

  /** Bir görsel üretim hakkı harcar. Hak yoksa false döner (uyarı gösterilir). */
  consume(): boolean {
    const s = this.synced();
    if (this.planQuota() - s.used > 0) {
      this.save({ key: this.periodKey(), used: s.used + 1, extra: s.extra });
      return true;
    }
    if (s.extra > 0) {
      this.save({ key: this.periodKey(), used: s.used, extra: s.extra - 1 });
      return true;
    }
    return false;
  }

  /** Ek paket satın alındığında bakiyeye görsel ekler. */
  addPack(images: number): void {
    const s = this.synced();
    this.save({ ...s, key: this.periodKey(), extra: s.extra + images });
  }

  private save(s: QuotaState): void {
    this.state.set(s);
    try { localStorage.setItem(this.KEY, JSON.stringify(s)); } catch { /* yoksa geç */ }
  }

  private load(): QuotaState {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<QuotaState>;
        return {
          key: typeof p.key === 'string' ? p.key : '',
          used: typeof p.used === 'number' ? p.used : 0,
          extra: typeof p.extra === 'number' ? p.extra : 0,
        };
      }
    } catch { /* bozuksa varsayılan */ }
    return { key: '', used: 0, extra: 0 };
  }
}
