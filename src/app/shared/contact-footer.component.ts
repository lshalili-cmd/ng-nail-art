import { ChangeDetectionStrategy, Component } from '@angular/core';
import { COMPANY_NAME, COMPANY_OWNER, COMPANY_REGISTERED_NAME, COMPANY_EMAIL, COMPANY_ADDRESS_TR } from '../core/company.config';

@Component({
  selector: 'app-contact-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cf">
      <p class="cf-t">Contact Us</p>
      <p class="cf-r">Owner Name: {{ owner }}</p>
      <p class="cf-r">Registered Business Name: {{ registeredName }}</p>
      <p class="cf-r">Trade Name: {{ business }}</p>
      <p class="cf-r">Address: {{ address }}</p>
      <p class="cf-r">Email: <a class="cf-mail" [href]="'mailto:' + email">{{ email }}</a></p>
      <p class="cf-note">{{ business }}, {{ owner }} tarafından işletilen bir markadır.</p>
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
    .cf-note { margin: 4px 0 0; font-size: 10px; line-height: 1.35; color: var(--muted-2); opacity: 0.85; }
  `],
})
export class ContactFooterComponent {
  readonly owner = COMPANY_OWNER;
  readonly registeredName = COMPANY_REGISTERED_NAME;
  readonly business = COMPANY_NAME;
  readonly email = COMPANY_EMAIL;
  readonly address = COMPANY_ADDRESS_TR;
}
