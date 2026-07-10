import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header.component';
import { DesignCardComponent } from '../../shared/design-card.component';
import { I18nService } from '../../core/i18n.service';
import { DataService, Design } from '../../core/data.service';
import { AnalysisStore } from '../../core/analysis-store';
import { recommend } from '../../core/recommendation';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeaderComponent, DesignCardComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header />
    <div class="page">
      <!-- Hero -->
      <section class="hero card">
        <p class="ov">{{ i18n.t('hero_overline') }}</p>
        <h1 class="ht">{{ i18n.t('hero_title') }}</h1>
        <p class="hs">{{ i18n.t('hero_sub') }}</p>
        <div class="hero-cta">
          <button class="btn-primary" routerLink="/scan">✨ {{ i18n.t('btn_scan') }}</button>
          <button class="btn-ghost" routerLink="/studio">🎨 {{ i18n.t('home_ai_design') }}</button>
        </div>
      </section>

      <!-- Trending -->
      <div class="section-head">
        <h2 class="section-title">{{ i18n.t('trending') }}</h2>
        <a class="section-link" routerLink="/explore">{{ i18n.t('see_all') }}</a>
      </div>
      <div class="rail">
        @for (d of data.trending; track d.id) {
          <app-design-card [design]="d" [width]="150" />
        }
      </div>

      <!-- Seasonal banner -->
      <section class="banner">
        <p class="tag">☀️ {{ i18n.t('summer') }}</p>
        <h3>{{ i18n.t('summer_sub') }}</h3>
        <a class="section-link" routerLink="/explore">{{ i18n.t('see_all') }} →</a>
      </section>

      <!-- AI picks -->
      <div class="section-head">
        <h2 class="section-title">💎 {{ personalized() ? i18n.t('for_you') : i18n.t('ai_picks') }}</h2>
        <a class="section-link" routerLink="/scan">{{ personalized() ? i18n.t('see_all') : i18n.t('btn_scan') }}</a>
      </div>
      <div class="rail">
        @for (m of aiList(); track m.design.id) {
          <app-design-card [design]="m.design" [width]="150" [score]="m.score" />
        }
      </div>
    </div>
  `,
  styles: [`
    .hero { margin-top: 6px; padding: 22px 18px 20px; text-align: center;
      background:
        radial-gradient(120% 100% at 50% 0%, rgba(212,175,55,0.14), transparent 60%),
        linear-gradient(180deg, var(--surface), var(--surface-2)); }
    .ov { margin: 0; font-size: 11px; letter-spacing: 3px; color: var(--gold); font-weight: 700; }
    .ht { margin: 8px 0 8px; font-size: 26px; line-height: 1.15; color: var(--ink); }
    .hs { margin: 0 0 18px; font-size: 13.5px; color: var(--muted); }
    .hero-cta { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
    .banner { margin-top: 22px; padding: 20px; border-radius: var(--radius);
      background: linear-gradient(120deg, #241a2e, #3a2740); border: 1px solid var(--line); }
    .banner .tag { margin: 0; font-size: 12px; color: var(--gold-soft); font-weight: 600; }
    .banner h3 { margin: 6px 0 10px; font-size: 18px; }
    .artist { width: 78px; text-align: center; }
    .av { width: 72px; height: 72px; border-radius: 50%; border: 2px solid rgba(212,175,55,0.5); }
    .an { margin: 7px 0 0; font-size: 12.5px; font-weight: 600; }
    .ar { margin: 1px 0 0; font-size: 10.5px; color: var(--muted-2); }
  `],
})
export class HomeComponent {
  readonly i18n = inject(I18nService);
  readonly data = inject(DataService);
  private readonly store = inject(AnalysisStore);

  readonly personalized = computed(() => this.store.current() !== null);

  /** Analiz varsa kişiselleştirilmiş skorlu seçki, yoksa varsayılan AI seçimleri. */
  readonly aiList = computed<{ design: Design; score: number | undefined }[]>(() => {
    const a = this.store.current();
    if (a) {
      return recommend(a, this.data.explore, new Date().getMonth())
        .slice(0, 8)
        .map((d) => ({ design: d as Design, score: d.matchScore }));
    }
    return this.data.aiPicks.map((d) => ({ design: d, score: undefined }));
  });
}
