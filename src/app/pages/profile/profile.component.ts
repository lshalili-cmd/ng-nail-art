import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService, LOCALES } from '../../core/i18n.service';
import { FavoritesService } from '../../core/favorites.service';
import { DesignCardComponent } from '../../shared/design-card.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [DesignCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="phead">
        <div class="av"></div>
        <h1 class="nm">Leman</h1>
        <p class="em">l.shalili&#64;logper.com</p>
      </header>

      <div class="stats">
        <div class="stat card"><span class="n">12</span><span class="l">{{ i18n.t('designs') }}</span></div>
        <div class="stat card"><span class="n">{{ fav.count() }}</span><span class="l">{{ i18n.t('favorites') }}</span></div>
        <div class="stat card"><span class="n">7</span><span class="l">{{ i18n.t('tryons') }}</span></div>
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
    .av { width: 88px; height: 88px; border-radius: 50%; margin: 0 auto;
      background: var(--gold-grad); border: 3px solid rgba(212,175,55,0.5); }
    .nm { margin: 12px 0 2px; font-size: 22px; }
    .em { margin: 0; font-size: 12.5px; color: var(--muted-2); }
    .stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin: 18px 0; }
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
  readonly locales = LOCALES;

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
