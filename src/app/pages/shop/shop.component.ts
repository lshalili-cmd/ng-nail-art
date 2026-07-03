import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HeaderComponent } from '../../shared/header.component';
import { I18nService } from '../../core/i18n.service';
import { PlanService } from '../../core/plan.service';

interface Plan {
  id: string; name: string; price: string; period: string;
  highlight?: boolean; badge?: string; features: string[];
}
interface Pack { id: string; name: string; credits: number; price: string; }

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [HeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header />
    <div class="page">
      <div class="section-head"><h2 class="section-title">💎 {{ i18n.t('membership') }}</h2></div>
      <p class="intro">{{ i18n.t('membership_sub') }}</p>

      <div class="plans">
        @for (p of plans; track p.id) {
          <div class="plan card" [class.hl]="p.highlight" [class.on]="plan.current() === p.id">
            @if (p.badge) { <span class="tag">{{ p.badge }}</span> }
            <h3 class="pname">{{ p.name }}</h3>
            <p class="price">{{ p.price }}<span class="per">{{ p.period }}</span></p>
            <ul class="feats">
              @for (f of p.features; track f) { <li>✓ {{ f }}</li> }
            </ul>
            @if (plan.current() === p.id) {
              <button class="btn-ghost sel" disabled>✓ {{ i18n.t('current_plan') }}</button>
            } @else {
              <button class="btn-primary" (click)="choose(p.id)">{{ p.id === 'free' ? i18n.t('select') : i18n.t('upgrade') }}</button>
            }
          </div>
        }
      </div>

      <div class="section-head"><h2 class="section-title">🎟️ {{ i18n.t('credit_packs') }}</h2></div>
      <div class="packs">
        @for (k of packs; track k.id) {
          <div class="pack card">
            <p class="kname">{{ k.name }}</p>
            <p class="credits">{{ k.credits }} {{ i18n.t('credits') }}</p>
            <p class="kprice">{{ k.price }}</p>
            <button class="btn-ghost" (click)="choose('pack-' + k.id)">{{ i18n.t('select') }}</button>
          </div>
        }
      </div>

      <p class="note">ℹ️ {{ i18n.t('payment_soon') }}</p>
    </div>
  `,
  styles: [`
    .intro { margin: 0 0 8px; font-size: 13px; color: var(--muted); }
    .plans { display: flex; flex-direction: column; gap: 12px; }
    .plan { position: relative; padding: 18px 16px; }
    .plan.hl { border-color: rgba(212,175,55,0.55);
      background: linear-gradient(180deg, rgba(212,175,55,0.1), var(--surface-2)); }
    .plan.on { outline: 2px solid var(--gold); }
    .tag { position: absolute; top: 14px; inset-inline-end: 14px; font-size: 11px; font-weight: 700;
      color: #1a1206; background: var(--gold-grad); padding: 3px 10px; border-radius: 999px; }
    .pname { font-size: 18px; margin: 0; }
    .price { font-size: 26px; font-weight: 700; color: var(--gold); font-family: var(--font-head); margin: 6px 0 12px; }
    .per { font-size: 13px; color: var(--muted-2); font-family: var(--font-body); font-weight: 400; }
    .feats { list-style: none; margin: 0 0 14px; padding: 0; }
    .feats li { font-size: 13px; color: #efe7d4; padding: 5px 0; }
    .sel { width: 100%; color: var(--gold-soft); }
    .plan .btn-primary { width: 100%; }
    .packs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .pack { padding: 14px 8px; text-align: center; }
    .kname { margin: 0; font-size: 14px; font-weight: 700; }
    .credits { margin: 4px 0; font-size: 11px; color: var(--muted-2); }
    .kprice { margin: 4px 0 10px; font-size: 15px; font-weight: 700; color: var(--gold); }
    .pack .btn-ghost { width: 100%; padding: 8px; font-size: 12px; }
    .note { margin: 18px 0 0; font-size: 12px; color: var(--muted-2); text-align: center;
      background: var(--surface-2); border: 1px dashed var(--line); border-radius: 12px; padding: 12px; }
  `],
})
export class ShopComponent {
  readonly i18n = inject(I18nService);
  readonly plan = inject(PlanService);

  // Fiyat ve limitler kaynağı: app/data/financial-config.json (v5.0, USD 4-katman funnel)
  readonly plans: Plan[] = [
    { id: 'free', name: 'Free', price: '$0', period: '',
      features: ['1 AI görsel/ay', 'El tarama · AI Stüdyo · AR: 1 kez', 'Galeri (135+): tam erişim'] },
    { id: 'monthly', name: 'Aylık Premium', price: '$7.85', period: '/ay',
      features: ['30 AI görsel/ay (3/gün)', 'Tarama · AI Stüdyo · AR: sınırsız', 'Ek paket alabilir'] },
    { id: 'yearly', name: 'Yıllık Premium', price: '$70.65', period: '/yıl', highlight: true, badge: '%25 indirim',
      features: ['30 AI görsel/ay (3/gün)', 'Her şey sınırsız', '~$5.89/ay', 'Ek paket alabilir'] },
    { id: 'pro', name: 'Aylık Pro', price: '$24.99', period: '/ay',
      features: ['100 AI görsel/ay (10/gün)', 'Her şey sınırsız', 'Salon & profesyoneller için'] },
    { id: 'pro_yearly', name: 'Yıllık Pro', price: '$224.99', period: '/yıl', badge: '%25 indirim',
      features: ['100 AI görsel/ay (10/gün)', 'Her şey sınırsız', '~$18.75/ay', 'Büyük salon & ajanslar için'] },
  ];

  readonly packs: Pack[] = [
    { id: 'pack_10', name: 'Mini', credits: 10, price: '$6.00' },
    { id: 'pack_25', name: 'Standart', credits: 25, price: '$13.00' },
    { id: 'pack_50', name: 'Mega', credits: 50, price: '$25.00' },
  ];

  choose(id: string): void {
    this.plan.select(id);
  }
}
