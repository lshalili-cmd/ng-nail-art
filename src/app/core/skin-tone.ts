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
