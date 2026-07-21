// Miracle Nail Art AI — Cilt tonu & alt ton analizi (saf fonksiyonlar)
// RGB → CIELAB dönüşümü, ITA (Individual Typology Angle) ile 8 seviyeli sınıflandırma.
// Basitleştirilmiş ama klinik temele (ITA) dayalı; eski motorun mantığını taşır.

export interface Rgb { r: number; g: number; b: number; }
export interface Lab { L: number; a: number; b: number; }

/** 8 seviyeli ten tonu anahtarı (öneri motoruyla uyumlu). */
export type ToneKey =
  | 'very_fair' | 'fair' | 'light_wheat' | 'wheat'
  | 'tan' | 'dark_tan' | 'dark_brown' | 'very_dark';

export type Undertone = 'warm' | 'cool' | 'neutral';

/** sRGB (0-255) → CIELAB (D65). */
export function rgbToLab({ r, g, b }: Rgb): Lab {
  let R = r / 255, G = g / 255, B = b / 255;
  R = R > 0.04045 ? Math.pow((R + 0.055) / 1.055, 2.4) : R / 12.92;
  G = G > 0.04045 ? Math.pow((G + 0.055) / 1.055, 2.4) : G / 12.92;
  B = B > 0.04045 ? Math.pow((B + 0.055) / 1.055, 2.4) : B / 12.92;

  // sRGB → XYZ (D65)
  const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const Y = (R * 0.2126 + G * 0.7152 + B * 0.0722) / 1.0;
  const Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(X), fy = f(Y), fz = f(Z);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/** ITA° = arctan((L* - 50) / b*) · 180/π */
export function ita(lab: Lab): number {
  if (lab.b === 0) return lab.L > 50 ? 90 : -90;
  return (Math.atan2(lab.L - 50, lab.b) * 180) / Math.PI;
}

/** ITA açısına göre 8 seviyeli ten tonu sınıflandırması. */
export function classifyTone(lab: Lab): { key: ToneKey; ita: number } {
  const angle = ita(lab);
  let key: ToneKey;
  if (angle > 55) key = 'very_fair';
  else if (angle > 46) key = 'fair';
  else if (angle > 37) key = 'light_wheat';
  else if (angle > 28) key = 'wheat';
  else if (angle > 15) key = 'tan';
  else if (angle > 0) key = 'dark_tan';
  else if (angle > -30) key = 'dark_brown';
  else key = 'very_dark';
  return { key, ita: Math.round(angle) };
}

/** a* ve b* ilişkisinden sıcak/soğuk/nötr alt ton tespiti. */
export function detectUndertone(lab: Lab): Undertone {
  // b* yüksek (sarı) → sıcak; b* düşük ve a* baskın (pembe/mavi) → soğuk
  const warmth = lab.b - lab.a * 0.5;
  if (warmth > 14) return 'warm';
  if (warmth < 8) return 'cool';
  return 'neutral';
}

/** Işık kaynağı düzeltme kazançları (kanal başına çarpan; yeşil=1'e normalize). */
export interface IlluminantGains { gr: number; gg: number; gb: number; }

/**
 * Karedeki ışık rengini kestirir ve düzeltme kazançları üretir ("shades-of-gray",
 * Minkowski p=6). Sarı ampul altında mavi kanalı güçlendirir, soğuk LED altında
 * kırmızıyı — böylece ten rengi/alt ton sınıflandırması ışıktan bağımsızlaşır.
 * Kare çoğunlukla elden oluşsa bile aşırı düzeltmeyi önlemek için kazançlar
 * [0.65, 1.55] aralığına kelepçelenir.
 */
export function estimateIlluminantGains(pixels: Uint8ClampedArray): IlluminantGains {
  const P = 6;
  let sr = 0, sg = 0, sb = 0, n = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 200) continue;
    sr += Math.pow(pixels[i] / 255, P);
    sg += Math.pow(pixels[i + 1] / 255, P);
    sb += Math.pow(pixels[i + 2] / 255, P);
    n++;
  }
  if (!n) return { gr: 1, gg: 1, gb: 1 };
  const mr = Math.pow(sr / n, 1 / P) || 1e-4;
  const mg = Math.pow(sg / n, 1 / P) || 1e-4;
  const mb = Math.pow(sb / n, 1 / P) || 1e-4;
  const gray = (mr + mg + mb) / 3;
  // Yeşil kanala normalize et (parlaklığı değil, renk dengesini düzeltiyoruz)
  const base = gray / mg;
  const clamp = (v: number) => Math.max(0.65, Math.min(1.55, v));
  return { gr: clamp(gray / mr / base), gg: 1, gb: clamp(gray / mb / base) };
}

/** Kazançları bir renge uygular (0-255'e kelepçeli). */
export function applyGains({ r, g, b }: Rgb, k: IlluminantGains): Rgb {
  const c = (v: number) => Math.max(0, Math.min(255, v));
  return { r: c(r * k.gr), g: c(g * k.gg), b: c(b * k.gb) };
}

/**
 * SAHNE ışık düzeltmesi (hibrit, cilt-farkında) — analiz kalitesinin 1. adımı.
 *
 * Üç kademe:
 *  1) BEYAZ REFERANS: Karede parlak ve nötr bir bölge varsa (duvar/kağıt),
 *     ışık rengi ondan güvenilir okunur → tam düzeltme.
 *  2) İSTATİSTİK (shades-of-gray) + YÖN FARKINDA SÖNÜM: Beyaz referans yoksa
 *     genel kestirim kullanılır. Cilt, kestirimi yalnızca 'sıcak' yönünde
 *     yanıltabilir (cilt asla mavi değildir) → sıcak yönde güçlü sönüm
 *     (kare cilt-ağırlıklıysa daha da güçlü), soğuk yönde hafif sönüm.
 *  3) ÖLÜ BÖLGE: Kestirilen sapma küçükse HİÇ düzeltme yapılmaz — normal
 *     ışıkta kullanıcının gerçek alt tonu asla bozulmaz (sıfır gerileme).
 */
export function estimateSceneGains(pixels: Uint8ClampedArray): IlluminantGains {
  const rs: number[] = [], gs: number[] = [], bs: number[] = [];
  let skinLike = 0, tot = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 200) continue;
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    rs.push(r); gs.push(g); bs.push(b); tot++;
    if (r > g && g >= b - 6) skinLike++;                 // cilt benzeri piksel
  }
  if (!tot) return { gr: 1, gg: 1, gb: 1 };

  const p95 = (a: number[]) => {
    const s = [...a].sort((x, y) => x - y);
    return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))];
  };
  const wr = p95(rs), wg = p95(gs), wb = p95(bs);
  const mx = Math.max(wr, wg, wb), mn = Math.max(1, Math.min(wr, wg, wb));

  let g: IlluminantGains;
  if (wg > 170 && mx / mn < 1.4 && mx < 253) {
    // 1) Güvenilir beyaz referans (parlak, nötr, doymamış) → tam düzeltme
    g = { gr: wg / wr, gg: 1, gb: wg / wb };
  } else {
    // 2) İstatistiksel kestirim + yön farkında sönüm
    const raw = estimateIlluminantGains(pixels);
    const d = raw.gb >= 1 ? (skinLike / tot > 0.6 ? 0.35 : 0.6) : 0.85;
    g = { gr: Math.pow(raw.gr, d), gg: 1, gb: Math.pow(raw.gb, d) };
  }
  const c = (v: number) => Math.max(0.7, Math.min(1.5, v));
  g = { gr: c(g.gr), gg: 1, gb: c(g.gb) };

  // 3) Ölü bölge — hafif sapmaya dokunma (normal ışık = düzeltme yok)
  if (g.gr > 0.9 && g.gr < 1.12 && g.gb > 0.9 && g.gb < 1.12) {
    return { gr: 1, gg: 1, gb: 1 };
  }
  return g;
}

/**
 * POZ (parlaklık) normalizasyon çarpanı — analiz kalitesinin kritik parçası.
 *
 * Ton sınıflandırması (ITA) mutlak parlaklığa (L*) çok duyarlıdır; kamera cildi
 * düşük pozlarsa açık tenli biri bile "koyu" çıkar. Bu fonksiyon karenin
 * "beyaz noktasını" (parlak piksellerin 97. yüzdeliği) ölçer; kare az pozlanmışsa
 * beyaz noktayı hedefe taşıyacak bir çarpan üretir. Çarpan [1, 1.7] ile
 * KELEPÇELİDİR (aşırı parlatıp koyu teni yanlış açığa çıkarmamak için) ve karede
 * yeterli parlaklık zaten varsa 1 döner (iyi pozda hiç dokunmaz — sıfır gerileme).
 */
export function estimateExposureGain(pixels: Uint8ClampedArray): number {
  const maxes: number[] = [];
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 200) continue;
    maxes.push(Math.max(pixels[i], pixels[i + 1], pixels[i + 2]));
  }
  if (!maxes.length) return 1;
  maxes.sort((a, b) => a - b);
  const p97 = maxes[Math.min(maxes.length - 1, Math.floor(maxes.length * 0.97))];
  const TARGET = 242;
  if (p97 >= TARGET) return 1;                         // iyi/fazla pozlanmış → dokunma
  return Math.max(1, Math.min(1.7, TARGET / Math.max(1, p97)));
}

/** Bir rengi düz parlaklık çarpanıyla ölçekler (0-255 kelepçeli). */
export function scaleBrightness({ r, g, b }: Rgb, k: number): Rgb {
  const c = (v: number) => Math.max(0, Math.min(255, v * k));
  return { r: c(r), g: c(g), b: c(b) };
}

/** averageSkin gibi, ama geçerli cilt pikseli yoksa null döner (çok-yama örnekleme için). */
export function averageSkinOrNull(pixels: Uint8ClampedArray): Rgb | null {
  const v = averageSkin(pixels);
  // averageSkin boş kümede sabit varsayılan döndürür — onu "geçersiz yama" say.
  return (v.r === 200 && v.g === 160 && v.b === 130) ? null : v;
}

/** Birden çok yama renginin kanal bazında medyanı (gölge/yüzük gibi sapmalara dayanıklı). */
export function medianRgb(list: Rgb[]): Rgb | null {
  if (!list.length) return null;
  const med = (arr: number[]) => {
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  return { r: med(list.map((c) => c.r)), g: med(list.map((c) => c.g)), b: med(list.map((c) => c.b)) };
}

/** RGB'yi #hex'e çevirir. */
export function rgbToHex({ r, g, b }: Rgb): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/**
 * Bir piksel dizisinden (RGBA) uçları buda-ortalama alarak baskın cilt rengini bulur.
 * Aşırı parlak/karanlık ve doygun olmayan pikselleri eler.
 */
export function averageSkin(pixels: Uint8ClampedArray): Rgb {
  const rs: number[] = [], gs: number[] = [], bs: number[] = [];
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
    if (a < 200) continue;
    const max = Math.max(r, g, b);
    if (max > 250 || max < 25) continue;               // aşırı parlak/karanlık ele
    if (r < g || r < b - 8) continue;                  // cilt: kırmızı kanal baskın olmalı
    rs.push(r); gs.push(g); bs.push(b);
  }
  if (!rs.length) return { r: 200, g: 160, b: 130 };   // güvenli varsayılan
  const med = (arr: number[]) => {
    const s = [...arr].sort((x, y) => x - y);
    const lo = Math.floor(s.length * 0.2), hi = Math.ceil(s.length * 0.8);
    const slice = s.slice(lo, Math.max(hi, lo + 1));
    return slice.reduce((p, c) => p + c, 0) / slice.length;
  };
  return { r: med(rs), g: med(gs), b: med(bs) };
}
