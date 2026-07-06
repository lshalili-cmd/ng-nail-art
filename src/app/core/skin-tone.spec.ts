import { describe, it, expect } from 'vitest';
import { rgbToHex, rgbToLab, classifyTone, detectUndertone, averageSkin } from './skin-tone';

describe('skin-tone', () => {
  it('rgbToHex biçimlendirir', () => {
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
    expect(rgbToHex({ r: 212, g: 175, b: 55 })).toBe('#d4af37');
  });

  it('rgbToLab beyaz için L≈100', () => {
    const lab = rgbToLab({ r: 255, g: 255, b: 255 });
    expect(lab.L).toBeCloseTo(100, 0);
    expect(Math.abs(lab.a)).toBeLessThan(1);
  });

  it('classifyTone: koyu ten daha düşük ITA verir', () => {
    const light = classifyTone(rgbToLab({ r: 245, g: 225, b: 210 }));
    const dark = classifyTone(rgbToLab({ r: 70, g: 45, b: 30 }));
    expect(dark.ita).toBeLessThan(light.ita);
    expect(typeof light.key).toBe('string');
  });

  it('detectUndertone geçerli bir kategori döner', () => {
    expect(['warm', 'cool', 'neutral']).toContain(detectUndertone(rgbToLab({ r: 230, g: 200, b: 150 })));
  });

  it('averageSkin pikselleri ortalar', () => {
    const avg = averageSkin(new Uint8ClampedArray([200, 100, 50, 255, 100, 50, 25, 255]));
    expect(avg.r).toBeCloseTo(150, 0);
  });
});
