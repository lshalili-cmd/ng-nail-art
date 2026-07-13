import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { I18nService, LOCALES } from '../../core/i18n.service';
import { FavoritesService } from '../../core/favorites.service';
import { PlanService } from '../../core/plan.service';
import { ImageQuotaService } from '../../core/image-quota.service';
import { AuthService, validPassword } from '../../core/auth.service';
import { DesignCardComponent } from '../../shared/design-card.component';
import { COUNTRIES } from '../../core/countries';

interface MyTicket { id: number; message: string; reply: string; status: string; repliedAt: number; }

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
          <img class="au-logo" src="/icon-192.png" alt="Miracle Nail Art" />
          <h3 class="au-t">{{ i18n.t(stepTitle()) }}</h3>

          @switch (authStep()) {
            @case ('register') {
              <div class="au-row2">
                <input class="au-in" [value]="firstName()" (input)="firstName.set($any($event.target).value)" [placeholder]="i18n.t('auth_first')" />
                <input class="au-in" [value]="lastName()" (input)="lastName.set($any($event.target).value)" [placeholder]="i18n.t('auth_last')" />
              </div>
              <input class="au-in" type="email" [value]="email()" (input)="email.set($any($event.target).value)" [placeholder]="i18n.t('auth_email')" autocomplete="email" />
              <div class="au-phone">
                <select class="au-in au-cc" [value]="countryDial()" (change)="countryDial.set($any($event.target).value)">
                  @for (c of countries; track c.iso) {
                    <option [value]="c.dial">{{ c.flag }} {{ c.name }} ({{ c.dial }})</option>
                  }
                </select>
                <input class="au-in au-ph" type="tel" [value]="phone()" (input)="phone.set($any($event.target).value)" [placeholder]="i18n.t('auth_phone')" autocomplete="tel" />
              </div>
              <div class="au-pw"><input class="au-in" [type]="showPw() ? 'text' : 'password'" [value]="password()" (input)="password.set($any($event.target).value)" [placeholder]="i18n.t('auth_password')" /><button type="button" class="au-eye" (click)="showPw.set(!showPw())">{{ showPw() ? '👁️' : '🙈' }}</button></div>
              <p class="au-hint" [class.ok]="pwOk()">{{ pwOk() ? '✓ ' : '' }}{{ i18n.t('auth_pw_rule') }}</p>
              <label class="au-agree">
                <input type="checkbox" [checked]="agree()" (change)="agree.set($any($event.target).checked)" />
                <span>{{ i18n.t('agree_text') }}</span>
              </label>
              <div class="au-links">
                <a href="/legal?doc=privacy" target="_blank" rel="noopener">{{ i18n.t('leg_privacy') }}</a> ·
                <a href="/legal?doc=kvkk" target="_blank" rel="noopener">{{ i18n.t('leg_kvkk') }}</a> ·
                <a href="/legal?doc=terms" target="_blank" rel="noopener">{{ i18n.t('leg_terms') }}</a>
              </div>
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
              <input class="au-in au-otp" inputmode="numeric" maxlength="6" [value]="otp()" (input)="otp.set($any($event.target).value)" [placeholder]="i18n.t('auth_code_ph')" />
              <div class="au-pw"><input class="au-in" [type]="showPw() ? 'text' : 'password'" [value]="password()" (input)="password.set($any($event.target).value)" [placeholder]="i18n.t('auth_new_pw')" /><button type="button" class="au-eye" (click)="showPw.set(!showPw())">{{ showPw() ? '👁️' : '🙈' }}</button></div>
              <p class="au-hint" [class.ok]="pwOk()">{{ pwOk() ? '✓ ' : '' }}{{ i18n.t('auth_pw_rule') }}</p>
            }
            @default {
              <input class="au-in" type="email" [value]="email()" (input)="email.set($any($event.target).value)" [placeholder]="i18n.t('auth_email')" autocomplete="email" />
              <div class="au-pw"><input class="au-in" [type]="showPw() ? 'text' : 'password'" [value]="password()" (input)="password.set($any($event.target).value)" [placeholder]="i18n.t('auth_password')" autocomplete="current-password" /><button type="button" class="au-eye" (click)="showPw.set(!showPw())">{{ showPw() ? '👁️' : '🙈' }}</button></div>
              <div class="au-row-between">
                <label class="au-remember"><input type="checkbox" [checked]="remember()" (change)="remember.set($any($event.target).checked)" /><span>{{ i18n.t('auth_remember') }}</span></label>
                <button class="au-forgot" (click)="setStep('forgot')">{{ i18n.t('auth_forgot') }}</button>
              </div>
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

      <div class="menu card">
        @for (m of menu; track m.key) {
          <button class="row" (click)="go(m.key)">
            <span class="mi">{{ m.icon }}</span>
            <span class="mt">{{ i18n.t(m.key) }}</span>
            @if (m.key === 'help' && supportUnread() > 0) { <span class="row-badge">{{ supportUnread() }}</span> }
            <span class="ch">›</span>
          </button>
        }
      </div>

      <!-- Favorilerim penceresi (menüdeki butona tıklanınca açılır) -->
      @if (favOpen()) {
        <div class="fav-back" (click)="favOpen.set(false)"></div>
        <div class="fav-modal card">
          <div class="fav-head">
            <h3 class="fav-mt">❤️ {{ i18n.t('my_fav') }}</h3>
            <button class="fav-x" (click)="favOpen.set(false)" aria-label="Kapat">✕</button>
          </div>
          @if (favDesigns().length) {
            <div class="fav-grid">
              @for (d of favDesigns(); track d.id) {
                <app-design-card [design]="d" [width]="0" />
              }
            </div>
          } @else {
            <p class="fav-empty">{{ i18n.t('no_favorites') }}</p>
          }
        </div>
      }

      <!-- Ayarlar penceresi -->
      @if (settingsOpen()) {
        <div class="au-back" (click)="settingsOpen.set(false)"></div>
        <div class="au card">
          <h3 class="au-t">{{ i18n.t('settings') }}</h3>

          @switch (settingsStep()) {
            @case ('changepw') {
              <div class="au-pw"><input class="au-in" [type]="showPw() ? 'text' : 'password'" [value]="newPw()" (input)="newPw.set($any($event.target).value)" [placeholder]="i18n.t('set_newpw')" /><button type="button" class="au-eye" (click)="showPw.set(!showPw())">{{ showPw() ? '👁️' : '🙈' }}</button></div>
              <div class="au-pw"><input class="au-in" [type]="showPw() ? 'text' : 'password'" [value]="newPw2()" (input)="newPw2.set($any($event.target).value)" [placeholder]="i18n.t('set_newpw2')" /><button type="button" class="au-eye" (click)="showPw.set(!showPw())">{{ showPw() ? '👁️' : '🙈' }}</button></div>
              <p class="au-hint" [class.ok]="newPwOk()">{{ newPwOk() ? '✓ ' : '' }}{{ i18n.t('auth_pw_rule') }}</p>
              <button class="btn-primary au-go" (click)="changePw()" [disabled]="setBusy()">{{ setBusy() ? '…' : i18n.t('set_change_btn') }}</button>
              <button class="au-switch" (click)="forgotFromSettings()" [disabled]="setBusy()">{{ i18n.t('auth_forgot') }}</button>
            }
            @case ('resetcode') {
              <p class="au-note">{{ i18n.t('auth_reset_sub') }}</p>
              <input class="au-in au-otp" inputmode="numeric" maxlength="6" [value]="setCode()" (input)="setCode.set($any($event.target).value)" [placeholder]="i18n.t('auth_code_ph')" />
              <div class="au-pw"><input class="au-in" [type]="showPw() ? 'text' : 'password'" [value]="newPw()" (input)="newPw.set($any($event.target).value)" [placeholder]="i18n.t('auth_new_pw')" /><button type="button" class="au-eye" (click)="showPw.set(!showPw())">{{ showPw() ? '👁️' : '🙈' }}</button></div>
              <p class="au-hint" [class.ok]="newPwOk()">{{ newPwOk() ? '✓ ' : '' }}{{ i18n.t('auth_pw_rule') }}</p>
              <button class="btn-primary au-go" (click)="resetPwFromSettings()" [disabled]="setBusy()">{{ setBusy() ? '…' : i18n.t('auth_set_pw') }}</button>
            }
            @case ('delete') {
              <input class="au-in" type="email" [value]="delEmail()" (input)="delEmail.set($any($event.target).value)" [placeholder]="i18n.t('auth_email')" />
              <div class="au-phone">
                <select class="au-in au-cc" [value]="delCountryDial()" (change)="delCountryDial.set($any($event.target).value)">
                  @for (c of countries; track c.iso) {
                    <option [value]="c.dial">{{ c.flag }} {{ c.name }} ({{ c.dial }})</option>
                  }
                </select>
                <input class="au-in au-ph" type="tel" [value]="delPhone()" (input)="delPhone.set($any($event.target).value)" [placeholder]="i18n.t('auth_phone')" autocomplete="tel" />
              </div>
              <div class="au-pw"><input class="au-in" [type]="showPw() ? 'text' : 'password'" [value]="delPw()" (input)="delPw.set($any($event.target).value)" [placeholder]="i18n.t('auth_password')" /><button type="button" class="au-eye" (click)="showPw.set(!showPw())">{{ showPw() ? '👁️' : '🙈' }}</button></div>
              <button class="btn-primary au-go set-danger" (click)="deleteAcc()" [disabled]="setBusy()">{{ setBusy() ? '…' : i18n.t('set_del_btn') }}</button>
            }
            @case ('deleted') {
              <p class="au-note">🗑️ {{ i18n.t('set_del_blocked') }}</p>
              <button class="btn-primary au-go" (click)="settingsOpen.set(false)">{{ i18n.t('pay_close') }}</button>
            }
            @default {
              <button class="set-opt" (click)="settingsGo('changepw')">🔑 {{ i18n.t('set_changepw') }} <span class="ch">›</span></button>
              <button class="set-opt" (click)="settingsGo('delete')">🗑️ {{ i18n.t('set_delete') }} <span class="ch">›</span></button>
            }
          }

          @if (setInfo()) { <p class="au-demo">{{ setInfo() }}</p> }
          @if (setErr()) { <p class="au-err">⚠️ {{ setErr() }}</p> }
          @if (settingsStep() !== 'menu' && settingsStep() !== 'deleted') { <button class="au-switch" (click)="settingsGo('menu')">← {{ i18n.t('back') }}</button> }
        </div>
      }

      <!-- Yardım / Destek penceresi -->
      @if (supportOpen()) {
        <div class="au-back" (click)="supportOpen.set(false)"></div>
        <div class="au card sup-card">
          <h3 class="au-t">❓ {{ i18n.t('sup_title') }}</h3>

          @if (auth.loggedIn() && myTickets().length) {
            <p class="sup-lbl">{{ i18n.t('sup_mine') }}</p>
            <div class="sup-list">
              @for (t of myTickets(); track t.id) {
                <div class="sup-item">
                  <p class="sup-q">{{ t.message }}</p>
                  @if (t.reply) {
                    <p class="sup-a"><b>{{ i18n.t('sup_answer') }}:</b> {{ t.reply }}</p>
                  } @else {
                    <p class="sup-wait">⏳ {{ i18n.t('sup_waiting') }}</p>
                  }
                </div>
              }
            </div>
          }

          @if (supportSent()) {
            <p class="au-note">✅ {{ i18n.t('sup_sent') }}</p>
            <button class="au-switch" (click)="newSupportMsg()">＋ {{ i18n.t('sup_new') }}</button>
            <button class="btn-primary au-go" (click)="supportOpen.set(false)">{{ i18n.t('pay_close') }}</button>
          } @else {
            <p class="au-note">{{ i18n.t('sup_sub') }}</p>
            @if (!auth.loggedIn()) {
              <input class="au-in" type="email" [value]="supportEmail()" (input)="supportEmail.set($any($event.target).value)" [placeholder]="i18n.t('sup_email_ph')" autocomplete="email" />
            }
            <textarea class="au-in au-ta" rows="5" [value]="supportMsg()" (input)="supportMsg.set($any($event.target).value)" [placeholder]="i18n.t('sup_ph')"></textarea>
            @if (supportErr()) { <p class="au-err">⚠️ {{ supportErr() }}</p> }
            <button class="btn-primary au-go" (click)="sendSupport()" [disabled]="supportBusy()">{{ supportBusy() ? '…' : i18n.t('sup_send') }}</button>
          }
        </div>
      }
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
    .au-logo { display: block; width: 76px; height: 76px; margin: 2px auto 10px; border-radius: 20px; }
    .au-t { margin: 0 0 16px; font-size: 20px; text-align: center; }
    .au-in { width: 100%; background: var(--surface-2); color: var(--ink); border: 1px solid var(--line);
      border-radius: 12px; padding: 12px 14px; font: inherit; font-size: 14px; margin-bottom: 10px; outline: none; }
    .au-in:focus { border-color: rgba(212,175,55,0.5); }
    .au-ta { resize: vertical; min-height: 96px; line-height: 1.5; font-family: inherit; }
    .sup-card { max-height: 84vh; overflow-y: auto; }
    .sup-lbl { margin: 2px 0 8px; font-size: 12px; font-weight: 700; color: var(--muted); }
    .sup-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
    .sup-item { background: var(--surface-2); border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; }
    .sup-q { margin: 0; font-size: 13px; color: var(--ink); line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
    .sup-a { margin: 8px 0 0; font-size: 13px; line-height: 1.5; color: var(--gold-soft);
      background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.3); border-radius: 10px; padding: 8px 10px; white-space: pre-wrap; word-break: break-word; }
    .sup-a b { color: var(--gold); }
    .sup-wait { margin: 8px 0 0; font-size: 12px; color: var(--muted-2); }
    .au-err { margin: 4px 0 8px; font-size: 12px; color: #f0b8b8; text-align: center; }
    .au-go { width: 100%; margin-top: 6px; }
    .au-switch { width: 100%; margin-top: 12px; background: transparent; color: var(--gold-soft); font-size: 13px; padding: 6px; }
    .set-opt { display: flex; align-items: center; gap: 10px; width: 100%; padding: 15px 14px; margin-bottom: 8px;
      border-radius: 12px; background: var(--surface-2); border: 1px solid var(--line); color: var(--ink);
      font-size: 14px; text-align: start; }
    .set-opt .ch { margin-inline-start: auto; color: var(--muted-2); font-size: 20px; }
    .set-danger { background: linear-gradient(135deg, #b23a3a, #7a1f1f); color: #fff; }
    .au-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .au-phone { display: grid; grid-template-columns: 1fr 1.2fr; gap: 8px; }
    .au-cc { min-width: 0; }
    .au-ph { min-width: 0; }
    .au-row2 .au-in { margin-bottom: 10px; }
    .au-hint { margin: 2px 0 6px; font-size: 11.5px; color: var(--muted-2); }
    .au-hint.ok { color: var(--gold-soft); }
    .au-agree { display: flex; align-items: flex-start; gap: 8px; margin: 8px 0 4px; font-size: 12px; color: var(--muted); line-height: 1.45; cursor: pointer; }
    .au-agree input { margin-top: 2px; width: 16px; height: 16px; flex: 0 0 auto; accent-color: var(--gold); }
    .au-links { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 8px; font-size: 11.5px; }
    .au-links a { color: var(--gold-soft); text-decoration: underline; }
    .au-note { margin: 0 0 12px; font-size: 13px; color: var(--muted); line-height: 1.5; text-align: center; }
    .au-otp { text-align: center; letter-spacing: 6px; font-size: 20px; font-weight: 700; }
    .au-forgot { display: block; margin: 2px 0 4px auto; background: transparent; color: var(--gold-soft); font-size: 12px; padding: 4px; }
    .au-row-between { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 2px 0 4px; }
    .au-remember { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--muted); cursor: pointer; }
    .au-remember input { width: 15px; height: 15px; accent-color: var(--gold); }
    .au-row-between .au-forgot { margin: 0; }
    .au-pw { position: relative; margin-bottom: 10px; }
    .au-pw .au-in { margin-bottom: 0; padding-inline-end: 46px; }
    .au-eye { position: absolute; inset-inline-end: 6px; top: 50%; transform: translateY(-50%);
      background: transparent; border: none; cursor: pointer; font-size: 17px; line-height: 1; padding: 6px; color: var(--muted-2); }
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
    .fav-back { position: fixed; inset: 0; z-index: 1100; background: rgba(0,0,0,0.6); backdrop-filter: blur(3px); }
    .fav-modal { position: fixed; z-index: 1101; inset-inline: 16px; top: 50%; transform: translateY(-50%);
      margin: 0 auto; max-width: 460px; max-height: 80vh; overflow-y: auto; padding: 18px 16px; }
    .fav-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .fav-mt { margin: 0; font-size: 18px; }
    .fav-x { width: 34px; height: 34px; border-radius: 50%; font-size: 15px; color: var(--muted);
      background: var(--surface-2); border: 1px solid var(--line); }
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
    .row-badge { min-width: 20px; height: 20px; line-height: 20px; padding: 0 6px; border-radius: 10px;
      background: #d13a4a; color: #fff; font-size: 12px; font-weight: 800; text-align: center; margin-inline-start: auto; }
    .row-badge + .ch { margin-inline-start: 8px; }
  `],
})
export class ProfileComponent implements OnInit, OnDestroy {
  private supportPollId: ReturnType<typeof setInterval> | null = null;
  readonly i18n = inject(I18nService);
  readonly fav = inject(FavoritesService);
  readonly plan = inject(PlanService);
  readonly quota = inject(ImageQuotaService);
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  readonly locales = LOCALES;

  // Yardım / Destek penceresi
  readonly supportOpen = signal<boolean>(false);
  readonly supportMsg = signal<string>('');
  readonly supportEmail = signal<string>('');
  readonly supportBusy = signal<boolean>(false);
  readonly supportErr = signal<string | null>(null);
  readonly supportSent = signal<boolean>(false);
  readonly myTickets = signal<MyTicket[]>([]);
  /** Kullanıcının henüz görmediği admin yanıtı sayısı (menüde rozet). */
  readonly supportUnread = signal<number>(0);
  private readonly SEEN_KEY = 'ngnail-sup-seen';

  openSupport(): void {
    this.supportMsg.set(''); this.supportEmail.set(this.auth.user()?.email ?? '');
    this.supportErr.set(null); this.supportSent.set(false); this.supportBusy.set(false);
    this.myTickets.set([]);
    this.supportOpen.set(true);
    void this.loadMyTickets(true);   // açınca: yanıtları "görüldü" işaretle
  }
  private lastSeen(): number { try { return Number(localStorage.getItem(this.SEEN_KEY) || 0); } catch { return 0; } }
  private markSeen(tickets: MyTicket[]): void {
    const max = tickets.reduce((m, t) => Math.max(m, t.repliedAt || 0), 0);
    try { if (max) localStorage.setItem(this.SEEN_KEY, String(max)); } catch { /* geç */ }
    this.supportUnread.set(0);
  }
  private async loadMyTickets(markRead = false): Promise<void> {
    if (!this.auth.loggedIn()) { this.supportUnread.set(0); return; }
    try {
      const res = await firstValueFrom(this.http.get<{ success: boolean; tickets: MyTicket[] }>('/api/support/mine').pipe(timeout(9000)));
      if (res?.success) {
        const tickets = res.tickets ?? [];
        this.myTickets.set(tickets);
        if (markRead) { this.markSeen(tickets); }
        else {
          const seen = this.lastSeen();
          const unread = tickets.filter((t) => t.status === 'replied' && (t.repliedAt || 0) > seen).length;
          this.supportUnread.set(unread);
        }
      }
    } catch { /* sessiz */ }
  }
  newSupportMsg(): void { this.supportSent.set(false); this.supportMsg.set(''); this.supportErr.set(null); }
  async sendSupport(): Promise<void> {
    this.supportErr.set(null);
    const msg = this.supportMsg().trim();
    if (msg.length < 3) { this.supportErr.set(this.i18n.t('auth_fill')); return; }
    this.supportBusy.set(true);
    try {
      await firstValueFrom(this.http.post('/api/support', { message: msg, email: this.supportEmail().trim() }).pipe(timeout(9000)));
      this.supportSent.set(true);
      void this.loadMyTickets();
    } catch {
      this.supportErr.set('Sunucuya ulaşılamadı (backend kapalı olabilir)');
    } finally { this.supportBusy.set(false); }
  }

  /** Menü satırına tıklanınca ilgili yere gider (butonların adı/sırası değişmedi). */
  go(key: string): void {
    switch (key) {
      case 'subscription': void this.router.navigate(['/shop']); break;
      case 'tryon_hist': void this.router.navigate(['/ar']); break;
      case 'my_fav': this.favOpen.set(true); break;
      case 'settings': this.openSettings(); break;
      case 'help': this.openSupport(); break;
      case 'legal': void this.router.navigate(['/legal']); break;
      case 'logout': if (this.auth.loggedIn()) this.auth.logout(); else this.openAuth('login'); break;
    }
  }

  readonly favOpen = signal<boolean>(false);

  // Ayarlar penceresi durumu (şifre değiştir + hesabı sil)
  readonly settingsOpen = signal<boolean>(false);
  readonly settingsStep = signal<'menu' | 'changepw' | 'delete' | 'deleted' | 'resetcode'>('menu');
  readonly showPw = signal<boolean>(false);
  readonly newPw = signal<string>('');
  readonly newPw2 = signal<string>('');
  readonly setCode = signal<string>('');
  readonly delEmail = signal<string>('');
  readonly delPhone = signal<string>('');
  readonly delCountryDial = signal<string>('+90');   // varsayılan Türkiye (kayıttaki ile aynı)
  readonly delPw = signal<string>('');
  readonly setErr = signal<string | null>(null);
  readonly setInfo = signal<string | null>(null);
  readonly setBusy = signal<boolean>(false);
  readonly newPwOk = computed(() => validPassword(this.newPw()));

  private openSettings(): void {
    this.settingsStep.set('menu');
    this.setErr.set(null); this.setInfo.set(null);
    this.newPw.set(''); this.newPw2.set(''); this.delEmail.set(''); this.delPhone.set(''); this.delCountryDial.set('+90'); this.delPw.set(''); this.setCode.set('');
    this.settingsOpen.set(true);
  }
  settingsGo(s: 'menu' | 'changepw' | 'delete'): void {
    this.settingsStep.set(s); this.setErr.set(null); this.setInfo.set(null);
  }

  async changePw(): Promise<void> {
    this.setErr.set(null); this.setInfo.set(null);
    if (!this.newPwOk()) { this.setErr.set(this.i18n.t('auth_pw_rule')); return; }
    if (this.newPw() !== this.newPw2()) { this.setErr.set(this.i18n.t('set_pw_mismatch')); return; }
    this.setBusy.set(true);
    const res = await this.auth.changePassword(this.newPw());
    this.setBusy.set(false);
    if (res.ok) { this.setInfo.set(this.i18n.t('set_pw_changed')); this.newPw.set(''); this.newPw2.set(''); }
    else this.setErr.set(res.error ?? 'Hata');
  }

  /** Ayarlardan şifremi unuttum → e-postaya KOD gönder, kod+yeni şifre adımına geç. */
  async forgotFromSettings(): Promise<void> {
    const email = this.auth.user()?.email;
    if (!email) { this.setErr.set(this.i18n.t('auth_fill')); return; }
    this.setErr.set(null); this.setInfo.set(null); this.setBusy.set(true);
    const res = await this.auth.forgot(email);
    this.setBusy.set(false);
    if (!res.ok) { this.setErr.set(res.error ?? 'Hata'); return; }
    this.setCode.set(''); this.newPw.set('');
    this.settingsStep.set('resetcode');
    this.setInfo.set(res.demoOtp ? `${this.i18n.t('auth_demo_otp')}: ${res.demoOtp}` : this.i18n.t('auth_link_sent'));
  }

  /** Ayarlardan gelen kod + yeni şifre ile sıfırla. */
  async resetPwFromSettings(): Promise<void> {
    const email = this.auth.user()?.email;
    if (!email) { this.setErr.set(this.i18n.t('auth_fill')); return; }
    this.setErr.set(null);
    if (this.setCode().trim().length < 4) { this.setErr.set(this.i18n.t('auth_fill')); return; }
    if (!this.newPwOk()) { this.setErr.set(this.i18n.t('auth_pw_rule')); return; }
    this.setBusy.set(true);
    const res = await this.auth.reset(email, this.setCode().trim(), this.newPw());
    this.setBusy.set(false);
    if (res.ok) { this.setInfo.set(this.i18n.t('auth_reset_done')); this.setCode.set(''); this.newPw.set(''); this.settingsStep.set('menu'); }
    else this.setErr.set(res.error ?? 'Hata');
  }

  async deleteAcc(): Promise<void> {
    this.setErr.set(null);
    if (!this.delEmail().trim() || !this.delPhone().trim() || !this.delPw()) { this.setErr.set(this.i18n.t('auth_fill_all')); return; }
    this.setBusy.set(true);
    // Ülke kodu + yerel numara (baştaki 0'lar atılır) → kayıttaki ile aynı tam numara
    const localNum = this.delPhone().replace(/\D/g, '').replace(/^0+/, '');
    const fullPhone = this.delCountryDial() + localNum;
    const res = await this.auth.deleteAccount(this.delEmail().trim().toLowerCase(), fullPhone, this.delPw());
    this.setBusy.set(false);
    if (res.ok) {
      // Silme e-posta ile onaylanır — hemen silinmez, onay linki gönderildi.
      this.setErr.set(null);
      this.setInfo.set(res.demoLink ? `${this.i18n.t('set_del_email')} · ${this.i18n.t('auth_demo_link')}: ${res.demoLink}` : this.i18n.t('set_del_email'));
    } else this.setErr.set(res.error ?? 'Hata');
  }

  /** E-postadaki silme linkiyle (/profile?delete=TOKEN) hesabı kalıcı sil. */
  private async confirmDeleteFlow(token: string): Promise<void> {
    const res = await this.auth.confirmDelete(token);
    this.settingsOpen.set(true);
    if (res.ok) { this.settingsStep.set('deleted'); this.setErr.set(null); }
    else { this.settingsStep.set('menu'); this.setErr.set(res.error ?? 'Hata'); }
  }

  // Giriş/kayıt penceresi durumu
  readonly authOpen = signal<boolean>(false);
  readonly authStep = signal<'login' | 'register' | 'otp' | 'forgot' | 'reset'>('login');
  readonly firstName = signal<string>('');
  readonly lastName = signal<string>('');
  readonly email = signal<string>('');
  readonly phone = signal<string>('');
  // Türkiye + Azerbaycan üstte sabit, geri kalan alfabetik
  readonly countries = (() => {
    const pin = ['TR', 'AZ'];
    const top = COUNTRIES.filter((c) => pin.includes(c.iso)).sort((a, b) => pin.indexOf(a.iso) - pin.indexOf(b.iso));
    const rest = COUNTRIES.filter((c) => !pin.includes(c.iso)).sort((a, b) => a.name.localeCompare(b.name));
    return [...top, ...rest];
  })();
  readonly countryDial = signal<string>('+90');   // varsayılan Türkiye
  readonly agree = signal<boolean>(false);         // kayıtta yasal onay
  readonly password = signal<string>('');
  readonly remember = signal<boolean>(true);   // "beni hatırla" — varsayılan açık
  readonly otp = signal<string>('');
  readonly demoInfo = signal<string | null>(null);
  readonly authErr = signal<string | null>(null);
  readonly authBusy = signal<boolean>(false);

  readonly pwOk = computed(() => validPassword(this.password()));

  ngOnInit(): void {
    // Hesap silme onay bağlantısı: /profile?delete=TOKEN
    const d = this.route.snapshot.queryParamMap.get('delete');
    if (d) void this.confirmDeleteFlow(d);
    // Admin yanıtı rozeti: yükle + canlı tut (15 sn)
    void this.loadMyTickets();
    this.supportPollId = setInterval(() => { if (!this.supportOpen()) void this.loadMyTickets(); }, 15000);
  }
  ngOnDestroy(): void { if (this.supportPollId) clearInterval(this.supportPollId); }

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
    this.agree.set(false);
    this.authErr.set(null); this.demoInfo.set(null);
  }

  async submitAuth(): Promise<void> {
    this.authErr.set(null);
    const step = this.authStep();
    const email = this.email().trim().toLowerCase();

    if (step === 'login') {
      if (!email || !this.password()) { this.authErr.set(this.i18n.t('auth_fill')); return; }
      await this.run(() => this.auth.login(email, this.password(), this.remember()));
    } else if (step === 'register') {
      if (!this.firstName().trim() || !this.lastName().trim() || !email || !this.phone().trim()) { this.authErr.set(this.i18n.t('auth_fill_all')); return; }
      if (!this.pwOk()) { this.authErr.set(this.i18n.t('auth_pw_rule')); return; }
      if (!this.agree()) { this.authErr.set(this.i18n.t('agree_required')); return; }
      // Ülke kodu + yerel numara (baştaki 0'lar atılır) → tam uluslararası numara
      const localNum = this.phone().replace(/\D/g, '').replace(/^0+/, '');
      await this.run(() => this.auth.register({
        firstName: this.firstName().trim(), lastName: this.lastName().trim(), email,
        phone: this.countryDial() + localNum, password: this.password(),
      }));
    } else if (step === 'otp') {
      if (this.otp().trim().length < 4) { this.authErr.set(this.i18n.t('auth_fill')); return; }
      await this.run(() => this.auth.verifyOtp(email, this.otp().trim(), this.remember()));
    } else if (step === 'forgot') {
      if (!email) { this.authErr.set(this.i18n.t('auth_fill')); return; }
      await this.run(() => this.auth.forgot(email));
    } else if (step === 'reset') {
      if (this.otp().trim().length < 4) { this.authErr.set(this.i18n.t('auth_fill')); return; }
      if (!this.pwOk()) { this.authErr.set(this.i18n.t('auth_pw_rule')); return; }
      await this.run(() => this.auth.reset(email, this.otp().trim(), this.password()));
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
      if (step === 'forgot') {
        // Kod e-postaya gitti → kod + yeni şifre adımına geç
        this.otp.set(''); this.password.set('');
        this.setStep('reset');
        this.demoInfo.set(res.demoOtp ? `${this.i18n.t('auth_demo_otp')}: ${res.demoOtp}` : this.i18n.t('auth_link_sent'));
        return;
      }
      if (step === 'reset') { this.password.set(''); this.otp.set(''); this.setStep('login'); this.demoInfo.set(this.i18n.t('auth_reset_done')); return; }
    } else {
      this.authErr.set(res.error ?? 'Hata');
    }
  }

  async resend(): Promise<void> {
    // Tekrar gönderim E-POSTA ile (ilk kod SMS ile 1 kez gitti).
    const res = await this.auth.resendOtp(this.email().trim().toLowerCase());
    if (res.demoOtp) this.demoInfo.set(`${this.i18n.t('auth_demo_otp')}: ${res.demoOtp}`);
    else if (res.ok) this.demoInfo.set(this.i18n.t('auth_resent_email'));
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
    { icon: '💎', key: 'subscription' },
    { icon: '⚙️', key: 'settings' },
    { icon: '❓', key: 'help' },
    { icon: '📄', key: 'legal' },
    { icon: '🚪', key: 'logout' },
  ];
}
