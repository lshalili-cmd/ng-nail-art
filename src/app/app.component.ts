import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from './shared/bottom-nav.component';
import { OnboardingComponent } from './shared/onboarding.component';
import { AuthService } from './core/auth.service';
import { SyncService } from './core/sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent, OnboardingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />
    <app-bottom-nav />
    <app-onboarding />
  `,
})
export class AppComponent {
  private readonly auth = inject(AuthService);
  private readonly sync = inject(SyncService);

  constructor() {
    this.sync.start();          // cihazlar arası senkron dinleyicileri
    void this.auth.loadMe();    // token varsa kullanıcıyı yükle
  }
}
