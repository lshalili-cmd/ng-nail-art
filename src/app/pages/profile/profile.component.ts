import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { I18nService, LOCALES } from '../../core/i18n.service';
import { FavoritesService } from '../../core/favorites.service';
import { PlanService } from '../../core/plan.service';
import { ImageQuotaService } from '../../core/image-quota.service';
import { AuthService, validPassword } from '../../core/auth.service';
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

      <!-- Giriş / Kayıt / OTP / Şifre sıfırlama penceresi -->
      @if (authOpen()) {
        <div class="au-back" (click)="closeAuth()"></div>
        <div class="au card">
          <h3 class="au-t">{{ i18n.t(stepTitle()) }}</h3>

          @switch (authStep()) {
            @case ('register') {
              <div class="au-row2">
                <input class="au-in" [value]="firstName()" (input)="firstName.set($any($event.target).value)" [placeholder]="i18n.t('auth_first')" />
                <input class="au-in" [value]="lastName()" (input)="lastName.set($any($event.target).value)" [placeholder]="i18n.t('auth_last')" />
              </div>
              <input class="au-in" type="email" [value]="email()" (input)="email.set($any($event.target).value)" [placeholder]="i18n.t('auth_email')" autocomplete="email" />
              <input class="au-in" type="tel" [value]="phone()" (input)="phone.set($any($event.target).value)" [placeholder]="i18n.t('auth_phone')" autocomplete="tel" />
              <input class="au-in" type="password" [value]="password()" (input)="password.set($any($event.target).value)" [placeholder]="i18n.t('auth_password')" />
              <p class="au-hint" [class.ok]="pwOk()">{{ pwOk() ? '✓ ' : '' }}{{ i18n.t('auth_pw_rule') }}</p>
            }
            @case ('otp') {
              <p class="au-note">{{ i18n.t('auth_otp_sent') }} {{ maskedPhone() }}</p>
              <input class="au-in au-otp" inputmode="numeric" maxlength="6" [value]="otp()" (input)="otp.set($any($event.target).value)" [placeholder]="i18n.t('auth_otp')" />
              <button class="au-switch" (click)="resend()">{{ i18n.t('auth_resend') }}</button>
            }
            @case ('forgot') {
              <p class="au-note">{{ i18n.t('auth_forgot_sub') }}</p>
              <input class="au-in" type="email" [value]="email()" (input)="email.set($any($event.target).value)" [placeholder]="i18n.t('auth_email')" autocomplete="email" />
            }
            @case ('reset') {
              <p class="au-note">{{ i18n.t('auth_reset_sub') }}</p>
              <input class="au-in" type="password" [value]="password()" (input)="password.set($any($event.target).value)" [placeholder]="i18n.t('auth_new_pw')" />
              <p class="au-hint" [class.ok]="pwOk()">{{ pwOk() ? '✓ ' : '' }}{{ i18n.t('auth_pw_rule') }}</p>
            }
            @default {
              <input class="au-in" type="email" [value]="email()" (input)="email.set($any($event.target).value)" [placeholder]="i18n.t('auth_email')" autocomplete="email" />
              <input class="au-in" type="password" [value]="password()" (input)="password.set($any($event.target).value)" [placeholder]="i18n.t('auth_password')" autocomplete="current-password" />
              <button class="au-forgot" (click)="setStep('forgot')">{{ i18n.t('auth_forgot') }}</button>
            }
          }

          @if (demoInfo()) { <p class="au-demo">🧪 {{ demoInfo() }}</p> }
          @if (authErr()) { <p class="au-err">⚠️ {{ authErr() }}</p> }

          <button class="btn-primary au-go" (click)="submitAuth()" [disabled]="authBusy()">
            {{ authBusy() ? '…' : i18n.t(ctaKey()) }}
          </button>

          @if (authStep() === 'login') { <button class="au-switch" (click)="setStep('register')">{{ i18n.t('auth_switch_reg') }}</button> }
          @if (authStep() === 'register') { <button class="au-switch" (click)="setStep('login')">{{ i18n.t('auth_switch_log') }}</button> }
          @if (authStep() === 'forgot' || authStep() === 'otp' || authStep() === 'reset') { <button class="au-switch" (click)="setStep('login')">← {{ i18n.t('login') }}</button> }
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
    .au-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .au-row2 .au-in { margin-bottom: 10px; }
    .au-hint { margin: 2px 0 6px; font-size: 11.5px; color: var(--muted-2); }
    .au-hint.ok { color: var(--gold-soft); }
    .au-note { margin: 0 0 12px; font-size: 13px; color: var(--muted); line-height: 1.5; text-align: center; }
    .au-otp { text-align: center; letter-spacing: 6px; font-size: 20px; font-weight: 700; }
    .au-forgot { display: block; margin: 2px 0 4px auto; background: transparent; color: var(--gold-soft); font-size: 12px; padding: 4px; }
    .au-demo { margin: 8px 0; font-size: 12px; color: var(--gold-soft); word-break: break-all; text-align: center;
      background: rgba(212,175,55,0.1); border: 1px dashed rgba(212,175,55,0.4); border-radius: 10px; padding: 8px; }
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
export class ProfileComponent implements OnInit {
  readonly i18n = inject(I18nService);
  readonly fav = inject(FavoritesService);
  readonly plan = inject(PlanService);
  readonly quota = inject(ImageQuotaService);
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  readonly locales = LOCALES;

  // Giriş/kayıt penceresi durumu
  readonly authOpen = signal<boolean>(false);
  readonly authStep = signal<'login' | 'register' | 'otp' | 'forgot' | 'reset'>('login');
  readonly firstName = signal<string>('');
  readonly lastName = signal<string>('');
  readonly email = signal<string>('');
  readonly phone = signal<string>('');
  readonly password = signal<string>('');
  readonly otp = signal<string>('');
  readonly demoInfo = signal<string | null>(null);
  readonly authErr = signal<string | null>(null);
  readonly authBusy = signal<boolean>(false);
  private resetToken = '';

  readonly pwOk = computed(() => validPassword(this.password()));

  ngOnInit(): void {
    // Şifre sıfırlama bağlantısı: /profile?reset=TOKEN
    const t = this.route.snapshot.queryParamMap.get('reset');
    if (t) { this.resetToken = t; this.openAuth('reset'); }
  }

  stepTitle(): string {
    return { login: 'login', register: 'register', otp: 'auth_otp_title', forgot: 'auth_forgot', reset: 'auth_reset_title' }[this.authStep()];
  }
  ctaKey(): string {
    return { login: 'login', register: 'register', otp: 'auth_verify', forgot: 'auth_send_link', reset: 'auth_set_pw' }[this.authStep()];
  }
  maskedPhone(): string {
    const p = this.phone().replace(/\D/g, '');
    return p.length >= 4 ? '•••• ' + p.slice(-4) : '';
  }
  avatarLetter(): string { return this.auth.user()?.email.charAt(0) || '?'; }

  openAuth(step: 'login' | 'register' | 'reset'): void {
    this.authStep.set(step);
    this.clearAuth();
    this.authOpen.set(true);
  }
  setStep(step: 'login' | 'register' | 'otp' | 'forgot' | 'reset'): void {
    this.authStep.set(step);
    this.authErr.set(null);
    this.demoInfo.set(null);
  }
  closeAuth(): void { this.authOpen.set(false); this.clearAuth(); }
  private clearAuth(): void {
    this.firstName.set(''); this.lastName.set(''); this.phone.set(''); this.password.set(''); this.otp.set('');
    this.authErr.set(null); this.demoInfo.set(null);
  }

  async submitAuth(): Promise<void> {
    this.authErr.set(null);
    const step = this.authStep();
    const email = this.email().trim().toLowerCase();

    if (step === 'login') {
      if (!email || !this.password()) { this.authErr.set(this.i18n.t('auth_fill')); return; }
      await this.run(() => this.auth.login(email, this.password()));
    } else if (step === 'register') {
      if (!this.firstName().trim() || !this.lastName().trim() || !email || !this.phone().trim()) { this.authErr.set(this.i18n.t('auth_fill_all')); return; }
      if (!this.pwOk()) { this.authErr.set(this.i18n.t('auth_pw_rule')); return; }
      await this.run(() => this.auth.register({
        firstName: this.firstName().trim(), lastName: this.lastName().trim(), email,
        phone: this.phone().trim(), password: this.password(),
      }));
    } else if (step === 'otp') {
      if (this.otp().trim().length < 4) { this.authErr.set(this.i18n.t('auth_fill')); return; }
      await this.run(() => this.auth.verifyOtp(email, this.otp().trim()));
    } else if (step === 'forgot') {
      if (!email) { this.authErr.set(this.i18n.t('auth_fill')); return; }
      await this.run(() => this.auth.forgot(email));
    } else if (step === 'reset') {
      if (!this.pwOk()) { this.authErr.set(this.i18n.t('auth_pw_rule')); return; }
      await this.run(() => this.auth.reset(this.resetToken, this.password()));
    }
  }

  /** Bir auth çağrısını çalıştırır ve sonucuna göre akışı yönlendirir. */
  private async run(fn: () => Promise<import('../../core/auth.service').AuthResult>): Promise<void> {
    this.authBusy.set(true);
    const res = await fn();
    this.authBusy.set(false);
    const step = this.authStep();

    if (res.needOtp) {
      // Kayıt sonrası veya doğrulanmamış giriş → OTP adımı
      if (res.email) this.email.set(res.email);
      this.demoInfo.set(res.demoOtp ? `${this.i18n.t('auth_demo_otp')}: ${res.demoOtp}` : null);
      this.setStep('otp');
      return;
    }
    if (res.ok) {
      if (step === 'otp' || step === 'login') { this.closeAuth(); return; }        // giriş tamam
      if (step === 'forgot') { this.demoInfo.set(res.demoLink ? `${this.i18n.t('auth_demo_link')}: ${res.demoLink}` : this.i18n.t('auth_link_sent')); return; }
      if (step === 'reset') { this.demoInfo.set(this.i18n.t('auth_reset_done')); this.password.set(''); this.setStep('login'); this.demoInfo.set(this.i18n.t('auth_reset_done')); return; }
    } else {
      this.authErr.set(res.error ?? 'Hata');
    }
  }

  async resend(): Promise<void> {
    const res = await this.auth.resendOtp(this.email().trim().toLowerCase());
    if (res.demoOtp) this.demoInfo.set(`${this.i18n.t('auth_demo_otp')}: ${res.demoOtp}`);
    else if (res.ok) this.demoInfo.set(this.i18n.t('auth_otp_resent'));
    else this.authErr.set(res.error ?? 'Hata');
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
