import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../../shared/header.component';
import { I18nService } from '../../core/i18n.service';
import { PlanService } from '../../core/plan.service';
import { ImageQuotaService } from '../../core/image-quota.service';
import { PaymentService } from '../../core/payment.service';
import { CurrencyService, CURRENCIES } from '../../core/pricing';

interface Plan {
  id: string; nameKey: string; periodKey?: string;
  highlight?: boolean; badgeKey?: string; featureKeys: string[];
}
interface Pack { id: string; nameKey: string; credits: number; }
interface CartItem { kind: 'plan' | 'pack'; id: string; name: string; amount: number; priceLabel: string; credits?: number; }
const PROV_LABEL: Record<string, string> = { iyzico: 'iyzico', stripe: 'Stripe', paytr: 'PayTR' };

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [HeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header />
    <div class="page">
      <div class="section-head">
        <h2 class="section-title">💎 {{ i18n.t('membership') }}</h2>
        <select class="cur-sel" [value]="cur.currency()" (change)="cur.set($any($event.target).value)" [attr.aria-label]="i18n.t('currency')">
          @for (c of currencies; track c) { <option [value]="c">{{ c }}</option> }
        </select>
      </div>
      <p class="intro">{{ i18n.t('membership_sub') }}</p>

      <div class="plans">
        @for (p of plans; track p.id) {
          <div class="plan card" [class.hl]="p.highlight" [class.on]="plan.current() === p.id">
            @if (p.badgeKey) { <span class="tag">{{ i18n.t(p.badgeKey) }}</span> }
            <h3 class="pname">{{ i18n.t(p.nameKey) }}</h3>
            <p class="price">{{ cur.label(p.id) }}<span class="per">{{ p.periodKey ? i18n.t(p.periodKey) : '' }}</span></p>
            <ul class="feats">
              @for (f of p.featureKeys; track f) { <li>✓ {{ i18n.t(f) }}</li> }
            </ul>
            @if (plan.current() === p.id && (plan.active() || p.id === 'free')) {
              <button class="btn-ghost sel" disabled>✓ {{ i18n.t('current_plan') }}</button>
              @if (plan.active() && daysLeft() !== null) {
                <p class="left">⏳ {{ daysLeft() }} {{ i18n.t('days_left') }}</p>
              }
            } @else if (canSelect(p.id)) {
              <button class="btn-primary" (click)="choose(p.id)">
                {{ p.id === plan.current() ? i18n.t('renew') : (p.id === 'free' ? i18n.t('select') : i18n.t('upgrade')) }}
              </button>
            } @else {
              <button class="btn-ghost lock" disabled>🔒 {{ i18n.t('plan_locked') }}</button>
            }
          </div>
        }
      </div>

      <div class="section-head">
        <h2 class="section-title">🎟️ {{ i18n.t('credit_packs') }}</h2>
        <span class="bal">🖼️ {{ quota.remaining() }} {{ i18n.t('credits') }}</span>
      </div>
      <div class="packs">
        @for (k of packs; track k.id) {
          <div class="pack card" [class.on]="quota.activePackId() === k.id">
            <p class="kname">{{ i18n.t(k.nameKey) }}</p>
            <p class="credits">{{ k.credits }} {{ i18n.t('credits') }}</p>
            <p class="kprice">{{ cur.label(k.id) }}</p>
            @if (quota.activePackId() === k.id) {
              <button class="btn-ghost sel" disabled>✓ {{ quota.packDaysLeft() }} {{ i18n.t('days_left') }}</button>
            } @else if (canBuyPack(k)) {
              <button class="btn-ghost" (click)="buyPack(k)">{{ quota.activePackId() ? i18n.t('upgrade') : i18n.t('select') }}</button>
            } @else {
              <button class="btn-ghost lock" disabled>🔒</button>
            }
          </div>
        }
      </div>

      @if (added()) { <p class="added">✓ {{ added() }} {{ i18n.t('credits') }} {{ i18n.t('pack_added') }}</p> }

      <p class="note rules">📋 {{ i18n.t('upgrade_rules') }}</p>
    </div>

    <!-- Ödeme akışı (iyzico / Stripe / PayTR — anahtar yoksa demo) -->
    @if (cart(); as it) {
      <div class="co-back" (click)="closePay()"></div>
      <div class="co card">
        @if (payDone()) {
          <div class="co-done">
            <div class="co-ic">✓</div>
            <h3 class="co-t">{{ i18n.t('pay_success') }}</h3>
            <p class="co-item2">{{ it.name }}</p>
            <button class="btn-primary co-pay" (click)="closePay()">{{ i18n.t('pay_close') }}</button>
          </div>
        } @else {
          <h3 class="co-t">{{ i18n.t('pay_title') }}</h3>
          <div class="co-item"><span>{{ it.name }}</span><span class="co-amt">{{ it.priceLabel }}</span></div>
          <p class="co-lbl">{{ i18n.t('pay_provider') }}</p>
          <div class="co-provs">
            @for (pr of payment.status().providers; track pr.id) {
              <button class="co-prov" [class.on]="payProvider() === pr.id" (click)="payProvider.set(pr.id)">
                {{ provLabel(pr.id) }}@if (!pr.ready) { <span class="co-demo">demo</span> }
              </button>
            }
          </div>
          @if (payError()) { <p class="co-err">⚠️ {{ payError() }}</p> }
          <button class="btn-primary co-pay" (click)="confirmPay()" [disabled]="paying()">
            {{ paying() ? i18n.t('pay_processing') : (payMode() === 'live' ? i18n.t('pay_go') : i18n.t('pay_test')) }}
          </button>
          <button class="btn-ghost co-cancel" (click)="closePay()">{{ i18n.t('pay_cancel') }}</button>
          <p class="co-secure">🔒 {{ payMode() === 'live' ? i18n.t('pay_secure') : i18n.t('pay_demo_note') }}</p>
        }
      </div>
    }
  `,
  styles: [`
    .intro { margin: 0 0 8px; font-size: 13px; color: var(--muted); }
    .cur-sel { background: var(--surface-2); color: var(--ink); border: 1px solid var(--line);
      border-radius: 10px; padding: 6px 10px; font: inherit; font-size: 13px; font-weight: 700; outline: none; }
    .cur-sel:focus { border-color: rgba(212,175,55,0.5); }
    .plans { display: flex; flex-direction: column; gap: 12px; }
    .plan { position: relative; padding: 18px 16px; }
    .plan.hl { border-color: rgba(212,175,55,0.55);
      background: linear-gradient(180deg, rgba(212,175,55,0.1), var(--surface-2)); }
    .plan.on { outline: 2px solid var(--gold); }
    .tag { position: absolute; top: 14px; inset-inline-end: 14px; font-size: 11px; font-weight: 700;
      color: #1a1206; background: var(--gold-grad); padding: 3px 10px; border-radius: 999px; }
    .pname { font-size: 18px; margin: 0; }
    .price { font-size: 26px; font-weight: 700; color: var(--gold); font-family: var(--font-head); margin: 6px 0 12px; }
    .per { font-size: 13px; color: var(--muted-2); font-family: var(--font-body); font-weight: 400; }
    .feats { list-style: none; margin: 0 0 14px; padding: 0; }
    .feats li { font-size: 13px; color: #efe7d4; padding: 5px 0; }
    .sel { width: 100%; color: var(--gold-soft); }
    .lock { width: 100%; opacity: 0.55; cursor: not-allowed; }
    .left { margin: 8px 0 0; font-size: 11px; color: var(--muted-2); text-align: center; }
    .plan .btn-primary { width: 100%; }
    .packs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .pack { padding: 14px 8px; text-align: center; position: relative; }
    .pack.on { outline: 2px solid var(--gold); }
    .kname { margin: 0; font-size: 14px; font-weight: 700; }
    .credits { margin: 4px 0; font-size: 11px; color: var(--muted-2); }
    .kprice { margin: 4px 0 10px; font-size: 15px; font-weight: 700; color: var(--gold); }
    .pack .btn-ghost { width: 100%; padding: 8px; font-size: 12px; }
    .note { margin: 18px 0 0; font-size: 12px; color: var(--muted-2); text-align: center;
      background: var(--surface-2); border: 1px dashed var(--line); border-radius: 12px; padding: 12px; }
    .note.rules { text-align: start; line-height: 1.5; }
    .bal { font-size: 12px; font-weight: 700; color: var(--gold-soft);
      background: rgba(212,175,55,0.12); border: 1px solid rgba(212,175,55,0.4); padding: 3px 10px; border-radius: 999px; }
    .added { margin: 12px 0 0; font-size: 13px; text-align: center; color: var(--gold-soft);
      background: rgba(62,207,142,0.1); border: 1px solid rgba(62,207,142,0.35); border-radius: 12px; padding: 10px; }
    .co-back { position: fixed; inset: 0; z-index: 1100; background: rgba(0,0,0,0.6); backdrop-filter: blur(3px); }
    .co { position: fixed; z-index: 1101; inset-inline: 16px; bottom: 0; margin: 0 auto; max-width: 440px;
      border-radius: 22px 22px 0 0; padding: 22px 18px 26px; animation: coup .25s ease; }
    @keyframes coup { from { transform: translateY(30px); opacity: 0; } to { transform: none; opacity: 1; } }
    .co-t { margin: 0 0 14px; font-size: 19px; text-align: center; }
    .co-item { display: flex; justify-content: space-between; align-items: center; gap: 10px;
      background: var(--surface-2); border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; }
    .co-item2 { text-align: center; color: var(--muted); margin: 2px 0 16px; font-size: 13px; }
    .co-amt { font-weight: 700; color: var(--gold); font-family: var(--font-head); font-size: 17px; }
    .co-lbl { margin: 16px 0 8px; font-size: 12px; color: var(--muted-2); }
    .co-provs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    .co-prov { position: relative; padding: 12px 6px; border-radius: 12px; font-size: 13px; font-weight: 600;
      background: var(--surface-2); border: 1px solid var(--line); color: var(--ink); }
    .co-prov.on { background: rgba(212,175,55,0.16); border-color: rgba(212,175,55,0.5); color: var(--gold-soft); }
    .co-demo { display: block; font-size: 9px; font-weight: 700; color: var(--muted-2); margin-top: 2px; text-transform: uppercase; }
    .co-pay { width: 100%; margin-top: 18px; }
    .co-cancel { width: 100%; margin-top: 8px; }
    .co-err { margin: 12px 0 0; font-size: 12px; color: #f0b8b8; text-align: center; }
    .co-secure { margin: 12px 0 0; font-size: 11px; color: var(--muted-2); text-align: center; }
    .co-done { text-align: center; padding: 8px 0; }
    .co-ic { width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 14px; font-size: 32px; color: #1a1206;
      display: flex; align-items: center; justify-content: center; background: var(--gold-grad); }
  `],
})
export class ShopComponent implements OnInit {
  readonly i18n = inject(I18nService);
  readonly plan = inject(PlanService);
  readonly quota = inject(ImageQuotaService);
  readonly payment = inject(PaymentService);
  readonly cur = inject(CurrencyService);
  readonly currencies = CURRENCIES;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly added = signal<number | null>(null);

  // Ödeme akışı durumu
  private readonly PENDING = 'ngnail-pending-pay';
  readonly cart = signal<CartItem | null>(null);
  readonly payProvider = signal<string>('iyzico');
  readonly paying = signal<boolean>(false);
  readonly payDone = signal<boolean>(false);
  readonly payError = signal<string | null>(null);

  /** Seçili sağlayıcı hazırsa gerçek ödeme, değilse demo. */
  readonly payMode = computed<'live' | 'demo'>(() => {
    const pr = this.payment.status().providers.find((p) => p.id === this.payProvider());
    return pr?.ready ? 'live' : 'demo';
  });

  provLabel(id: string): string { return PROV_LABEL[id] ?? id; }

  ngOnInit(): void {
    void this.payment.loadStatus();
    // Gerçek sağlayıcıdan geri dönüş: ?paid=1&ref=... → bekleyen alımı uygula
    const q = this.route.snapshot.queryParamMap;
    if (q.get('paid') === '1') {
      const ref = q.get('ref') || '';
      const pend = this.loadPending();
      if (pend) { void this.payment.confirm(ref); this.applyPurchase(pend); this.added.set(pend.credits ?? null); }
      this.clearPending();
      void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }
  }

  // Fiyat ve limitler kaynağı: app/data/financial-config.json (v5.0, USD 4-katman funnel)
  // (kart metinleri: aylık üretim + yıllık toplam notları — 2026-07-03)
  // Fiyatlar artık para birimine göre pricing.ts'ten gelir (Model B — sabit kademeler).
  readonly plans: Plan[] = [
    { id: 'free', nameKey: 'pn_free',
      featureKeys: ['f_free_img', 'f_free_tools', 'f_gallery'] },
    { id: 'monthly', nameKey: 'pn_monthly', periodKey: 'per_mo',
      featureKeys: ['f_m30', 'f_tools_unlim', 'f_extra'] },
    { id: 'yearly', nameKey: 'pn_yearly', periodKey: 'per_yr', highlight: true, badgeKey: 'badge_25',
      featureKeys: ['f_m30', 'f_y360', 'f_all_unlim', 'f_589', 'f_extra'] },
    { id: 'pro', nameKey: 'pn_pro', periodKey: 'per_mo',
      featureKeys: ['f_p100', 'f_all_unlim', 'f_salon'] },
    { id: 'pro_yearly', nameKey: 'pn_pro_yearly', periodKey: 'per_yr', badgeKey: 'badge_25',
      featureKeys: ['f_p100', 'f_py1200', 'f_all_unlim', 'f_1875', 'f_bigsalon'] },
  ];

  readonly packs: Pack[] = [
    { id: 'pack_10', nameKey: 'pk_mini', credits: 10 },
    { id: 'pack_25', nameKey: 'pk_standart', credits: 25 },
    { id: 'pack_50', nameKey: 'pk_mega', credits: 50 },
  ];

  /**
   * Yükseltme kuralları: aktif paket süresi bitmeden aynısı tekrar alınamaz, yalnızca yükseltme yapılabilir.
   * free → hepsi · Aylık Premium → Yıllık Premium / Aylık Pro / Yıllık Pro
   * Yıllık Premium → Yıllık Pro · Aylık Pro → Yıllık Pro · Yıllık Pro → en üst (yükseltme yok)
   * Ek paketler bu kurala tabi değildir, her zaman alınabilir.
   */
  private readonly allowedUpgrades: Record<string, string[]> = {
    free: ['monthly', 'yearly', 'pro', 'pro_yearly'],
    monthly: ['yearly', 'pro', 'pro_yearly'],
    yearly: ['pro_yearly'],
    pro: ['pro_yearly'],
    pro_yearly: [],
  };

  /**
   * Hedef plan seçilebilir mi?
   * - Aktif abonelik yoksa (ücretsiz veya süresi dolmuş) → her plan açık (düşürme dahil).
   * - Aktif aboneyse → aynı planı tekrar alamaz, yalnızca izinli üst plana geçebilir.
   */
  canSelect(targetId: string): boolean {
    if (!this.plan.active()) return true;
    const cur = this.plan.current();
    if (targetId === cur) return false;
    return (this.allowedUpgrades[cur] ?? []).includes(targetId);
  }

  /** Aktif abonelikte bitişe kalan gün sayısı. */
  daysLeft = computed<number | null>(() => {
    const exp = this.plan.expiresAt();
    if (exp === null) return null;
    return Math.max(0, Math.ceil((exp - Date.now()) / (24 * 60 * 60 * 1000)));
  });

  choose(id: string): void {
    if (id === 'free') { this.plan.select('free'); return; } // ücretsiz → ödeme yok
    const p = this.plans.find((x) => x.id === id);
    if (!p) return;
    const period = p.periodKey ? this.i18n.t(p.periodKey) : '';
    this.startCheckout({ kind: 'plan', id, name: this.i18n.t(p.nameKey), amount: this.cur.amount(id), priceLabel: this.cur.label(id) + period });
  }

  /**
   * Ek paket satın alınabilir mi?
   * - Aktif paket yoksa → hepsi açık.
   * - Aktif paket varsa → aynısı alınamaz, yalnızca daha büyük paket (upgrade).
   */
  canBuyPack(k: Pack): boolean {
    const activeId = this.quota.activePackId();
    if (!activeId) return true;
    if (k.id === activeId) return false;
    const active = this.packs.find((p) => p.id === activeId);
    return !!active && k.credits > active.credits;
  }

  /** Ek görsel paketi satın al — önce ödeme akışı açılır. */
  buyPack(k: Pack): void {
    if (!this.canBuyPack(k)) return;
    this.startCheckout({
      kind: 'pack', id: k.id, name: `${this.i18n.t(k.nameKey)} · ${k.credits} ${this.i18n.t('credits')}`,
      amount: this.cur.amount(k.id), priceLabel: this.cur.label(k.id), credits: k.credits,
    });
  }

  // --- Ödeme akışı ---
  private startCheckout(item: CartItem): void {
    this.payDone.set(false);
    this.payError.set(null);
    const firstReady = this.payment.status().providers.find((p) => p.ready);
    this.payProvider.set(firstReady?.id ?? 'iyzico');
    this.cart.set(item);
  }

  closePay(): void {
    this.cart.set(null);
    this.paying.set(false);
    this.payDone.set(false);
  }

  async confirmPay(): Promise<void> {
    const it = this.cart();
    if (!it) return;
    this.paying.set(true);
    this.payError.set(null);
    const res = await this.payment.checkout({
      kind: it.kind, itemId: it.id, itemName: it.name, amount: it.amount,
      currency: this.cur.currency(), provider: this.payProvider(),
    });
    if (res.mode === 'error') {
      // Sağlayıcı bağlı ama işlem reddedildi → gerçek hatayı göster (sahte başarı yok)
      this.payError.set(res.error || 'Ödeme başlatılamadı');
      this.paying.set(false);
      return;
    }
    if (res.mode === 'live' && res.url) {
      // Gerçek sağlayıcı: bekleyen alımı sakla ve ödeme sayfasına yönlendir
      this.savePending(it);
      window.location.href = res.url;
      return;
    }
    // Demo: onayla + uygula
    await this.payment.confirm(res.ref);
    this.applyPurchase(it);
    this.paying.set(false);
    this.payDone.set(true);
  }

  /** Ödeme başarılı → planı/paketi aktifleştir. */
  private applyPurchase(it: CartItem): void {
    if (it.kind === 'plan') {
      this.plan.select(it.id);
    } else if (it.credits) {
      this.quota.buyPack(it.id, it.credits);
      this.added.set(it.credits);
    }
  }

  private savePending(it: CartItem): void {
    try { localStorage.setItem(this.PENDING, JSON.stringify(it)); } catch { /* geç */ }
  }
  private loadPending(): CartItem | null {
    try { const r = localStorage.getItem(this.PENDING); return r ? JSON.parse(r) as CartItem : null; } catch { return null; }
  }
  private clearPending(): void {
    try { localStorage.removeItem(this.PENDING); } catch { /* geç */ }
  }
}
