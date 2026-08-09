import { Injectable, inject, signal } from '@angular/core';
import { I18nService } from './i18n.service';

/**
 * MODEL B — Para birimi başına SABİT fiyat kademeleri.
 * Ana referans USD'dir; diğer para birimleri temiz/psikolojik fiyatlara yuvarlanmıştır.
 * Kur değiştikçe aşağıdaki tabloyu ELLE güncelleyin (ör. ayda bir). Günlük kur çevirisi YAPILMAZ —
 * bu hem stabil fiyat sağlar hem de Türkiye'de "dövize endeksli fiyat" sorununu önler
 * (TL fiyatı sabit bir lira tutarıdır, USD'ye endeksli değildir).
 */
export type Currency = 'USD' | 'EUR' | 'GBP' | 'TRY';
export const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'TRY'];

const SYMBOL: Record<Currency, string> = { USD: '$', EUR: '€', GBP: '£', TRY: '₺' };

/** itemId → para birimi → tutar. USD gerçek fiyatlar; diğerleri güncel kura göre güncellenmeli. */
const PRICES: Record<string, Record<Currency, number>> = {
  free:       { USD: 0,      EUR: 0,      GBP: 0,      TRY: 0 },
  monthly:    { USD: 7.85,   EUR: 7.49,   GBP: 6.49,   TRY: 349 },
  yearly:     { USD: 70.65,  EUR: 64.99,  GBP: 54.99,  TRY: 2999 },
  pro:        { USD: 24.99,  EUR: 22.99,  GBP: 19.99,  TRY: 999 },
  pro_yearly: { USD: 224.99, EUR: 209.99, GBP: 179.99, TRY: 8999 },
  pack_10:    { USD: 6,      EUR: 5.99,   GBP: 4.99,   TRY: 249 },
  pack_25:    { USD: 13,     EUR: 12.99,  GBP: 10.99,  TRY: 549 },
  pack_50:    { USD: 25,     EUR: 24.99,  GBP: 19.99,  TRY: 999 },
};

/** Tutarı para birimine göre biçimlendirir. TRY: tam sayı + binlik ayraç; diğerleri 2 ondalık. */
export function formatMoney(amount: number, cur: Currency): string {
  const s = SYMBOL[cur];
  if (cur === 'TRY') {
    const n = Math.round(amount);
    return s + n.toLocaleString('tr-TR');
  }
  const txt = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return s + txt;
}

/**
 * Seçili para birimini tutar (localStorage) ve fiyat erişimi sağlar.
 * Varsayılan: kayıtlı seçim yoksa dile göre (tr → TRY, diğer → USD).
 */
@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private readonly KEY = 'ngnail-currency';
  private readonly i18n = inject(I18nService);
  readonly currency = signal<Currency>(this.initial());

  set(c: Currency): void {
    this.currency.set(c);
    try { localStorage.setItem(this.KEY, c); } catch { /* geç */ }
  }

  /** Bir ürünün seçili para birimindeki tutarı (sayı — ödeme için). */
  amount(itemId: string): number {
    const row = PRICES[itemId];
    return row ? row[this.currency()] : 0;
  }

  /** Bir ürünün seçili para birimindeki fiyat etiketi (gösterim için). */
  label(itemId: string): string {
    return formatMoney(this.amount(itemId), this.currency());
  }

  private initial(): Currency {
    try {
      const v = localStorage.getItem(this.KEY);
      if (v === 'USD' || v === 'EUR' || v === 'GBP' || v === 'TRY') return v;
    } catch { /* geç */ }
    return this.i18n.locale() === 'tr' ? 'TRY' : 'USD';
  }
}
