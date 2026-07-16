import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header.component';
import { I18nService } from '../../core/i18n.service';
import { DataService, Design } from '../../core/data.service';
import { FavoritesService } from '../../core/favorites.service';
import { colorToHex } from '../../core/nail-art';
import { downloadImage, shareImage } from '../../core/share';
import { TryonStore } from '../../core/tryon-store';

@Component({
  selector: 'app-design-detail',
  standalone: true,
  imports: [HeaderComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header />
    <div class="page">
      @if (design(); as d) {
        <div class="detail card">
          <div class="hero" [style.background]="d.grad">
            <!-- Önce STATİK galeri görseli; yoksa/404 ise çizime düş -->
            <img [src]="heroSrc(d)" (error)="heroFailed.set(true)" alt="" />
            <button class="heart" (click)="toggleFav()" [attr.aria-pressed]="fav.has(d.id)">
              {{ fav.has(d.id) ? '❤️' : '🤍' }}
            </button>
          </div>
          <div class="body">
            <h1 class="name">{{ d.name }}</h1>
            <p class="artist">{{ d.artist }}</p>

            @if (d.colors.length) {
              <p class="lbl">{{ i18n.t('studio_colors') }}</p>
              <div class="chips">
                @for (c of d.colors; track c) { <span class="chip">{{ c }}</span> }
              </div>
            }

            <div class="attrs">
              <div class="attr"><span class="k">{{ i18n.t('studio_shape') }}</span><span class="v">{{ d.shapes[0] || '—' }}</span></div>
              <div class="attr"><span class="k">{{ i18n.t('studio_finish') }}</span><span class="v">{{ d.pattern || '—' }}</span></div>
            </div>

          </div>
        </div>
      } @else {
        <p class="empty">{{ i18n.t('not_found') }}</p>
      }

      <button class="btn-ghost back" routerLink="/explore">← {{ i18n.t('back') }}</button>
    </div>
  `,
  styles: [`
    .detail { overflow: hidden; margin-top: 6px; }
    .hero { position: relative; aspect-ratio: 4 / 3; }
    .hero img { width: 100%; height: 100%; object-fit: cover; }
    .heart { position: absolute; top: 12px; inset-inline-end: 12px; font-size: 20px;
      width: 42px; height: 42px; border-radius: 50%; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); }
    .body { padding: 18px 16px; }
    .name { font-size: 24px; margin: 0; }
    .artist { margin: 4px 0 14px; font-size: 13px; color: var(--muted-2); }
    .lbl { font-size: 11px; color: var(--muted-2); margin: 12px 0 6px; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip { font-size: 12px; padding: 4px 10px; border-radius: 999px; text-transform: capitalize;
      background: var(--surface-3); border: 1px solid var(--line); color: var(--muted); }
    .attrs { display: flex; gap: 10px; margin: 14px 0 4px; }
    .attr { flex: 1; background: var(--surface-2); border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; }
    .attr .k { display: block; font-size: 11px; color: var(--muted-2); }
    .attr .v { font-size: 14px; font-weight: 600; color: var(--ink); text-transform: capitalize; }
    .actions { display: flex; gap: 10px; margin-top: 18px; }
    .actions > * { flex: 1; }
    .empty { text-align: center; color: var(--muted-2); padding: 40px 0; }
    .back { width: 100%; margin-top: 16px; }
  `],
})
export class DesignDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = inject(DataService);
  readonly fav = inject(FavoritesService);
  readonly i18n = inject(I18nService);
  private readonly tryon = inject(TryonStore);

  private readonly id = Number(this.route.snapshot.paramMap.get('id'));

  readonly design = computed<Design | null>(() =>
    this.data.explore.find((d) => d.id === this.id)
      ?? this.fav.items().find((d) => d.id === this.id)
      ?? null,
  );

  readonly heroFailed = signal<boolean>(false);
  /** Statik galeri görseli varsa onu, yüklenemezse çizim önizlemesini kullan. */
  heroSrc(d: Design): string {
    if (d.photo && !this.heroFailed()) return d.photo;
    return d.img ?? '';
  }

  toggleFav(): void {
    const d = this.design();
    if (d) this.fav.toggle(d);
  }

  /** GERÇEK galeri görselini AR'a taşıyarak dene (prosedürel şablon değil). */
  tryAr(d: Design): void {
    const color = colorToHex(d.colors[0] ?? 'gold');
    const pattern = d.pattern ?? 'glossy';
    const shape = d.shapes?.[0] || 'oval';   // tasarımın tırnak şekli → AR doğru çizsin
    this.tryon.set({ imageUrl: this.heroSrc(d), color, pattern, shape });
    void this.router.navigate(['/ar'], { queryParams: { color, pattern, shape } });
  }

  download(d: Design): void {
    const src = this.heroSrc(d);
    if (src) downloadImage(src, (d.name || 'design') + '.jpg');
  }

  async share(d: Design): Promise<void> {
    const src = this.heroSrc(d);
    if (!src) return;
    const name = (d.name || 'design') + '.jpg';
    const ok = await shareImage(src, name, d.name);
    if (!ok) downloadImage(src, name);
  }
}
