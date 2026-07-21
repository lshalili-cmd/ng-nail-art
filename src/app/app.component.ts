import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { BottomNavComponent } from './shared/bottom-nav.component';
import { OnboardingComponent } from './shared/onboarding.component';
import { SplashComponent } from './shared/splash.component';
import { AuthService } from './core/auth.service';
import { SyncService } from './core/sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent, OnboardingComponent, SplashComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />
    <!-- Yönetici paneli (/admin) tam ekrandır. Üye OLMAYANA da kabuk gösterilmez:
         yalnızca üyelik/giriş ekranı (slogan) görünür — alt menü/onboarding gizli. -->
    @if (!adminRoute() && auth.loggedIn()) {
      <app-bottom-nav />
      <app-onboarding />
      <app-splash />
    }
  `,
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly sync = inject(SyncService);
  private readonly router = inject(Router);

  /** Şu an /admin rotasında mıyız — kullanıcı kabuğunu (alt menü vb.) gizlemek için. */
  readonly adminRoute = signal<boolean>(false);

  constructor() {
    this.sync.start();          // cihazlar arası senkron dinleyicileri
    void this.auth.loadMe();    // token varsa kullanıcıyı yükle

    const isAdmin = (url: string): boolean => (url || '').split(/[?#]/)[0].includes('/admin');
    this.adminRoute.set(isAdmin(this.router.url));
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.adminRoute.set(isAdmin((e as NavigationEnd).urlAfterRedirects));
    });
  }
}
