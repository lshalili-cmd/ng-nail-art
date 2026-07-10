import { Injectable, computed, inject, signal } from '@angular/core';
import { PlanService } from './plan.service';

/** Plan başına aylık görsel üretim hakkı (financial-config.json ile uyumlu). */
// BİRLEŞİK AI KULLANIM HAKKI (görsel üretimi = 1 hak). Tarama+AI önerisi 1 hak,
// AI Stüdyo prompt+tasarım 1 hak — hepsi bu havuzdan. Bitince tüm AI durur.
const PLAN_MONTHLY: Record<string, number> = {
  free: 3,     // TEST — "hak bitince dur" görülebilsin diye (prod'da 1)
  monthly: 30,
  yearly: 30,
  pro: 100,
  pro_yearly: 100,
};

/** Ek paketin geçerlilik süresi (gün) — bu süre içinde aynı paket tekrar alınamaz. */
const PACK_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

interface QuotaState {
  /** Dönem anahtarı: plan + bitiş tarihi. Değişince kullanım sıfırlanır. */
  key: string;
  /** Bu dönemde kullanılan plan görseli. */
  used: number;
  /** Ek paketlerden gelen, dönemden bağımsız görsel bakiyesi. */
  extra: number;
  /** Aktif ek paketin kimliği (yoksa null). */
  packId: string | null;
  /** Aktif ek paketin satın alma anı — ms. */
  packSince: number;
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
    return s.key === this.periodKey()
      ? s
      : { key: this.periodKey(), used: 0, extra: s.extra, packId: s.packId, packSince: s.packSince };
  });

  /** Aktif ek paketin bitiş anı (ms). Paket yoksa null. */
  readonly packExpiresAt = computed<number | null>(() => {
    const s = this.synced();
    return s.packId ? s.packSince + PACK_DAYS * DAY_MS : null;
  });

  /** Süresi geçmemiş aktif ek paketin kimliği (yoksa null). */
  readonly activePackId = computed<string | null>(() => {
    const exp = this.packExpiresAt();
    return exp !== null && Date.now() < exp ? this.synced().packId : null;
  });

  /** Aktif ek paket bitişine kalan gün. */
  readonly packDaysLeft = computed<number | null>(() => {
    const exp = this.packExpiresAt();
    if (exp === null || this.activePackId() === null) return null;
    return Math.max(0, Math.ceil((exp - Date.now()) / DAY_MS));
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
      this.save({ ...s, key: this.periodKey(), used: s.used + 1 });
      return true;
    }
    if (s.extra > 0) {
      this.save({ ...s, key: this.periodKey(), extra: s.extra - 1 });
      return true;
    }
    return false;
  }

  /** Ek paket satın alındığında bakiyeye görsel ekler ve aktif paketi günceller. */
  buyPack(id: string, images: number): void {
    const s = this.synced();
    this.save({ key: this.periodKey(), used: s.used, extra: s.extra + images, packId: id, packSince: Date.now() });
  }

  /** Anlık kota durumu (senkron için). */
  snapshot(): { used: number; extra: number; packId: string | null; packSince: number } {
    const s = this.synced();
    return { used: s.used, extra: s.extra, packId: s.packId, packSince: s.packSince };
  }

  /** Sunucudan gelen kota durumunu uygular (cihazlar arası senkron). */
  applyServer(v: { used: number; extra: number; packId: string | null; packSince: number }): void {
    this.save({ key: this.periodKey(), used: v.used || 0, extra: v.extra || 0, packId: v.packId ?? null, packSince: v.packSince || 0 });
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
          packId: typeof p.packId === 'string' ? p.packId : null,
          packSince: typeof p.packSince === 'number' ? p.packSince : 0,
        };
      }
    } catch { /* bozuksa varsayılan */ }
    return { key: '', used: 0, extra: 0, packId: null, packSince: 0 };
  }
}
