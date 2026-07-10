import { Injectable, signal } from '@angular/core';

/** AR'da denenecek tasarım. Stüdyo doldurur, AR okur (canlı tırnağa bindirir). */
export interface TryonDesign {
  imageUrl: string | null;   // üretilen tasarım görseli (tırnağa bindirilecek)
  color: string;             // taban renk (görsel yoksa/yüklenene kadar)
  pattern: string;           // finiş/desen (glossy, matte, glitter, french, chrome...)
}

@Injectable({ providedIn: 'root' })
export class TryonStore {
  readonly current = signal<TryonDesign | null>(null);

  set(d: TryonDesign): void {
    this.current.set(d);
  }

  clear(): void {
    this.current.set(null);
  }
}
