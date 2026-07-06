import { describe, it, expect } from 'vitest';
import { recommend } from './recommendation';
import type { Design } from './data.service';

const D = (id: number, over: Partial<Design> = {}): Design => ({
  id, name: 'd' + id, artist: 'a', grad: '', img: '', pattern: 'glossy', category: 'ai',
  shapes: ['oval'], tones: [], undertones: [], seasons: ['all'], colors: ['gold'],
  popular: false, rating: 0, ...over,
});

describe('recommendation.recommend', () => {
  const designs = [D(1, { shapes: ['almond'] }), D(2, { shapes: ['square'] }), D(3, { shapes: ['almond'] })];

  it('puanlar, azalan sıralar ve 0–99 arası kalır', () => {
    const s = recommend({ toneKey: 'fair', undertone: 'warm', fingerLength: 'long', nailShape: 'almond', lab: null }, designs, 6);
    expect(s).toHaveLength(3);
    expect(s.every((d, i, a) => i === 0 || a[i - 1].matchScore >= d.matchScore)).toBe(true);
    expect(s.every((d) => d.matchScore >= 0 && d.matchScore <= 99)).toBe(true);
  });

  it('istenen tırnak şekli en üstte sıralanır', () => {
    const s = recommend({ toneKey: 'fair', undertone: 'warm', fingerLength: 'long', nailShape: 'almond', lab: null }, designs, 6);
    expect(s[0].shapes).toContain('almond');
  });

  it('boş katalogda boş dizi döner', () => {
    expect(recommend({ toneKey: null, undertone: null, fingerLength: null, nailShape: null, lab: null }, [], 0)).toEqual([]);
  });
});
