import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { I18nService, LOCALES, Locale } from '../core/i18n.service';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="hdr">
      <span class="logo">{{ i18n.t('app_name') }}</span>
      <div class="lang">
        <button class="lang-btn" (click)="open.set(!open())" aria-label="language">
          {{ current().flag }} <span class="chev">▾</span>
        </button>
        @if (open()) {
          <div class="lang-drop">
            @for (l of locales; track l.code) {
              <button class="lang-opt" [class.active]="l.code === i18n.locale()" (click)="pick(l.code)">
                <span>{{ l.flag }}</span> <span>{{ l.label }}</span>
              </button>
            }
          </div>
        }
      </div>
    </header>
  `,
  styles: [`
    .hdr {
      position: sticky; top: 0; z-index: 20;
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 18px 12px;
      background: linear-gradient(180deg, rgba(12,10,8,0.96), rgba(12,10,8,0.72));
      backdrop-filter: blur(10px);
    }
    .logo {
      font-family: var(--font-head); font-weight: 700; font-size: 17px;
      background: var(--gold-grad); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
    }
    .lang { position: relative; }
    .lang-btn {
      display: flex; align-items: center; gap: 4px;
      background: var(--surface-2); border: 1px solid var(--line);
      border-radius: 999px; padding: 6px 10px; font-size: 14px; color: var(--ink);
    }
    .chev { font-size: 10px; color: var(--muted); }
    .lang-drop {
      position: absolute; inset-inline-end: 0; top: 42px;
      background: var(--surface-2); border: 1px solid var(--line);
      border-radius: 12px; padding: 6px; min-width: 150px;
      box-shadow: var(--shadow);
    }
    .lang-opt {
      display: flex; align-items: center; gap: 8px; width: 100%;
      padding: 9px 10px; border-radius: 8px; font-size: 13.5px; color: var(--ink);
      text-align: start;
    }
    .lang-opt.active { background: rgba(212,175,55,0.14); color: var(--gold-soft); }
  `],
})
export class HeaderComponent {
  readonly i18n = inject(I18nService);
  readonly locales = LOCALES;
  readonly open = signal(false);

  current() {
    return LOCALES.find((l) => l.code === this.i18n.locale()) ?? LOCALES[0];
  }

  pick(code: Locale): void {
    this.i18n.setLocale(code);
    this.open.set(false);
  }
}
