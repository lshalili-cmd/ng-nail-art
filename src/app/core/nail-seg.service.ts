import { Injectable, signal } from '@angular/core';
import { classifyMaskShape, CloseupResult } from './nail-shape-detect';

/**
 * ML TIRNAK SEGMENTASYONU (opsiyonel, takılabilir).
 *
 * Eğitilmiş bir tırnak-segmentasyon modeli (ONNX) verildiğinde en yüksek doğruluğu sağlar:
 * modeli ONNX Runtime Web ile (CDN'den, npm paketi gerektirmez) çalıştırır, tırnak plakası
 * maskesini üretir ve classifyMaskShape ile şekli çıkarır. Model YOKSA servis "hazır değil"
 * kalır ve uygulama mevcut flood-fill yöntemine düşer — hiçbir şey bozulmaz.
 *
 * Modeli etkinleştirmek için:
 *   1) Eğitilmiş modeli `public/models/nail-seg.onnx` olarak koyun (giriş 1x3xHxW, çıkış maske).
 *   2) Aşağıdaki MODEL_URL'yi '/models/nail-seg.onnx' yapın.
 * Beklenen çıktı: [1,1,H,W] veya [1,H,W] olasılık/logit; >0.5 eşiği ile ikili maske alınır.
 */
const MODEL_URL = ''; // boş → ML kapalı (fallback). Model eklenince '/models/nail-seg.onnx'
const ORT_CDN = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/ort.min.js';
const SIZE = 256; // model giriş kenarı

/* eslint-disable @typescript-eslint/no-explicit-any */
@Injectable({ providedIn: 'root' })
export class NailSegService {
  private ort: any = null;
  private session: any = null;
  private tried = false;
  readonly ready = signal<boolean>(false);

  /** Model yapılandırılmış mı? (URL boşsa hiç denenmez.) */
  enabled(): boolean { return !!MODEL_URL; }

  /** ONNX çalışma zamanını + modeli bir kez yükler. Başarısızsa false (sessizce fallback). */
  async init(): Promise<boolean> {
    if (this.session) return true;
    if (this.tried || !MODEL_URL) return false;
    this.tried = true;
    try {
      this.ort = await this.loadOrt();
      this.session = await this.ort.InferenceSession.create(MODEL_URL, { executionProviders: ['wasm'] });
      this.ready.set(true);
      return true;
    } catch (e) {
      console.warn('[NailSeg] ML modeli yüklenemedi, flood-fill yöntemine düşülüyor:', e);
      this.ready.set(false);
      return false;
    }
  }

  /** ML ile tırnak şeklini çıkarır. Model yoksa/başarısızsa null (çağıran fallback yapar). */
  async segmentShape(source: HTMLCanvasElement): Promise<CloseupResult | null> {
    if (!(await this.init())) return null;
    try {
      const input = this.preprocess(source);
      const feeds: Record<string, any> = {};
      feeds[this.session.inputNames[0]] = input;
      const out = await this.session.run(feeds);
      const data = out[this.session.outputNames[0]].data as Float32Array;
      const mask = new Uint8Array(SIZE * SIZE);
      for (let i = 0; i < mask.length; i++) mask[i] = data[i] > 0.5 ? 1 : 0;
      return classifyMaskShape(mask, SIZE, SIZE, 0.6); // ML → daha yüksek temel güven
    } catch (e) {
      console.warn('[NailSeg] çıkarım hatası, fallback:', e);
      return null;
    }
  }

  /** Görseli SIZE×SIZE'e ölçekler ve NCHW [0,1] float tensöre çevirir. */
  private preprocess(source: HTMLCanvasElement): any {
    const c = document.createElement('canvas');
    c.width = SIZE; c.height = SIZE;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx!.drawImage(source, 0, 0, SIZE, SIZE);
    const { data } = ctx!.getImageData(0, 0, SIZE, SIZE);
    const arr = new Float32Array(3 * SIZE * SIZE);
    const plane = SIZE * SIZE;
    for (let i = 0; i < plane; i++) {
      arr[i] = data[i * 4] / 255;                 // R
      arr[plane + i] = data[i * 4 + 1] / 255;      // G
      arr[2 * plane + i] = data[i * 4 + 2] / 255;  // B
    }
    return new this.ort.Tensor('float32', arr, [1, 3, SIZE, SIZE]);
  }

  private loadOrt(): Promise<any> {
    return new Promise((resolve, reject) => {
      const w = window as any;
      if (w.ort) return resolve(w.ort);
      const s = document.createElement('script');
      s.src = ORT_CDN;
      s.async = true;
      s.onload = () => (w.ort ? resolve(w.ort) : reject(new Error('ort global yok')));
      s.onerror = () => reject(new Error('ONNX Runtime yüklenemedi'));
      document.head.appendChild(s);
    });
  }
}
