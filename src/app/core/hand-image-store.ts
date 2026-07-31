import { Injectable, signal } from '@angular/core';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

/** El fotoğrafının nereden geldiği. */
export type HandImageSource = 'scan' | 'upload' | 'demo';

/**
 * Sanal tırnak denemesi için kaynak el fotoğrafı.
 * Tara sayfası doldurur; Stüdyo okur (fotoğrafı ana önizleme yapar ve
 * landmark'lardan tırnak maskelerini çıkarır). Studio'da da doldurulabilir.
 */
export interface HandImage {
  /** Tam çözünürlüklü el fotoğrafı (data URL). Orijinal korunur, bozulmaz. */
  imageUrl: string;
  width: number;
  height: number;
  /** MediaPipe 21 el noktası (yoksa null → manuel/geometrik tahmine düşülür). */
  landmarks: NormalizedLandmark[] | null;
  source: HandImageSource;
}

@Injectable({ providedIn: 'root' })
export class HandImageStore {
  readonly current = signal<HandImage | null>(null);

  set(h: HandImage): void {
    this.current.set(h);
  }

  clear(): void {
    this.current.set(null);
  }
}
