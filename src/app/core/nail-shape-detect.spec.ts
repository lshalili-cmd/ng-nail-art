import { describe, it, expect } from 'vitest';
import { classifyMaskShape } from './nail-shape-detect';

function mask(w: number, h: number, fn: (x: number, y: number) => boolean): Uint8Array {
  const m = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (fn(x, y)) m[y * w + x] = 1;
  return m;
}
const W = 100, H = 100;

describe('classifyMaskShape', () => {
  it('uca doğru sivrilen üçgen → sivri şekil', () => {
    const tri = mask(W, H, (x, y) => { const hw = ((H - y) / H) * 30; return Math.abs(x - 50) < hw && y > 5 && y < 95; });
    expect(['almond', 'stiletto', 'coffin']).toContain(classifyMaskShape(tri, W, H).shape);
  });

  it('geniş blok → düz/yuvarlak şekil', () => {
    const rect = mask(W, H, (x, y) => Math.abs(x - 50) < 32 && y > 25 && y < 75);
    expect(['square', 'round', 'oval']).toContain(classifyMaskShape(rect, W, H).shape);
  });

  it('boş maske → null (algılanamadı)', () => {
    expect(classifyMaskShape(new Uint8Array(W * H), W, H).shape).toBeNull();
  });

  it('güven 0–1 aralığında', () => {
    const rect = mask(W, H, (x, y) => Math.abs(x - 50) < 25 && y > 20 && y < 80);
    const c = classifyMaskShape(rect, W, H).confidence;
    expect(c).toBeGreaterThanOrEqual(0);
    expect(c).toBeLessThanOrEqual(1);
  });
});
