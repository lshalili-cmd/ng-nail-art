import { Injectable } from '@angular/core';
import { FilesetResolver, HandLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision';
import {
  averageSkin, classifyTone, detectUndertone, rgbToHex, rgbToLab,
  Lab, Rgb, ToneKey, Undertone,
} from './skin-tone';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export type FingerLength = 'short' | 'medium' | 'long';

export interface HandAnalysis {
  handDetected: boolean;
  landmarks: NormalizedLandmark[] | null;
  handedness: string | null;
  rgb: Rgb | null;
  hex: string | null;
  lab: Lab | null;
  toneKey: ToneKey | null;
  ita: number | null;
  undertone: Undertone | null;
  fingerLength: FingerLength | null;
  confidence: number;
}

@Injectable({ providedIn: 'root' })
export class HandAnalysisService {
  private landmarker: HandLandmarker | null = null;
  private initPromise: Promise<void> | null = null;
  private videoLandmarker: HandLandmarker | null = null;
  private videoInitPromise: Promise<void> | null = null;

  /** Canlı AR için VIDEO modunda el takipçisini yükler. */
  initVideo(): Promise<void> {
    if (!this.videoInitPromise) {
      this.videoInitPromise = this.loadVideo().catch((e) => { this.videoInitPromise = null; throw e; });
    }
    return this.videoInitPromise;
  }

  private async loadVideo(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    const opts = (delegate: 'GPU' | 'CPU') => ({
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: 'VIDEO' as const,
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    try {
      this.videoLandmarker = await HandLandmarker.createFromOptions(vision, opts('GPU'));
    } catch (e) {
      console.warn('[MediaPipe] AR GPU başarısız, CPU deneniyor:', e);
      this.videoLandmarker = await HandLandmarker.createFromOptions(vision, opts('CPU'));
    }
  }

  /** Canlı video karesinden el noktalarını döndürür (VIDEO modu). */
  detectVideo(video: HTMLVideoElement, timestampMs: number): NormalizedLandmark[][] {
    if (!this.videoLandmarker) return [];
    try {
      const res = this.videoLandmarker.detectForVideo(video, timestampMs);
      return res.landmarks ?? [];
    } catch {
      return [];
    }
  }

  /** MediaPipe modelini bir kez yükler (idempotent). CDN erişimi gerekir. */
  init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.load().catch((e) => {
        this.initPromise = null; // hata olursa tekrar denenebilsin
        throw e;
      });
    }
    return this.initPromise;
  }

  private async load(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    const opts = (delegate: 'GPU' | 'CPU') => ({
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: 'IMAGE' as const,
      numHands: 1,
      minHandDetectionConfidence: 0.3,
      minHandPresenceConfidence: 0.3,
      minTrackingConfidence: 0.3,
    });
    // CPU işleyici, tek-kare (IMAGE) tespitte tekrar tekrar çağrıldığında
    // GPU/WebGL bağlamından daha güvenilir; hız farkı bir kare için önemsiz.
    try {
      this.landmarker = await HandLandmarker.createFromOptions(vision, opts('CPU'));
    } catch (e) {
      console.warn('[MediaPipe] CPU başarısız, GPU ile deneniyor:', e);
      this.landmarker = await HandLandmarker.createFromOptions(vision, opts('GPU'));
    }
  }

  /** Yakalanmış bir kareyi (canvas) analiz eder. init() önce çağrılmış olmalı. */
  analyze(canvas: HTMLCanvasElement): HandAnalysis {
    const empty: HandAnalysis = {
      handDetected: false, landmarks: null, handedness: null, rgb: null, hex: null,
      lab: null, toneKey: null, ita: null, undertone: null, fingerLength: null, confidence: 0,
    };
    if (!this.landmarker) {
      console.error('[MediaPipe] landmarker hazır değil');
      return empty;
    }

    let result;
    try {
      result = this.landmarker.detect(canvas);
    } catch (e) {
      console.error('[MediaPipe] detect() hatası:', e);
      return empty;
    }
    const hands = result.landmarks;
    console.log(`[MediaPipe] tespit: ${hands?.length ?? 0} el, kare ${canvas.width}x${canvas.height}`);
    if (!hands || hands.length === 0) return empty;

    const lm = hands[0];
    const handedness = result.handednesses?.[0]?.[0]?.categoryName ?? null;

    const rgb = this.sampleSkin(canvas, lm);
    const lab = rgbToLab(rgb);
    const tone = classifyTone(lab);
    const undertone = detectUndertone(lab);
    const fingerLength = this.fingerStructure(lm);

    return {
      handDetected: true,
      landmarks: lm,
      handedness,
      rgb,
      hex: rgbToHex(rgb),
      lab,
      toneKey: tone.key,
      ita: tone.ita,
      undertone,
      fingerLength,
      confidence: 0.9,
    };
  }

  /** Avuç/el sırtı merkezinden bir yama örnekleyip baskın cilt rengini döndürür. */
  private sampleSkin(canvas: HTMLCanvasElement, lm: NormalizedLandmark[]): Rgb {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { r: 200, g: 160, b: 130 };

    // El sırtı merkezi: bilek(0) + MCP eklemleri(5,9,13,17) ortalaması
    const pts = [0, 5, 9, 13, 17].map((i) => lm[i]);
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;

    const px = Math.round(cx * canvas.width);
    const py = Math.round(cy * canvas.height);
    const half = Math.max(12, Math.round(canvas.width * 0.05));
    const x = Math.max(0, px - half);
    const y = Math.max(0, py - half);
    const w = Math.min(half * 2, canvas.width - x);
    const h = Math.min(half * 2, canvas.height - y);
    if (w <= 0 || h <= 0) return { r: 200, g: 160, b: 130 };

    const data = ctx.getImageData(x, y, w, h).data;
    return averageSkin(data);
  }

  /** Parmak uzunluğu oranından yapı sınıflandırması (MCP→TIP / avuç boyu). */
  private fingerStructure(lm: NormalizedLandmark[]): FingerLength {
    const dist = (a: NormalizedLandmark, b: NormalizedLandmark) =>
      Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
    const palm = dist(lm[0], lm[9]) || 0.001;
    const fingers: [number, number][] = [[5, 8], [9, 12], [13, 16], [17, 20]];
    const avg = fingers.reduce((s, [mcp, tip]) => s + dist(lm[mcp], lm[tip]) / palm, 0) / fingers.length;
    if (avg > 1.15) return 'long';
    if (avg < 0.85) return 'short';
    return 'medium';
  }
}
