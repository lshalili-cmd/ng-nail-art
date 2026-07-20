import { Injectable, effect, inject, untracked } from '@angular/core';
import { AuthService, AuthUser } from './auth.service';
import { PlanService } from './plan.service';
import { ImageQuotaService } from './image-quota.service';

/**
 * Cihazlar arası senkron: giriş yapılınca kullanıcının plan/kota durumu DB'den çekilip uygulanır;
 * plan/kota değişince DB'ye geri yazılır. Giriş yoksa hiçbir şey yapmaz (guest = yerel).
 */
@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly auth = inject(AuthService);
  private readonly plan = inject(PlanService);
  private readonly quota = inject(ImageQuotaService);
  private applying = false;
  private started = false;

  /** AppComponent'ten bir kez çağrılır. */
  start(): void {
    if (this.started) return;
    this.started = true;

    // Giriş yapılınca (user set olunca) sunucudaki durumu uygula.
    // KRİTİK: pull() untracked içinde çalışır. Aksi halde pull'un içindeki
    // applyServer çağrıları hem plan/kota sinyallerini OKUR (periodKey, synced)
    // hem de YAZAR → effect kendi bağımlılığını değiştirir → SONSUZ DÖNGÜ
    // (girişte sayfanın "Yanıt Vermiyor" ile donmasının kök nedeni buydu).
    effect(() => {
      const u = this.auth.user();
      if (u) untracked(() => this.pull(u));
    }, { allowSignalWrites: true });

    // Plan/kota değişince ve giriş yapılmışsa sunucuya kaydet.
    // (loggedIn ve applying kontrolü sinyal takibine girmesin diye sadece
    // p/q okumaları takipte kalır; saveState sinyal yazmaz, güvenli.)
    effect(() => {
      const p = this.plan.snapshot();
      const q = this.quota.snapshot();
      if (untracked(() => this.auth.loggedIn()) && !this.applying) {
        void this.auth.saveState({
          plan: p.id, planSince: p.since,
          imagesUsed: q.used, imagesExtra: q.extra, packId: q.packId, packSince: q.packSince,
        });
      }
    });
  }

  private pull(u: AuthUser): void {
    this.applying = true;
    this.plan.applyServer(u.plan, u.planSince);
    this.quota.applyServer({ used: u.imagesUsed, extra: u.imagesExtra, packId: u.packId, packSince: u.packSince });
    // applying bir sonraki mikro-görevde kalksın ki pull sırasında push tetiklenmesin
    queueMicrotask(() => { this.applying = false; });
  }
}
