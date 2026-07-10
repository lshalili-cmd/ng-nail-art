import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { I18nService } from '../../core/i18n.service';
import { LegalDoc, legalText } from '../../core/legal.content';

@Component({
  selector: 'app-legal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="lhead">
        <button class="back" (click)="goBack()" aria-label="Geri">‹</button>
        <h1 class="lt">{{ i18n.locale() === 'tr' ? 'Yasal' : 'Legal' }}</h1>
      </header>

      <div class="tabs">
        @for (d of docs; track d) {
          <button class="tab" [class.on]="doc() === d" (click)="setDoc(d)">{{ tabLabel(d) }}</button>
        }
      </div>

      <div class="doc card">
        <h2 class="doc-t">{{ current().title }}</h2>
        <div class="doc-body" [innerHTML]="current().html"></div>
        <p class="doc-note">
          {{ i18n.locale() === 'tr'
            ? 'Bu metin bilgilendirme amaçlıdır; bağlayıcı sürüm avukat onayından geçirilmelidir.'
            : 'This text is for information; the binding version should be reviewed by legal counsel.' }}
        </p>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 720px; margin: 0 auto; padding: 8px 16px 96px; }
    .lhead { display: flex; align-items: center; gap: 8px; padding: 10px 0 6px; }
    .back { width: 38px; height: 38px; border-radius: 50%; font-size: 24px; line-height: 1; color: var(--ink);
      background: var(--surface-2); border: 1px solid var(--line); cursor: pointer; }
    .lt { margin: 0; font-size: 20px; }
    .tabs { display: flex; gap: 8px; overflow-x: auto; padding: 6px 0 12px; }
    .tab { flex: 0 0 auto; padding: 8px 14px; border-radius: 20px; font-size: 13px; cursor: pointer;
      background: var(--surface-2); border: 1px solid var(--line); color: var(--muted); }
    .tab.on { border-color: rgba(212,175,55,0.5); color: var(--gold-soft); background: rgba(212,175,55,0.12); }
    .doc { padding: 18px 16px; }
    .doc-t { margin: 0 0 12px; font-size: 18px; color: var(--gold-soft); }
    .doc-body { font-size: 13.5px; line-height: 1.6; color: var(--ink); }
    .doc-body ::ng-deep h4 { font-size: 14px; margin: 16px 0 4px; color: var(--ink); }
    .doc-body ::ng-deep p { margin: 4px 0; color: var(--muted); }
    .doc-body ::ng-deep ul { margin: 4px 0 4px 2px; padding-inline-start: 18px; }
    .doc-body ::ng-deep li { margin: 3px 0; color: var(--muted); }
    .doc-body ::ng-deep b { color: var(--ink); }
    .doc-note { margin: 16px 0 0; padding-top: 12px; border-top: 1px solid var(--line);
      font-size: 11.5px; color: var(--muted-2); font-style: italic; }
  `],
})
export class LegalComponent {
  readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly docs: LegalDoc[] = ['privacy', 'kvkk', 'terms'];
  readonly doc = signal<LegalDoc>('privacy');

  constructor() {
    const q = this.route.snapshot.queryParamMap.get('doc');
    if (q === 'privacy' || q === 'kvkk' || q === 'terms') this.doc.set(q);
  }

  current() { return legalText(this.doc(), this.i18n.locale()); }
  tabLabel(d: LegalDoc): string { return legalText(d, this.i18n.locale()).title; }
  setDoc(d: LegalDoc): void { this.doc.set(d); }
  goBack(): void { void this.router.navigate(['/profile']); }
}
