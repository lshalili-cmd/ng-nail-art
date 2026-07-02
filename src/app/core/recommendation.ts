// Miracle Nail Art AI — Öneri motoru (eski projedeki 133 puanlık skorlamanın Angular portu)
// Girdi: el analizi (cilt tonu, alt ton, parmak yapısı, şekil, LAB) + tasarım kataloğu.
// Çıktı: eşleşme yüzdesi ve gerekçelerle sıralı tasarımlar.

import { Design } from './data.service';
import { Lab, ToneKey, Undertone } from './skin-tone';
import { FingerLength } from './hand-analysis.service';

export interface AnalysisInput {
  toneKey: ToneKey | null;
  undertone: Undertone | null;
  fingerLength: FingerLength | null;
  nailShape: string | null;
  lab: Lab | null;
}

export interface ScoredDesign extends Design {
  matchScore: number;   // 0-99 (%)
  reasons: string[];    // i18n anahtar sonları (reason_*)
}

// 8 seviyeli ten tonu komşuluk sırası (mesafe skorlaması için)
const TONE_ORDER: ToneKey[] = [
  'very_fair', 'fair', 'light_wheat', 'wheat', 'tan', 'dark_tan', 'dark_brown', 'very_dark',
];

// Şekil uyumluluk matrisi
const SHAPE_COMPAT: Record<string, { perfect: string[]; good: string[]; ok: string[] }> = {
  oval: { perfect: ['oval'], good: ['almond', 'round'], ok: ['squoval'] },
  almond: { perfect: ['almond'], good: ['oval', 'coffin'], ok: ['stiletto'] },
  round: { perfect: ['round'], good: ['oval', 'squoval'], ok: [] },
  square: { perfect: ['square'], good: ['squoval', 'coffin'], ok: [] },
  squoval: { perfect: ['squoval'], good: ['square', 'oval', 'round'], ok: [] },
  coffin: { perfect: ['coffin'], good: ['almond', 'stiletto', 'square'], ok: [] },
  stiletto: { perfect: ['stiletto'], good: ['almond', 'coffin'], ok: [] },
};

// Parmak uzunluğu → uygun şekiller
const FINGER_SHAPE_COMPAT: Record<string, string[]> = {
  long: ['square', 'coffin', 'stiletto', 'almond'],
  short: ['oval', 'almond', 'round'],
  medium: ['oval', 'almond', 'squoval', 'coffin', 'round'],
};

function currentSeason(month: number): string {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

const MAX = 117;

export function recommend(a: AnalysisInput, designs: Design[], month: number): ScoredDesign[] {
  const season = currentSeason(month);

  const scored = designs.map((d) => {
    let score = 0;
    const reasons: string[] = [];

    // ── Tırnak şekli (0-35) — birincil faktör ──
    if (a.nailShape) {
      const compat = SHAPE_COMPAT[a.nailShape] ?? { perfect: [a.nailShape], good: [], ok: [] };
      if (d.shapes.includes(a.nailShape) || d.shapes.some((s) => compat.perfect.includes(s))) {
        score += 35; reasons.push('shape');
      } else if (d.shapes.some((s) => compat.good.includes(s))) {
        score += 18; reasons.push('shape');
      } else if (d.shapes.some((s) => compat.ok.includes(s))) {
        score += 8;
      }
    }

    // ── Parmak yapısı (0-12) ──
    if (a.fingerLength && FINGER_SHAPE_COMPAT[a.fingerLength]) {
      if (d.shapes.some((s) => FINGER_SHAPE_COMPAT[a.fingerLength as string].includes(s))) {
        score += 12; reasons.push('finger');
      }
    }

    // ── Cilt tonu (0-30) — komşuluk skorlaması ──
    if (a.toneKey) {
      if (d.tones.includes(a.toneKey)) {
        score += 30; reasons.push('tone');
      } else {
        const ui = TONE_ORDER.indexOf(a.toneKey);
        let minDist = 99;
        for (const dt of d.tones) {
          const di = TONE_ORDER.indexOf(dt as ToneKey);
          if (di >= 0 && ui >= 0) minDist = Math.min(minDist, Math.abs(ui - di));
        }
        if (minDist === 1) { score += 12; reasons.push('tone'); }
        else if (minDist === 2) { score += 4; }
      }
    }

    // ── Alt ton (0-15) ──
    if (a.undertone) {
      if (d.undertones.includes(a.undertone)) {
        score += 15; reasons.push('undertone');
      } else if (a.undertone === 'neutral') {
        score += 7;
      }
    }

    // ── Renk uyumu (0-8) — LAB tabanlı kontrast/tamamlayıcı ──
    if (a.lab) {
      const { L, b } = a.lab;
      if (L > 65 && d.colors.some((c) => ['dark', 'black', 'deep', 'wine', 'burgundy', 'navy'].includes(c))) {
        score += 5; reasons.push('contrast');
      }
      if (L < 50 && d.colors.some((c) => ['white', 'pastel', 'light', 'nude', 'cream', 'ivory', 'pearl'].includes(c))) {
        score += 5; reasons.push('contrast');
      }
      if (b > 15 && d.colors.some((c) => ['silver', 'blue', 'cool', 'purple', 'ice', 'chrome'].includes(c))) {
        score += 3; reasons.push('harmony');
      }
      if (b < 10 && d.colors.some((c) => ['gold', 'warm', 'copper', 'bronze', 'amber'].includes(c))) {
        score += 3; reasons.push('harmony');
      }
    }

    // ── Mevsim (0-8) ──
    if (d.seasons.includes('all') || d.seasons.includes(season)) {
      score += 8; reasons.push('season');
    }

    // ── Popülerlik (0-3) ──
    if (d.popular) score += 2;
    if (d.rating > 4.5) score += 1;

    const pct = Math.min(99, Math.round((score / MAX) * 100));
    return { ...d, matchScore: pct, reasons: Array.from(new Set(reasons)) };
  });

  return scored.sort((x, y) => y.matchScore - x.matchScore);
}
