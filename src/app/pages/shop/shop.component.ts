import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HeaderComponent } from '../../shared/header.component';
import { DesignCardComponent } from '../../shared/design-card.component';
import { I18nService } from '../../core/i18n.service';
import { DataService } from '../../core/data.service';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [HeaderComponent, DesignCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header />
    <div class="page">
      <div class="section-head"><h2 class="section-title">{{ i18n.t('shop_title') }}</h2></div>

      <section class="feat card">
        <p class="tag">✦ {{ i18n.t('artist_market') }}</p>
        <h3>{{ i18n.t('artist_market_sub') }}</h3>
      </section>

      <div class="section-head">
        <h2 class="section-title">{{ i18n.t('feat_artists') }}</h2>
        <span class="section-link">{{ i18n.t('see_all') }}</span>
      </div>
      <div class="rail">
        @for (a of data.artists; track a.id) {
          <div class="artist">
            <div class="av" [style.background]="a.grad"></div>
            <p class="an">{{ a.name }}</p>
            <p class="ar">{{ a.role }}</p>
          </div>
        }
      </div>

      <div class="section-head">
        <h2 class="section-title">💎 {{ i18n.t('prem_col') }}</h2>
        <span class="section-link">{{ i18n.t('see_all') }}</span>
      </div>
      <div class="grid">
        @for (d of data.explore; track d.id) {
          <app-design-card [design]="d" [width]="0" />
        }
      </div>
    </div>
  `,
  styles: [`
    .feat { padding: 22px 18px; margin-bottom: 6px;
      background: linear-gradient(120deg, #2a1f18, #3d2c1a); }
    .feat .tag { margin: 0; font-size: 12px; color: var(--gold-soft); font-weight: 700; letter-spacing: 1px; }
    .feat h3 { margin: 8px 0 0; font-size: 18px; }
    .artist { width: 78px; text-align: center; }
    .av { width: 72px; height: 72px; border-radius: 50%; border: 2px solid rgba(212,175,55,0.5); }
    .an { margin: 7px 0 0; font-size: 12.5px; font-weight: 600; }
    .ar { margin: 1px 0 0; font-size: 10.5px; color: var(--muted-2); }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .grid ::ng-deep .dc { width: 100% !important; }
  `],
})
export class ShopComponent {
  readonly i18n = inject(I18nService);
  readonly data = inject(DataService);
}
