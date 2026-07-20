import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Design } from '../core/data.service';
import { I18nService } from '../core/i18n.service';
import { FavoritesService } from '../core/favorites.service';
import { renderNailThumb } from '../core/nail-art';

@Component({
  selector: 'app-design-card',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="dc" [style.width.px]="width" [routerLink]="['/design', design.id]">
      <div class="thumb" [style.background]="design.grad">
        <!-- Önce STATİK katalog görseli; yoksa/404 ise çizime düş -->
        <img class="art" [src]="imgSrc" (error)="onImgError()" alt="" loading="lazy" />
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
    .dc { border-radius: 16px; overflow: hidden; background: var(--surface); border: 1px solid var(--line);
      cursor: pointer; display: block; transition: transform 0.14s ease; }
    .dc:active { transform: scale(0.97); }
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

  private photoFailed = false;
  /** Yedek çizim — YALNIZCA fotoğraf yüklenemezse, tek bu kart için üretilir. */
  private drawn = '';

  /** Statik katalog görseli varsa onu, yüklenemezse çizim önizlemesini kullan. */
  get imgSrc(): string {
    if (this.design.photo && !this.photoFailed) return this.design.photo;
    // Sunucudan gelen tasarımların hazır img'si olabilir; katalog yedeği ise talep üzerine çizilir.
    return this.design.img ?? this.drawn;
  }

  onImgError(): void {
    // Statik dosya yoksa (404) çizime düş. Çizim SADECE burada, tek sefer üretilir
    // (açılışta toplu üretim yok → donma yok). Hazır img varsa yeniden çizilmez.
    if (this.photoFailed) return;
    this.photoFailed = true;
    if (!this.design.img && !this.drawn) {
      this.drawn = renderNailThumb(this.design.colors, this.design.pattern ?? 'glossy');
    }
  }

  toggleFav(e: Event): void {
    e.stopPropagation();
    this.fav.toggle(this.design);
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
