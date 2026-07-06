import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService, LOCALES } from '../../core/i18n.service';
import { FavoritesService } from '../../core/favorites.service';
import { PlanService } from '../../core/plan.service';
import { ImageQuotaService } from '../../core/image-quota.service';
import { AuthService } from '../../core/auth.service';
import { DesignCardComponent } from '../../shared/design-card.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [DesignCardComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="phead">
        <div class="av">{{ auth.loggedIn() ? avatarLetter() : '👤' }}</div>
        @if (auth.user(); as u) {
          <h1 class="nm">{{ u.email.split('@')[0] }}</h1>
          <p class="em">{{ u.email }}</p>
          <button class="btn-ghost auth-btn" (click)="auth.logout()">{{ i18n.t('logout') }}</button>
        } @else {
          <h1 class="nm">{{ i18n.t('auth_guest') }}</h1>
          <p class="em">{{ i18n.t('auth_sub') }}</p>
          <button class="btn-primary auth-btn" (click)="openAuth('login')">{{ i18n.t('login') }}</button>
        }
      </header>

      <!-- Giriş / Kayıt penceresi -->
      @if (authOpen()) {
        <div class="au-back" (click)="authOpen.set(false)"></div>
        <div class="au card">
          <h3 class="au-t">{{ authMode() === 'login' ? i18n.t('login') : i18n.t('register') }}</h3>
          <input class="au-in" type="email" [value]="email()" (input)="email.set($any($event.target).value)"
            [placeholder]="i18n.t('auth_email')" autocomplete="email" />
          <input class="au-in" type="password" [value]="password()" (input)="password.set($any($event.target).value)"
            [placeholder]="i18n.t('auth_password')" autocomplete="current-password" />
          @if (authErr()) { <p class="au-err">⚠️ {{ authErr() }}</p> }
          <button class="btn-primary au-go" (click)="submitAuth()" [disabled]="authBusy()">
            {{ authBusy() ? '…' : (authMode() === 'login' ? i18n.t('login') : i18n.t('register')) }}
          </button>
          <button class="au-switch" (click)="toggleMode()">
            {{ authMode() === 'login' ? i18n.t('auth_switch_reg') : i18n.t('auth_switch_log') }}
          </button>
        </div>
      }

      <div class="stats">
        <div class="stat card"><span class="n">12</span><span class="l">{{ i18n.t('designs') }}</span></div>
        <div class="stat card"><span class="n">{{ fav.count() }}</span><span class="l">{{ i18n.t('favorites') }}</span></div>
        <div class="stat card"><span class="n">7</span><span class="l">{{ i18n.t('tryons') }}</span></div>
      </div>

      <!-- Üyelik durumu -->
      <div class="plan-card card" [class.hl]="plan.current() !== 'free'">
        <div class="plan-top">
          <div>
            <p class="plan-k">💎 {{ i18n.t('subscription') }}</p>
            <p class="plan-name">{{ planName() }}</p>
          </div>
          @if (daysLeft() !== null) {
            <span class="plan-days">⏳ {{ daysLeft() }} {{ i18n.t('days_left') }}</span>
          }
        </div>
        <div class="plan-quota">
          <span class="q-ico">🖼️</span>
          <span class="q-n">{{ quota.remaining() }}</span>
          <span class="q-l">{{ i18n.t('quota_remaining') }}</span>
        </div>
        <button class="btn-primary wide" routerLink="/shop">{{ i18n.t('manage_plan') }}</button>
      </div>

      <!-- Favoriler -->
      <h2 class="fav-title">❤️ {{ i18n.t('my_fav') }}</h2>
      @if (favDesigns().length) {
        <div class="fav-grid">
          @for (d of favDesigns(); track d.id) {
            <app-design-card [design]="d" [width]="0" />
          }
        </div>
      } @else {
        <p class="fav-empty">{{ i18n.t('no_favorites') }}</p>
      }

      <div class="lang-block card">
        <p class="lbl">🌐 {{ i18n.t('language') }}</p>
        <div class="langs">
          @for (l of locales; track l.code) {
            <button class="lang" [class.on]="l.code === i18n.locale()" (click)="i18n.setLocale(l.code)">
              {{ l.flag }} {{ l.label }}
            </button>
          }
        </div>
      </div>

      <div class="menu card">
        @for (m of menu; track m.key) {
          <button class="row">
            <span class="mi">{{ m.icon }}</span>
            <span class="mt">{{ i18n.t(m.key) }}</span>
            <span class="ch">›</span>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .phead { text-align: center; padding: 28px 0 10px; }
    .av { width: 88px; height: 88px; border-radius: 50%; margin: 0 auto; display: flex;
      align-items: center; justify-content: center; font-size: 38px; font-weight: 700; color: #1a1206;
      background: var(--gold-grad); border: 3px solid rgba(212,175,55,0.5); text-transform: uppercase; }
    .nm { margin: 12px 0 2px; font-size: 22px; }
    .em { margin: 0; font-size: 12.5px; color: var(--muted-2); }
    .auth-btn { margin-top: 12px; padding: 8px 22px; }
    .au-back { position: fixed; inset: 0; z-index: 1100; background: rgba(0,0,0,0.6); backdrop-filter: blur(3px); }
    .au { position: fixed; z-index: 1101; inset-inline: 24px; top: 50%; transform: translateY(-50%);
      margin: 0 auto; max-width: 380px; padding: 22px 18px; }
    .au-t { margin: 0 0 16px; font-size: 20px; text-align: center; }
    .au-in { width: 100%; background: var(--surface-2); color: var(--ink); border: 1px solid var(--line);
      border-radius: 12px; padding: 12px 14px; font: inherit; font-size: 14px; margin-bottom: 10px; outline: none; }
    .au-in:focus { border-color: rgba(212,175,55,0.5); }
    .au-err { margin: 4px 0 8px; font-size: 12px; color: #f0b8b8; text-align: center; }
    .au-go { width: 100%; margin-top: 6px; }
    .au-switch { width: 100%; margin-top: 12px; background: transparent; color: var(--gold-soft); font-size: 13px; padding: 6px; }
    .stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin: 18px 0; }
    .plan-card { padding: 16px; margin-bottom: 18px; }
    .plan-card.hl { border-color: rgba(212,175,55,0.5);
      background: linear-gradient(180deg, rgba(212,175,55,0.1), var(--surface-2)); }
    .plan-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
    .plan-k { margin: 0; font-size: 11px; color: var(--muted-2); }
    .plan-name { margin: 3px 0 0; font-size: 18px; font-weight: 700; color: var(--gold-soft); font-family: var(--font-head); }
    .plan-days { font-size: 11px; font-weight: 700; color: var(--gold-soft);
      background: rgba(212,175,55,0.14); border: 1px solid rgba(212,175,55,0.4); padding: 3px 9px; border-radius: 999px; white-space: nowrap; }
    .plan-quota { display: flex; align-items: baseline; gap: 6px; margin: 12px 0 14px; }
    .plan-quota .q-ico { font-size: 15px; }
    .plan-quota .q-n { font-size: 20px; font-weight: 700; color: var(--gold); font-family: var(--font-head); }
    .plan-quota .q-l { font-size: 12px; color: var(--muted-2); }
    .plan-card .wide { width: 100%; }
    .stat { padding: 16px 8px; text-align: center; display: flex; flex-direction: column; gap: 2px; }
    .stat .n { font-size: 22px; font-weight: 700; color: var(--gold); font-family: var(--font-head); }
    .stat .l { font-size: 11px; color: var(--muted-2); }
    .fav-title { font-family: var(--font-head); font-size: 17px; margin: 6px 0 12px; }
    .fav-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 18px; }
    .fav-grid ::ng-deep .dc { width: 100% !important; }
    .fav-empty { color: var(--muted-2); font-size: 13px; text-align: center;
      padding: 20px; margin: 0 0 18px; background: var(--surface-2);
      border: 1px dashed var(--line); border-radius: 14px; }
    .lang-block { padding: 16px; margin-bottom: 16px; }
    .lbl { margin: 0 0 12px; font-size: 13px; font-weight: 600; color: var(--muted); }
    .langs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .lang { padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 600;
      background: var(--surface-2); border: 1px solid var(--line); color: var(--ink); text-align: start; }
    .lang.on { background: rgba(212,175,55,0.16); color: var(--gold-soft); border-color: rgba(212,175,55,0.4); }
    .menu { overflow: hidden; }
    .row { display: flex; align-items: center; gap: 14px; width: 100%; padding: 15px 16px;
      border-bottom: 1px solid var(--line); text-align: start; }
    .row:last-child { border-bottom: none; }
    .mi { font-size: 18px; }
    .mt { flex: 1; font-size: 14px; color: var(--ink); }
    .ch { color: var(--muted-2); font-size: 20px; }
  `],
})
export class ProfileComponent {
  readonly i18n = inject(I18nService);
  readonly fav = inject(FavoritesService);
  readonly plan = inject(PlanService);
  readonly quota = inject(ImageQuotaService);
  readonly auth = inject(AuthService);
  readonly locales = LOCALES;

  // Giriş/kayıt penceresi durumu
  readonly authOpen = signal<boolean>(false);
  readonly authMode = signal<'login' | 'register'>('login');
  readonly email = signal<string>('');
  readonly password = signal<string>('');
  readonly authErr = signal<string | null>(null);
  readonly authBusy = signal<boolean>(false);

  avatarLetter(): string {
    return this.auth.user()?.email.charAt(0) || '?';
  }

  openAuth(mode: 'login' | 'register'): void {
    this.authMode.set(mode);
    this.authErr.set(null);
    this.authOpen.set(true);
  }

  toggleMode(): void {
    this.authMode.set(this.authMode() === 'login' ? 'register' : 'login');
    this.authErr.set(null);
  }

  async submitAuth(): Promise<void> {
    const email = this.email().trim();
    const password = this.password();
    if (!email || !password) { this.authErr.set(this.i18n.t('auth_fill')); return; }
    this.authBusy.set(true);
    this.authErr.set(null);
    const res = this.authMode() === 'login'
      ? await this.auth.login(email, password)
      : await this.auth.register(email, password);
    this.authBusy.set(false);
    if (res.ok) {
      this.authOpen.set(false);
      this.email.set(''); this.password.set('');
    } else {
      this.authErr.set(res.error ?? 'Hata');
    }
  }

  private readonly PLAN_KEYS: Record<string, string> = {
    free: 'pn_free', monthly: 'pn_monthly', yearly: 'pn_yearly', pro: 'pn_pro', pro_yearly: 'pn_pro_yearly',
  };

  /** Seçili planın gösterim adı (dile bağlı). */
  readonly planName = computed(() => this.i18n.t(this.PLAN_KEYS[this.plan.current()] ?? 'pn_free'));

  /** Aktif abonelikte bitişe kalan gün (yoksa null). */
  readonly daysLeft = computed<number | null>(() => {
    const exp = this.plan.expiresAt();
    if (exp === null || !this.plan.active()) return null;
    return Math.max(0, Math.ceil((exp - Date.now()) / (24 * 60 * 60 * 1000)));
  });

  readonly favDesigns = this.fav.items;
  readonly menu = [
    { icon: '❤️', key: 'my_fav' },
    { icon: '📱', key: 'tryon_hist' },
    { icon: '🎨', key: 'style_pref' },
    { icon: '💎', key: 'subscription' },
    { icon: '⚙️', key: 'settings' },
    { icon: '❓', key: 'help' },
    { icon: '🚪', key: 'logout' },
  ];
}
