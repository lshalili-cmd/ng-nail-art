import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeaderComponent } from '../../shared/header.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [HeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header />
    <div class="page">
      <div class="section-head"><h2 class="section-title">📞 Contact</h2></div>

      <div class="card contact-card">
        <div class="crow">
          <span class="ck">Owner</span>
          <span class="cv">Resad Askeroğlu</span>
        </div>
        <div class="crow">
          <span class="ck">Business Type</span>
          <span class="cv">Sole Proprietorship</span>
        </div>
        <div class="crow">
          <span class="ck">Email</span>
          <a class="cv link" href="mailto:info@ngnailart.com">info&#64;ngnailart.com</a>
        </div>

        <p class="cnote">
          NG Nail Art is owned and operated by Resad Askeroğlu, a sole proprietorship registered in Türkiye.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .contact-card { padding: 16px; margin-top: 4px; }
    .crow { display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 12px 2px; border-bottom: 1px solid var(--line); }
    .crow:last-of-type { border-bottom: none; }
    .ck { font-size: 12.5px; color: var(--muted-2); }
    .cv { font-size: 14.5px; font-weight: 600; color: var(--ink); text-align: right; }
    .cv.link { color: var(--gold-soft); text-decoration: none; }
    .cv.link:hover { text-decoration: underline; }
    .cnote { margin: 14px 0 0; font-size: 13px; line-height: 1.6; color: var(--muted);
      background: var(--surface-2); border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; }
  `],
})
export class ContactComponent {}
