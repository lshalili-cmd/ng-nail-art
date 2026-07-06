import { NailShape } from './hand-analysis.service';

export interface CloseupResult {
  shape: NailShape | null;
  confidence: number;
}

/**
 * Bir İKİLİ MASKEDEN (tırnak plakası) tırnak şeklini çıkarır.
 * PCA ile uzun ekseni bulur, eksen boyunca genişlik profilinden ucun daralmasını (taper)
 * ve boy/en oranını ölçüp şekli sınıflar. Hem flood-fill hem de ML maskeleri bunu besler.
 * @param baseConf temel güven (ML maskesi daha yüksek verilebilir)
 */
export function classifyMaskShape(
  mask: Uint8Array, w: number, h: number, baseConf = 0.45,
): CloseupResult {
  const none: CloseupResult = { shape: null, confidence: 0 };

  let cnt = 0, mx = 0, my = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) if (mask[y * w + x]) { mx += x; my += y; cnt++; }
  }
  const frac = cnt / (w * h);
  if (cnt < 40 || frac < 0.02 || frac > 0.95) return none;
  mx /= cnt; my /= cnt;

  let sxx = 0, syy = 0, sxy = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) { const dx = x - mx, dy = y - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
    }
  }
  sxx /= cnt; syy /= cnt; sxy /= cnt;
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const ux = Math.cos(theta), uy = Math.sin(theta); // uzun eksen
  const vx = -uy, vy = ux;                           // kısa eksen (genişlik)

  let pmin = Infinity, pmax = -Infinity;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) { const t = (x - mx) * ux + (y - my) * uy; if (t < pmin) pmin = t; if (t > pmax) pmax = t; }
    }
  }
  const L = (pmax - pmin) || 1;

  const bins = 20;
  const wmin = new Array<number>(bins).fill(Infinity);
  const wmax = new Array<number>(bins).fill(-Infinity);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) {
        const t = ((x - mx) * ux + (y - my) * uy - pmin) / L;
        const b = Math.min(bins - 1, Math.max(0, Math.floor(t * bins)));
        const s = (x - mx) * vx + (y - my) * vy;
        if (s < wmin[b]) wmin[b] = s;
        if (s > wmax[b]) wmax[b] = s;
      }
    }
  }
  const widthAt = wmin.map((mn, b) => (wmax[b] >= mn ? wmax[b] - mn : 0));
  const maxWidth = Math.max(...widthAt, 1);

  const headW = (widthAt[0] + widthAt[1] + widthAt[2]) / 3;
  const tailW = (widthAt[bins - 1] + widthAt[bins - 2] + widthAt[bins - 3]) / 3;
  const tipEnd = tailW <= headW ? widthAt[bins - 1] : widthAt[0];

  const tipTaper = tipEnd / maxWidth; // 0 (sivri) .. 1 (düz)
  const aspect = L / maxWidth;         // boy / en

  let shape: NailShape;
  if (tipTaper < 0.28) shape = aspect > 2.6 ? 'stiletto' : 'almond';
  else if (tipTaper < 0.50) shape = aspect > 2.3 ? 'coffin' : 'almond';
  else if (tipTaper < 0.72) shape = 'oval';
  else shape = aspect > 1.4 ? 'square' : 'round';

  const confidence = Math.min(0.97,
    baseConf + (aspect > 1 ? 0.2 : 0) + (frac > 0.04 && frac < 0.7 ? 0.25 : 0));
  return { shape, confidence: Number(confidence.toFixed(2)) };
}

/**
 * TEK TIRNAK YAKIN ÇEKİMİNDEN tırnak şeklini konturdan tahmin eder (MediaPipe/ML gerektirmez).
 * Merkezden renk-benzerliğiyle taşma-doldurma (flood fill) yaparak tırnak plakasını maske olarak
 * ayıklar, sonra classifyMaskShape ile sınıflar. ML modeli yoksa kullanılan güvenilir yöntem budur.
 */
export function detectNailShapeCloseup(source: HTMLCanvasElement): CloseupResult {
  const none: CloseupResult = { shape: null, confidence: 0 };
  const maxDim = 360;
  const scale = Math.min(1, maxDim / Math.max(source.width, source.height));
  const w = Math.max(16, Math.round(source.width * scale));
  const h = Math.max(16, Math.round(source.height * scale));
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const ctx = off.getContext('2d', { willReadFrequently: true });
  if (!ctx) return none;
  ctx.drawImage(source, 0, 0, w, h);

  let img: Uint8ClampedArray;
  try { img = ctx.getImageData(0, 0, w, h).data; } catch { return none; }

  // Merkez bölgesinin ortalama rengi = tırnak tohumu
  let sr = 0, sg = 0, sb = 0, n = 0;
  const x0 = Math.round(w * 0.4), x1 = Math.round(w * 0.6);
  const y0 = Math.round(h * 0.4), y1 = Math.round(h * 0.6);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) { const i = (y * w + x) * 4; sr += img[i]; sg += img[i + 1]; sb += img[i + 2]; n++; }
  }
  if (n === 0) return none;
  const seed = { r: sr / n, g: sg / n, b: sb / n };

  const tol = 48;
  const near = (i: number): boolean => {
    const p = i * 4;
    const dr = img[p] - seed.r, dg = img[p + 1] - seed.g, db = img[p + 2] - seed.b;
    return Math.sqrt(dr * dr + dg * dg + db * db) < tol;
  };
  const mask = new Uint8Array(w * h);
  const stack: number[] = [Math.round(h / 2) * w + Math.round(w / 2)];
  while (stack.length) {
    const p = stack.pop();
    if (p === undefined || mask[p]) continue;
    if (!near(p)) continue;
    mask[p] = 1;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }

  return classifyMaskShape(mask, w, h, 0.45);
}
