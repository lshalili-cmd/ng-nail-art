import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { I18nService } from '../core/i18n.service';

/**
 * Açılış (splash) ekranı — uygulama açılınca tam ekran gelir,
 * ~3 sn sonra veya dokununca kapanır ve uygulamayı açar.
 */
@Component({
  selector: 'app-splash',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div class="splash" [class.leaving]="leaving()" (click)="skip()">
        <div class="rays"></div>
        <div class="sparkles">
          @for (s of sparkles; track $index) {
            <span class="sp" [style.left.%]="s.x" [style.top.%]="s.y" [style.font-size.px]="s.s" [style.animation-delay.s]="s.d">✦</span>
          }
        </div>

        <div class="emblem">
          <svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="spg" x1="0" y1="0" x2="0.3" y2="1">
                <stop offset="0" stop-color="#fbeaa8"/><stop offset="0.5" stop-color="#d9b141"/><stop offset="1" stop-color="#a5791f"/>
              </linearGradient>
            </defs>
            <path d="M64 26 L136 26 L162 54 L100 128 L38 54 Z" fill="url(#spg)"/>
            <g stroke="#8a6410" stroke-width="1.4" fill="none" opacity=".55" stroke-linejoin="round">
              <path d="M38 54 L162 54"/><path d="M64 26 L84 54 L100 128"/><path d="M136 26 L116 54 L100 128"/><path d="M84 54 L116 54"/>
            </g>
            <path d="M74 38 l3.2 8.6 8.6 3.2 -8.6 3.2 -3.2 8.6 -3.2 -8.6 -8.6 -3.2 8.6 -3.2 z" fill="#fff8e7"/>
            <path d="M78 150 C82 138 118 138 122 150 C140 182 128 246 100 262 C72 246 60 182 78 150 Z" fill="url(#spg)"/>
            <ellipse cx="88" cy="188" rx="7" ry="34" fill="#fff8e7" opacity=".5" transform="rotate(-10 88 188)"/>
          </svg>
        </div>

        <div class="deco">
          <svg viewBox="0 0 200 16" width="200" height="16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M0 2 L12 14 L24 2 L36 14 L48 2 L60 14 L72 2 L84 14 L96 2 L104 10 L112 2 L124 14 L136 2 L148 14 L160 2 L172 14 L184 2 L196 14"
              fill="none" stroke="#a9832b" stroke-width="2"/>
          </svg>
        </div>

        <div class="brand">
          <div class="kicker">NAIL ART AI</div>
          <div class="name">miracle</div>
          <div class="tag">◇&nbsp;&nbsp;{{ i18n.t('splash_slogan') }}&nbsp;&nbsp;◇</div>
        </div>

        <div class="divider"><span class="ln"></span>◇<span class="ln r"></span></div>
        <div class="hint">{{ i18n.t('splash_hint') }}</div>
      </div>
    }
  `,
  styles: [`
    .splash{position:fixed;inset:0;z-index:9999;overflow:hidden;
      background:radial-gradient(120% 80% at 50% 30%,#141009,#000 70%);
      display:flex;flex-direction:column;align-items:center;animation:sp-in .6s ease both}
    .splash.leaving{opacity:0;transition:opacity .45s ease;pointer-events:none}
    @keyframes sp-in{from{opacity:0}to{opacity:1}}

    .rays{position:absolute;inset:0;
      background:repeating-conic-gradient(from 0deg at 50% 34%,
        rgba(212,175,55,0) 0deg 3.4deg, rgba(212,175,55,.32) 3.4deg 3.9deg);
      -webkit-mask:radial-gradient(circle at 50% 34%, transparent 92px, #000 128px, #000 46%, transparent 66%);
              mask:radial-gradient(circle at 50% 34%, transparent 92px, #000 128px, #000 46%, transparent 66%);
      animation:sp-rays 1s ease both}
    @keyframes sp-rays{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}

    .sparkles{position:absolute;inset:0;pointer-events:none;z-index:2}
    .sp{position:absolute;color:#f3e0a0;line-height:1;text-shadow:0 0 8px rgba(212,175,55,.85);opacity:0;
      animation:sp-tw 2.6s ease-in-out infinite}
    @keyframes sp-tw{0%,100%{opacity:0;transform:scale(.3)}50%{opacity:1;transform:scale(1)}}

    .emblem{position:absolute;top:34%;left:50%;transform:translate(-50%,-50%);
      width:min(66vw,250px);aspect-ratio:1;border:1.5px solid rgba(212,175,55,.85);border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      background:radial-gradient(circle,rgba(20,15,8,.6),transparent 72%);animation:sp-pop .8s cubic-bezier(.2,1.2,.4,1) both}
    .emblem svg{width:68%;height:80%}
    @keyframes sp-pop{from{opacity:0;transform:translate(-50%,-50%) scale(.7)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}

    .deco{position:absolute;top:calc(34% + min(33vw,165px));left:50%;transform:translateX(-50%);width:min(52vw,200px)}
    .deco svg{width:100%;height:auto;display:block}

    .brand{position:absolute;top:57%;left:0;right:0;text-align:center;padding:0 16px}
    .kicker{letter-spacing:.5em;font-size:14px;color:#b89a52;text-indent:.5em;margin-bottom:16px}
    .name{font-family:Georgia,"Times New Roman",serif;font-size:clamp(58px,20vw,82px);line-height:1;
      background:linear-gradient(180deg,#fbe6a8,#d4af37 55%,#a97e22);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
    .tag{font-family:Georgia,serif;font-style:italic;font-size:19px;color:#d9b45a;margin-top:14px;letter-spacing:.04em}

    .divider{position:absolute;bottom:64px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;color:#a9832b;font-size:13px}
    .divider .ln{width:64px;height:1px;background:linear-gradient(90deg,transparent,#a9832b)}
    .divider .ln.r{background:linear-gradient(90deg,#a9832b,transparent)}
    .hint{position:absolute;bottom:30px;left:0;right:0;text-align:center;color:#6b5a30;font-size:12px;letter-spacing:.2em;animation:sp-blink 1.6s ease-in-out infinite}
    @keyframes sp-blink{0%,100%{opacity:.5}50%{opacity:1}}
  `],
})
export class SplashComponent {
  readonly i18n = inject(I18nService);
  readonly visible = signal(false);
  readonly leaving = signal(false);
  private done = false;

  // Sabit dağıtılmış parıltılar (twinkle)
  readonly sparkles = [
    { x: 15, y: 12, s: 13, d: 0 }, { x: 82, y: 17, s: 17, d: .6 }, { x: 28, y: 26, s: 9, d: 1.2 },
    { x: 70, y: 30, s: 12, d: .3 }, { x: 50, y: 8, s: 15, d: .9 }, { x: 88, y: 45, s: 10, d: 1.5 },
    { x: 12, y: 41, s: 13, d: .4 }, { x: 35, y: 64, s: 11, d: 1.1 }, { x: 78, y: 68, s: 16, d: .2 },
    { x: 20, y: 77, s: 9, d: 1.8 }, { x: 61, y: 83, s: 13, d: .7 }, { x: 90, y: 80, s: 10, d: 1.3 },
    { x: 8, y: 60, s: 11, d: 2.0 }, { x: 46, y: 90, s: 12, d: 1.6 },
  ];

  constructor() {
    let seen = false;
    try { seen = localStorage.getItem('ngnail-splash-seen') === '1'; } catch { /* geç */ }
    if (seen) return;                              // sadece ilk açılışta göster
    try { localStorage.setItem('ngnail-splash-seen', '1'); } catch { /* geç */ }
    this.visible.set(true);
    setTimeout(() => this.skip(), 3000);
  }
  skip(): void {
    if (this.done) return;
    this.done = true;
    this.leaving.set(true);
    setTimeout(() => this.visible.set(false), 450);
  }
}
