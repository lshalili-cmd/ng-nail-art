import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { I18nService } from '../core/i18n.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="nav">
      @for (item of items; track item.path) {
        <a class="item" [routerLink]="item.path" routerLinkActive="active"
           [routerLinkActiveOptions]="{ exact: item.path === '/' }">
          <span class="ic">{{ item.icon }}</span>
          <span class="lb">{{ i18n.t(item.key) }}</span>
        </a>
      }
    </nav>
  `,
  styles: [`
    .nav {
      position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
      width: 100%; max-width: var(--max-w);
      height: var(--nav-h);
      display: grid; grid-template-columns: repeat(6, 1fr);
      background: linear-gradient(180deg, rgba(20,16,25,0.86), rgba(12,10,8,0.98));
      backdrop-filter: blur(14px);
      border-top: 1px solid var(--line);
      padding-bottom: env(safe-area-inset-bottom);
      z-index: 30;
    }
    .item {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 3px; color: var(--muted-2); font-size: 9.5px; font-weight: 600;
      transition: color 0.15s ease;
    }
    .ic { font-size: 19px; filter: grayscale(0.4) opacity(0.7); transition: filter 0.15s ease, transform 0.15s ease; }
    .item.active { color: var(--gold-soft); }
    .item.active .ic { filter: none; transform: translateY(-1px); }
  `],
})
export class BottomNavComponent {
  readonly i18n = inject(I18nService);
  readonly items = [
    { path: '/', icon: '🏠', key: 'nav_home' },
    { path: '/explore', icon: '🔍', key: 'nav_explore' },
    { path: '/scan', icon: '🤚', key: 'nav_scan' },
    { path: '/studio', icon: '🎨', key: 'nav_studio' },
    { path: '/shop', icon: '🛍️', key: 'nav_shop' },
    { path: '/profile', icon: '👤', key: 'nav_profile' },
  ];
}
