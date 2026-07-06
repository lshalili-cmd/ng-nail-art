import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { I18nService } from '../core/i18n.service';

interface Slide { icon: string; tKey: string; dKey: string; }

/**
 * İlk açılış tanıtım akışı (satış hunisi: tara → öneri → AR → premium).
 * Yalnızca ilk kez gösterilir; localStorage 'ngnail-onboarded' ile bir daha çıkmaz.
 */
@Component({
  selector: 'app-onboarding',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div class="ob">
        <button class="skip" (click)="finish(false)">{{ i18n.t('ob_skip') }}</button>

        <div class="slide">
          <div class="icon">{{ slide().icon }}</div>
          <h2 class="t">{{ i18n.t(slide().tKey) }}</h2>
          <p class="d">{{ i18n.t(slide().dKey) }}</p>
        </div>

        <div class="dots">
          @for (s of slides; track $index) {
            <span class="dot" [class.on]="$index === index()"></span>
          }
        </div>

        <button class="btn-primary next" (click)="next()">
          {{ isLast() ? i18n.t('ob_start') : i18n.t('ob_next') }}
        </button>
      </div>
    }
  `,
  styles: [`
    .ob { position: fixed; inset: 0; z-index: 1000; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 26px; padding: 32px 26px;
      background: radial-gradient(circle at 50% 30%, rgba(212,175,55,0.14), var(--bg) 62%); }
    .skip { position: absolute; top: 18px; inset-inline-end: 18px; font-size: 13px; color: var(--muted-2);
      background: transparent; padding: 6px 10px; }
    .slide { text-align: center; max-width: 340px; }
    .icon { font-size: 76px; line-height: 1; margin-bottom: 22px;
      filter: drop-shadow(0 6px 20px rgba(212,175,55,0.35)); }
    .t { font-size: 26px; margin: 0 0 12px; font-family: var(--font-head); }
    .d { font-size: 15px; line-height: 1.6; color: var(--muted); margin: 0; }
    .dots { display: flex; gap: 8px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--surface-3);
      border: 1px solid var(--line); transition: all .2s; }
    .dot.on { background: var(--gold-grad); width: 22px; border-radius: 999px; border-color: transparent; }
    .next { width: 100%; max-width: 340px; }
  `],
})
export class OnboardingComponent {
  readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly KEY = 'ngnail-onboarded';

  readonly visible = signal<boolean>(this.shouldShow());
  readonly index = signal<number>(0);

  readonly slides: Slide[] = [
    { icon: '🤚', tKey: 'ob1_t', dKey: 'ob1_d' },
    { icon: '💎', tKey: 'ob2_t', dKey: 'ob2_d' },
    { icon: '📱', tKey: 'ob3_t', dKey: 'ob3_d' },
    { icon: '👑', tKey: 'ob4_t', dKey: 'ob4_d' },
  ];

  readonly slide = computed(() => this.slides[this.index()]);
  readonly isLast = computed(() => this.index() === this.slides.length - 1);

  next(): void {
    if (this.isLast()) {
      this.finish(true);
    } else {
      this.index.update((i) => i + 1);
    }
  }

  /** Tanıtımı kapatır; start=true ise Tara ekranına yönlendirir. */
  finish(start: boolean): void {
    try { localStorage.setItem(this.KEY, '1'); } catch { /* yoksa geç */ }
    this.visible.set(false);
    if (start) void this.router.navigate(['/scan']);
  }

  private shouldShow(): boolean {
    try { return localStorage.getItem(this.KEY) !== '1'; } catch { return false; }
  }
}
