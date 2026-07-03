import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { Design } from '../core/data.service';
import { I18nService } from '../core/i18n.service';
import { FavoritesService } from '../core/favorites.service';

@Component({
  selector: 'app-design-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="dc" [style.width.px]="width">
      <div class="thumb" [style.background]="design.grad">
        @if (design.img) { <img class="art" [src]="design.img" alt="" loading="lazy" /> }
        @if (design.badge) {
          <span class="badge" [class.badge-gold]="design.badge !== 'new'" [class.badge-new]="design.badge === 'new'">
            {{ label }}
          </span>
        }
        <button class="heart" (click)="toggleFav($event)" [attr.aria-pressed]="fav.has(design.id)">{{ fav.has(design.id) ? '❤️' : '🤍' }}</button>
      </div>
      <div class="meta">
        <p class="nm">{{ design.name }}</p>
        <p class="ar">{{ design.artist }}</p>
        @if (score !== undefined) {
          <span class="match">💎 %{{ score }} {{ i18n.t('match') }}</span>
        }
      </div>
    </article>
  `,
  styles: [`
    .dc { border-radius: 16px; overflow: hidden; background: var(--surface); border: 1px solid var(--line); }
    .thumb { position: relative; aspect-ratio: 3 / 4; }
    .art { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .badge { position: absolute; top: 8px; inset-inline-start: 8px; }
    .heart {
      position: absolute; top: 6px; inset-inline-end: 6px; font-size: 15px;
      width: 28px; height: 28px; border-radius: 50%;
      background: rgba(0,0,0,0.35); backdrop-filter: blur(4px);
    }
    .meta { padding: 9px 10px 11px; }
    .nm { margin: 0; font-size: 13px; font-weight: 600; color: var(--ink); }
    .ar { margin: 2px 0 0; font-size: 11px; color: var(--muted-2); }
    .match { display: inline-block; margin-top: 6px; font-size: 10.5px; font-weight: 700;
      color: var(--gold-soft); background: rgba(212,175,55,0.14);
      border: 1px solid rgba(212,175,55,0.4); border-radius: 999px; padding: 2px 8px; }
  `],
})
export class DesignCardComponent {
  readonly i18n = inject(I18nService);
  readonly fav = inject(FavoritesService);
  @Input({ required: true }) design!: Design;
  @Input() width = 150;
  @Input() score?: number;

  toggleFav(e: Event): void {
    e.stopPropagation();
    this.fav.toggle(this.design.id);
  }

  get label(): string {
    switch (this.design.badge) {
      case 'trending': return '🔥 ' + this.i18n.t('badge_trending');
      case 'new': return '✨ ' + this.i18n.t('badge_new');
      case 'premium': return '💎 ' + this.i18n.t('badge_premium');
      default: return '';
    }
  }
}
