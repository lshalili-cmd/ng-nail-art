import { Injectable } from '@angular/core';
import { renderNailThumb } from './nail-art';

export interface Design {
  id: number;
  name: string;
  artist: string;
  badge?: 'trending' | 'new' | 'premium';
  grad: string;          // CSS gradient (görsel yüklenemezse yedek)
  photo?: string;        // STATİK katalog görseli (public/designs/design-<id>.jpg)
  img?: string;          // istemci tarafı çizilen tırnak önizlemesi (data URL) — statik yoksa yedek
  pattern?: string;      // çizim deseni: french | ombre | marble | galaxy | chrome | line | glossy
  category: string;
  // Öneri motoru etiketleri
  shapes: string[];      // uygun tırnak şekilleri
  tones: string[];       // uygun cilt tonları (8 seviyeli anahtarlar)
  undertones: string[];  // warm | cool | neutral
  seasons: string[];     // spring | summer | fall | winter | all
  colors: string[];      // renk etiketleri (gold, red, chrome, nude...)
  popular: boolean;
  rating: number;        // 0-5
}
export interface Artist {
  id: number;
  name: string;
  role: string;
  grad: string;
}

// Lüks degrade placeholder'lar — gerçek fotoğraf yüklenemezse yedek olarak kullanılır
const G = {
  gold: 'linear-gradient(135deg,#f3e5a8,#b8912e)',
  rose: 'linear-gradient(135deg,#e6a4c4,#8a4d67)',
  chrome: 'linear-gradient(135deg,#dfe6ee,#8a94a6)',
  galaxy: 'linear-gradient(135deg,#5b4b8a,#1b1030)',
  emerald: 'linear-gradient(135deg,#3ecf8e,#155e43)',
  nude: 'linear-gradient(135deg,#e8d5c0,#b79a7d)',
  red: 'linear-gradient(135deg,#e05a5a,#7a1f28)',
  pearl: 'linear-gradient(135deg,#fbf3e6,#cdbfa6)',
};

// ---------------------------------------------------------------------------
// KATALOG: public/designs/design-1.jpg ... design-121.jpg (senin gerçek görsellerin)
// Kod, klasördeki TÜM görselleri otomatik kataloglar. Yeni görsel eklersen
// TOTAL_DESIGNS sayısını artırman yeter (design-<id>.jpg isimlendirmesiyle).
// ---------------------------------------------------------------------------
const TOTAL_DESIGNS = 121;

const ADJ = ['Gold', 'Rose', 'Chrome', 'Galaxy', 'Emerald', 'Nude', 'Bridal', 'Ruby', 'Coral',
  'Midnight', 'Pearl', 'Velvet', 'Sunset', 'Ocean', 'Blossom', 'Amber', 'Ivory', 'Sapphire',
  'Mint', 'Lavender', 'Bronze', 'Crystal', 'Onyx', 'Champagne', 'Berry', 'Peach', 'Slate',
  'Marble', 'Neon', 'Blush', 'Cherry', 'Frost', 'Dusk', 'Aurora', 'Cocoa', 'Latte', 'Plum',
  'Teal', 'Scarlet', 'Lilac'];
const NOUN = ['Chrome', 'Ombré', 'Marble', 'Glow', 'Shine', 'French', 'Glitter', 'Matte', 'Gloss',
  'Line', 'Tip', 'Dream', 'Luxe', 'Touch', 'Art', 'Wave', 'Veil', 'Bloom', 'Mist', 'Halo'];
const ARTISTS = ['Luna Design', 'Rose Studio', 'Nova Nails', 'Élite Art', 'Jade Studio', 'Minimal Co',
  'Wedding Art', 'Bold Studio', 'Aura Lab', 'Muse Nails', 'Velvet Room', 'Studio Noir', 'Gilded Bar',
  'Bloom Atelier', 'Chic Studio', 'Maison Nail', 'Opal & Co', 'Belle Studio'];
const TONE_KEYS = ['very_fair', 'fair', 'light_wheat', 'wheat', 'tan', 'dark_tan', 'dark_brown', 'very_dark'];
const UNDER = ['warm', 'cool', 'neutral'];
const SHAPES = ['oval', 'almond', 'square', 'squoval', 'coffin', 'stiletto', 'round'];
const SEASONS = ['spring', 'summer', 'fall', 'winter', 'all'];
const CATS = ['luxury', 'trendy', 'bridal', 'minimal', 'classic', 'bold'];
const BADGES: (Design['badge'])[] = ['trending', 'new', 'premium', undefined];
const PAL = [
  { grad: G.gold, colors: ['gold', 'warm', 'metallic'], pattern: 'chrome' },
  { grad: G.rose, colors: ['pink', 'rose', 'pastel'], pattern: 'ombre' },
  { grad: G.galaxy, colors: ['blue', 'purple', 'glitter'], pattern: 'galaxy' },
  { grad: G.pearl, colors: ['nude', 'cream', 'white'], pattern: 'french' },
  { grad: G.emerald, colors: ['green', 'emerald', 'dark'], pattern: 'marble' },
  { grad: G.nude, colors: ['nude', 'gold', 'warm'], pattern: 'line' },
  { grad: G.chrome, colors: ['chrome', 'silver', 'metallic'], pattern: 'chrome' },
  { grad: G.red, colors: ['red', 'bold', 'dark'], pattern: 'glossy' },
];

/** design-<id>.jpg için çeşitlilikli katalog kaydı üretir (öneri motoru için etiketli). */
function genDesign(id: number): Design {
  const i = id - 1;
  const pal = PAL[i % PAL.length];
  const s = i % SHAPES.length;
  const t = i % TONE_KEYS.length;
  return {
    id,
    name: `${ADJ[i % ADJ.length]} ${NOUN[(i * 7 + 3) % NOUN.length]}`,
    artist: ARTISTS[i % ARTISTS.length],
    badge: BADGES[i % 4],
    grad: pal.grad,
    pattern: pal.pattern,
    category: CATS[i % CATS.length],
    shapes: [SHAPES[s], SHAPES[(s + 2) % SHAPES.length], SHAPES[(s + 4) % SHAPES.length]],
    tones: [TONE_KEYS[t], TONE_KEYS[(t + 1) % 8], TONE_KEYS[(t + 2) % 8]],
    undertones: [UNDER[i % 3]],
    seasons: [SEASONS[i % SEASONS.length]],
    colors: pal.colors,
    popular: i % 3 === 0,
    rating: Math.round((4.2 + ((i * 7) % 8) / 10) * 10) / 10,
  };
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly all: Design[] =
    Array.from({ length: TOTAL_DESIGNS }, (_unused, k) => genDesign(k + 1));

  constructor() {
    // Her tasarım için gerçek fotoğraf (public/designs/design-<id>.jpg) + yedek çizim.
    for (const d of this.all) {
      d.photo = `designs/design-${d.id}.jpg`;
      d.img = renderNailThumb(d.colors, d.pattern ?? 'glossy');
    }
  }

  // "Trend Olanlar" — badge/trend + popüler ilk 12
  readonly trending: Design[] = this.all.filter((d) => d.badge === 'trending' || d.popular).slice(0, 12);
  // "Yapay Zeka Seçimleri" — geri kalan tüm katalog
  readonly aiPicks: Design[] = this.all.slice(6);
  // Keşfet — tüm katalog (121)
  readonly explore: Design[] = this.all;

  readonly artists: Artist[] = [
    { id: 1, name: 'Luna', role: 'Luxury', grad: G.gold },
    { id: 2, name: 'Rose', role: 'Ombré', grad: G.rose },
    { id: 3, name: 'Nova', role: 'Galaxy', grad: G.galaxy },
    { id: 4, name: 'Élite', role: 'French', grad: G.pearl },
    { id: 5, name: 'Jade', role: 'Marble', grad: G.emerald },
  ];

  /** Analiz yokken gösterilecek varsayılan seçki. */
  matches(): Design[] {
    return [this.all[5], this.all[0], this.all[3], this.all[6]];
  }
}
