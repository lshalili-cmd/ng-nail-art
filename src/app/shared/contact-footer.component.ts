import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-contact-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cf">
      <p class="cf-t">Contact Us</p>
      <p class="cf-r">Owner Name: Resad Askeroglu</p>
      <p class="cf-r">Business: NGNAILART</p>
      <p class="cf-r">Email: <a class="cf-mail" href="mailto:info@ngnailart.com">info&#64;ngnailart.com</a></p>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .cf { text-align: center; padding: 6px 16px 2px; }
    .cf-t { margin: 0 0 2px; font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
      text-transform: uppercase; color: var(--gold-soft); }
    .cf-r { margin: 1px 0; font-size: 10.5px; line-height: 1.35; color: var(--muted-2); }
    .cf-mail { color: var(--gold-soft); text-decoration: none; }
    .cf-mail:hover { text-decoration: underline; }
  `],
})
export class ContactFooterComponent {}
