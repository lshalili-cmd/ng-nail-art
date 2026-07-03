import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HeaderComponent } from '../../shared/header.component';
import { DesignCardComponent } from '../../shared/design-card.component';
import { I18nService } from '../../core/i18n.service';
import { DataService } from '../../core/data.service';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [HeaderComponent, DesignCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header />
    <div class="page">
      <div class="section-head"><h2 class="section-title">{{ i18n.t('explore_title') }}</h2></div>

      <div class="search">
        <span>🔍</span>
        <input [value]="query()" (input)="onSearch($event)" [placeholder]="i18n.t('search_ph')" />
      </div>

      <div class="pills">
        @for (c of cats; track c.key) {
          <button class="pill" [class.on]="active() === c.key" (click)="active.set(c.key)">
            {{ i18n.t(c.label) }}
          </button>
        }
      </div>

      <div class="grid">
        @for (d of filtered(); track d.id) {
          <app-design-card [design]="d" [width]="0" />
        } @empty {
          <p class="empty">Sonuç yok.</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .search {
      display: flex; align-items: center; gap: 8px;
      background: var(--surface-2); border: 1px solid var(--line);
      border-radius: 999px; padding: 11px 16px; margin-bottom: 14px;
    }
    .search input { flex: 1; background: none; border: none; outline: none; color: var(--ink); font-size: 14px; }
    .search input::placeholder { color: var(--muted-2); }
    .pills { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 14px; scrollbar-width: none; }
    .pills::-webkit-scrollbar { display: none; }
    .pill {
      flex: 0 0 auto; padding: 8px 15px; border-radius: 999px; font-size: 13px; font-weight: 600;
      background: var(--surface-2); border: 1px solid var(--line); color: var(--muted);
    }
    .pill.on { background: var(--gold-grad); color: #1a1206; border-color: transparent; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .grid ::ng-deep .dc { width: 100% !important; }
    .empty { grid-column: 1 / -1; text-align: center; color: var(--muted-2); padding: 30px 0; }
  `],
})
export class ExploreComponent {
  readonly i18n = inject(I18nService);
  readonly data = inject(DataService);

  readonly cats = [
    { key: 'all', label: 'cat_all' },
    { key: 'luxury', label: 'cat_luxury' },
    { key: 'bridal', label: 'cat_bridal' },
    { key: 'minimal', label: 'cat_minimal' },
    { key: 'trendy', label: 'cat_trendy' },
  ];

  readonly active = signal<string>('all');
  readonly query = signal<string>('');

  readonly filtered = computed(() => {
    const cat = this.active();
    const q = this.query().trim().toLowerCase();
    return this.data.explore.filter((d) => {
      const catOk = cat === 'all' || d.category === cat;
      const qOk = !q || d.name.toLowerCase().includes(q) || d.artist.toLowerCase().includes(q);
      return catOk && qOk;
    });
  });

  onSearch(e: Event): void {
    this.query.set((e.target as HTMLInputElement).value);
  }
}
