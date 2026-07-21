import { Injectable } from '@angular/core';
import { FilesetResolver, HandLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision';
import {
  averageSkin, averageSkinOrNull, applyGains, classifyTone, detectUndertone,
  estimateSceneGains, medianRgb, rgbToHex, rgbToLab,
  IlluminantGains, Lab, Rgb, ToneKey, Undertone,
} from './skin-tone';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export type FingerLength = 'short' | 'medium' | 'long';
export type NailShape = 'oval' | 'almond' | 'square' | 'squoval' | 'coffin' | 'stiletto' | 'round';

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
  /** Parmak ucu silüetinden tahmin edilen tırnak şekli (null = çıkarılamadı). */
  nailShape: NailShape | null;
  /** Tırnak şekli tahmininin güveni (0..1). */
  shapeConfidence: number;
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
      numHands: 1, // tek el — sol ya da sağ, hangisi gösterilirse (stabilite için)
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
      lab: null, toneKey: null, ita: null, undertone: null, fingerLength: null,
      nailShape: null, shapeConfidence: 0, confidence: 0,
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

    // 1) HAM cilt rengi — çoklu yama (el sırtı + parmak dipleri) medyanı.
    //    Ham renk, tırnak şekli tahmincisine gider (o, kareyi ham pikselle karşılaştırır).
    const rawSkin = this.sampleSkin(canvas, lm);
    // 2) Işık düzeltmesi — karedeki ışık rengi kestirilir, cilt rengi normalize edilir.
    //    DÜZELTİLMİŞ renk yalnızca ton/alt ton sınıflandırmasına gider; böylece sarı
    //    ampul "sıcak", soğuk LED "soğuk" yanılgısı ortadan kalkar.
    const gains = this.illuminantGains(canvas);
    const rgb = applyGains(rawSkin, gains);
    console.log(`[Scan] ışık düzeltme kazançları r=${gains.gr.toFixed(2)} b=${gains.gb.toFixed(2)}`);
    const lab = rgbToLab(rgb);
    const tone = classifyTone(lab);
    const undertone = detectUndertone(lab);
    const fingerLength = this.fingerStructure(lm);
    const shape = this.estimateNailShape(canvas, lm, rawSkin);

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
      nailShape: shape.shape,
      shapeConfidence: shape.confidence,
      confidence: 0.9,
    };
  }

  /**
   * Tırnak şeklini parmak ucu SİLÜETİNDEN tahmin eder.
   * Fikir: Tırnağın serbest kenarı parmağın en uç kısmının şeklini belirler.
   * Her parmak için DIP→TIP ekseni boyunca perpendiküler yönde parmak genişliğini
   * ölçüp, uca doğru daralma (taper) ve uç kapağının uzunluk/genişlik oranından şekli sınıflarız.
   * Eklem-noktası modeli tırnağı doğrudan görmez; bu piksel-silüet yöntemi eski
   * "parmak uzunluğu → tahmin" yaklaşımından çok daha isabetlidir.
   */
  private estimateNailShape(
    canvas: HTMLCanvasElement, lm: NormalizedLandmark[], skin: Rgb,
  ): { shape: NailShape | null; confidence: number } {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { shape: null, confidence: 0 };
    const W = canvas.width, H = canvas.height;
    let data: Uint8ClampedArray;
    try {
      data = ctx.getImageData(0, 0, W, H).data;
    } catch {
      return { shape: null, confidence: 0 };
    }

    // "Parmak" pikseli: örneklenen cilt rengine yakın (arka plandan ayırır).
    const tol = 78;
    const isFinger = (x: number, y: number): boolean => {
      if (x < 0 || y < 0 || x >= W || y >= H) return false;
      const i = (y * W + x) * 4;
      const dr = data[i] - skin.r, dg = data[i + 1] - skin.g, db = data[i + 2] - skin.b;
      return Math.sqrt(dr * dr + dg * dg + db * db) < tol;
    };

    // 4 parmak (başparmak hariç): [PIP, DIP, TIP]
    const fingers: [number, number, number][] = [[6, 7, 8], [10, 11, 12], [14, 15, 16], [18, 19, 20]];
    const votes: Record<string, number> = {};
    let counted = 0;
    for (const [pip, dip, tip] of fingers) {
      const s = this.tipShape(lm[pip], lm[dip], lm[tip], W, H, isFinger);
      if (s) { votes[s] = (votes[s] ?? 0) + 1; counted++; }
    }
    if (counted === 0) return { shape: null, confidence: 0 };

    let best: NailShape = 'oval', top = 0;
    for (const k of Object.keys(votes)) {
      if (votes[k] > top) { top = votes[k]; best = k as NailShape; }
    }
    // Güven: parmaklar arası uzlaşma + yeterli örnek
    const confidence = Math.min(0.95, 0.35 + 0.55 * (top / counted) + 0.05 * counted);
    return { shape: best, confidence: Number(confidence.toFixed(2)) };
  }

  /** Tek parmağın ucundaki silüet profilinden tırnak şeklini sınıflar. */
  private tipShape(
    pip: NormalizedLandmark, dip: NormalizedLandmark, tip: NormalizedLandmark,
    W: number, H: number, isFinger: (x: number, y: number) => boolean,
  ): NailShape | null {
    const P = { x: pip.x * W, y: pip.y * H };
    const D = { x: dip.x * W, y: dip.y * H };
    const T = { x: tip.x * W, y: tip.y * H };
    const axLen = Math.hypot(T.x - D.x, T.y - D.y);
    if (axLen < 4) return null;
    // Perpendiküler yön
    const nx = -(T.y - D.y) / axLen, ny = (T.x - D.x) / axLen;
    // Genişlik tarama sınırı: proksimal falanks uzunluğuna göre ölçekli
    const seg = Math.hypot(D.x - P.x, D.y - P.y) || axLen;
    const maxHalf = Math.max(6, Math.round(seg * 0.9));

    const steps = 18;
    const start = -0.15, end = 1.35; // DIP altından TIP ötesine
    const widths: number[] = [];
    for (let s = 0; s <= steps; s++) {
      const t = start + (end - start) * (s / steps);
      const cx = D.x + (T.x - D.x) * t;
      const cy = D.y + (T.y - D.y) * t;
      let wp = 0, wn = 0;
      for (let d = 1; d <= maxHalf; d++) {
        if (!isFinger(Math.round(cx + nx * d), Math.round(cy + ny * d))) break; wp = d;
      }
      for (let d = 1; d <= maxHalf; d++) {
        if (!isFinger(Math.round(cx - nx * d), Math.round(cy - ny * d))) break; wn = d;
      }
      widths.push(wp + wn);
    }

    const maxW = Math.max(...widths, 1);
    if (maxW < 3) return null; // silüet bulunamadı (kontrast düşük)

    // Uç indeksi: parmağın hâlâ görüldüğü son kesit
    let tipIdx = 0;
    for (let i = widths.length - 1; i >= 0; i--) {
      if (widths[i] > 0.18 * maxW) { tipIdx = i; break; }
    }
    // Orta genişlik (parmak gövdesi) ~ maxW; uca yakın genişlik
    const nearTip = (widths[Math.max(0, tipIdx - 1)] + widths[tipIdx]) / 2;
    const taper = nearTip / maxW; // 0 (sivri) .. 1 (düz/geniş)

    // Uç kapağı uzunluğu: daralmanın başladığı yerden uca kadar piksel
    const stepPx = ((end - start) / steps) * axLen;
    let capSteps = 0;
    for (let i = 0; i <= tipIdx; i++) {
      if (widths[i] < 0.82 * maxW && widths[i] > 0.12 * maxW) capSteps++;
    }
    const aspect = (capSteps * stepPx) / maxW; // kapak uzunluğu / genişlik

    // Sınıflandırma (silüet daralması + kapak en/boy) — 7 şekli dengeli ayırır,
    // badem lehine kaymayı önlemek için bantlar daraltıldı ve aspect koşulu eklendi.
    if (taper < 0.22) return aspect > 1.05 ? 'stiletto' : 'almond'; // çok sivri uç
    if (taper < 0.44) return aspect > 1.15 ? 'almond' : 'oval';     // sivri: uzunsa badem, değilse oval
    if (taper < 0.62) return aspect > 0.95 ? 'coffin' : 'oval';     // orta: uzun+düz uç → tabut
    if (taper < 0.80) return aspect > 0.60 ? 'squoval' : 'round';   // hafif düz kesim → squoval
    return aspect > 0.50 ? 'square' : 'round';                       // geniş düz uç → kare/yuvarlak
  }

  /** Avuç/el sırtı merkezinden bir yama örnekleyip baskın cilt rengini döndürür. */
  /**
   * ÇOK-YAMALI cilt örnekleme: tek nokta yerine el sırtı + parmak dipleri dahil
   * ~9 ayrı yamadan renk alınır ve kanal bazında MEDYAN birleştirilir. Tek yamanın
   * gölgeye, yüzüğe veya damara denk gelmesi artık sonucu bozamaz.
   */
  private sampleSkin(canvas: HTMLCanvasElement, lm: NormalizedLandmark[]): Rgb {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { r: 200, g: 160, b: 130 };
    const W = canvas.width, H = canvas.height;

    const mid = (a: number, b: number, t = 0.5) =>
      ({ x: lm[a].x + (lm[b].x - lm[a].x) * t, y: lm[a].y + (lm[b].y - lm[a].y) * t });
    // El sırtı merkezi
    const pts = [0, 5, 9, 13, 17].map((i) => lm[i]);
    const center = { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length };
    // Yama merkezleri: sırt merkezi, bilek→orta MCP arası, MCP araları (bileğe %30 kaydırılmış),
    // ve dört parmağın dip boğum ortaları (MCP→PIP)
    const spots = [
      center,
      mid(0, 9, 0.45),
      { x: mid(5, 9).x + (lm[0].x - mid(5, 9).x) * 0.3, y: mid(5, 9).y + (lm[0].y - mid(5, 9).y) * 0.3 },
      { x: mid(9, 13).x + (lm[0].x - mid(9, 13).x) * 0.3, y: mid(9, 13).y + (lm[0].y - mid(9, 13).y) * 0.3 },
      { x: mid(13, 17).x + (lm[0].x - mid(13, 17).x) * 0.3, y: mid(13, 17).y + (lm[0].y - mid(13, 17).y) * 0.3 },
      mid(5, 6), mid(9, 10), mid(13, 14), mid(17, 18),
    ];

    const half = Math.max(8, Math.round(W * 0.035));
    const samples: Rgb[] = [];
    for (const s of spots) {
      const px = Math.round(s.x * W), py = Math.round(s.y * H);
      const x = Math.max(0, px - half), y = Math.max(0, py - half);
      const w = Math.min(half * 2, W - x), h = Math.min(half * 2, H - y);
      if (w <= 0 || h <= 0) continue;
      try {
        const v = averageSkinOrNull(ctx.getImageData(x, y, w, h).data);
        if (v) samples.push(v);
      } catch { /* yama okunamadıysa geç */ }
    }
    console.log(`[Scan] cilt örnekleme: ${samples.length}/${spots.length} geçerli yama`);
    return medianRgb(samples) ?? averageSkin(new Uint8ClampedArray(0));
  }

  /** Karenin ışık rengini küçültülmüş kopyadan kestirir (hızlı — 48x48). */
  private illuminantGains(canvas: HTMLCanvasElement): IlluminantGains {
    try {
      const S = 48;
      const c = document.createElement('canvas');
      c.width = S; c.height = S;
      const cx = c.getContext('2d', { willReadFrequently: true });
      if (!cx) return { gr: 1, gg: 1, gb: 1 };
      cx.drawImage(canvas, 0, 0, S, S);
      return estimateSceneGains(cx.getImageData(0, 0, S, S).data);
    } catch {
      return { gr: 1, gg: 1, gb: 1 };
    }
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
