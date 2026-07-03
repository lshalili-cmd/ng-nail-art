import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header.component';
import { I18nService } from '../../core/i18n.service';
import { DataService, Design } from '../../core/data.service';
import { FavoritesService } from '../../core/favorites.service';

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
            @if (d.img) { <img [src]="d.img" alt="" /> }
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

            <div class="actions">
              <button class="btn-primary" routerLink="/ar">📱 {{ i18n.t('try_on') }}</button>
              <button class="btn-ghost" (click)="toggleFav()">
                {{ fav.has(d.id) ? ('❤️ ' + i18n.t('my_fav')) : ('🤍 ' + i18n.t('my_fav')) }}
              </button>
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
  private readonly data = inject(DataService);
  readonly fav = inject(FavoritesService);
  readonly i18n = inject(I18nService);

  private readonly id = Number(this.route.snapshot.paramMap.get('id'));

  readonly design = computed<Design | null>(() =>
    this.data.explore.find((d) => d.id === this.id)
      ?? this.fav.items().find((d) => d.id === this.id)
      ?? null,
  );

  toggleFav(): void {
    const d = this.design();
    if (d) this.fav.toggle(d);
  }
}
