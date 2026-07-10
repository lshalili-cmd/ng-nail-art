import { Injectable } from '@angular/core';
import { renderNailThumb } from './nail-art';

export interface Design {
  id: number;
  name: string;
  artist: string;
  badge?: 'trending' | 'new' | 'premium';
  grad: string;          // CSS gradient (görsel yüklenemezse yedek)
  photo?: string;        // STATİK katalog görseli (public/designs/*.jpg) — bir kez üretilir, bedava
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

// Lüks degrade placeholder'lar — gerçek AI görselleri entegrasyonda gelecek
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

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly all: Design[] = [
    { id: 1, name: 'Gold Chrome', artist: 'Luna Design', badge: 'trending', grad: G.gold, category: 'luxury',
      shapes: ['almond', 'coffin', 'stiletto'], tones: ['tan', 'dark_tan', 'wheat'], undertones: ['warm'],
      seasons: ['fall', 'winter'], colors: ['gold', 'chrome', 'warm', 'metallic'], popular: true, rating: 4.8 },
    { id: 2, name: 'Pink Ombré', artist: 'Rose Studio', badge: 'new', grad: G.rose, category: 'trendy',
      shapes: ['oval', 'almond', 'squoval'], tones: ['very_fair', 'fair', 'light_wheat'], undertones: ['cool', 'neutral'],
      seasons: ['spring', 'summer'], colors: ['pink', 'rose', 'pastel'], popular: true, rating: 4.6 },
    { id: 3, name: 'Galaxy Dreams', artist: 'Nova Nails', badge: 'premium', grad: G.galaxy, category: 'trendy',
      shapes: ['coffin', 'stiletto', 'almond'], tones: ['fair', 'light_wheat', 'tan'], undertones: ['cool'],
      seasons: ['winter'], colors: ['blue', 'purple', 'dark', 'glitter'], popular: false, rating: 4.4 },
    { id: 4, name: 'French Gold', artist: 'Élite Art', badge: 'trending', grad: G.pearl, category: 'bridal',
      shapes: ['oval', 'almond', 'squoval', 'round'], tones: ['very_fair', 'fair', 'wheat'], undertones: ['neutral', 'warm'],
      seasons: ['all'], colors: ['nude', 'white', 'gold', 'cream'], popular: true, rating: 4.9 },
    { id: 5, name: 'Emerald Marble', artist: 'Jade Studio', badge: 'new', grad: G.emerald, category: 'luxury',
      shapes: ['squoval', 'square', 'oval'], tones: ['tan', 'dark_tan', 'dark_brown'], undertones: ['cool', 'warm'],
      seasons: ['fall', 'winter'], colors: ['green', 'emerald', 'dark'], popular: false, rating: 4.3 },
    { id: 6, name: 'Nude Gold Line', artist: 'Minimal Co', badge: 'premium', grad: G.nude, category: 'minimal',
      shapes: ['oval', 'almond', 'squoval'], tones: ['light_wheat', 'wheat', 'tan'], undertones: ['neutral', 'warm'],
      seasons: ['all'], colors: ['nude', 'gold', 'cream', 'warm'], popular: true, rating: 4.7 },
    { id: 7, name: 'Bridal Pearl', artist: 'Wedding Art', badge: 'new', grad: G.pearl, category: 'bridal',
      shapes: ['almond', 'oval', 'coffin'], tones: ['very_fair', 'fair', 'light_wheat'], undertones: ['cool', 'neutral'],
      seasons: ['spring', 'all'], colors: ['white', 'pearl', 'pastel', 'silver'], popular: false, rating: 4.5 },
    { id: 8, name: 'Red Chrome', artist: 'Bold Studio', badge: 'trending', grad: G.red, category: 'luxury',
      shapes: ['stiletto', 'coffin', 'almond'], tones: ['fair', 'wheat', 'tan', 'dark_brown'], undertones: ['warm', 'cool'],
      seasons: ['winter', 'fall'], colors: ['red', 'chrome', 'dark', 'bold'], popular: true, rating: 4.6 },
    { id: 9, name: 'Silver Frost', artist: 'Ice Studio', badge: 'premium', grad: G.chrome, category: 'minimal',
      shapes: ['square', 'squoval', 'oval'], tones: ['very_fair', 'fair'], undertones: ['cool'],
      seasons: ['winter'], colors: ['silver', 'white', 'chrome', 'ice'], popular: false, rating: 4.2 },
  ];

  constructor() {
    // id → çizim deseni
    const patterns: Record<number, string> = {
      1: 'chrome', 2: 'ombre', 3: 'galaxy', 4: 'french', 5: 'marble',
      6: 'line', 7: 'glossy', 8: 'chrome', 9: 'chrome',
    };
    // Her tasarım için:
    //  - photo: STATİK katalog görseli (public/designs/design-<id>.jpg). Bir kez üretilir,
    //    çalışma anında AI çağrısı YOK, maliyet YOK. Dosya yoksa img'e düşülür (design-card).
    //  - img: istemci tarafı çizilen tırnak önizlemesi (statik dosya gelene kadar yedek).
    for (const d of this.all) {
      d.pattern = patterns[d.id] ?? 'glossy';
      // GALERİ: statik görsel (public/designs/design-<id>.jpg) — kendi nail art görsellerin.
      // Dosya yoksa design-card otomatik çizime düşer.
      d.photo = d.photo ?? `designs/design-${d.id}.jpg`;
      d.img = renderNailThumb(d.colors, d.pattern);
    }

    // nail-art projesinden gelen SHOWCASE görselleri → galeriye ek tasarımlar.
    // Görseller public/images/showcase_*.png içinde.
    const grads = [G.nude, G.rose, G.gold, G.emerald, G.chrome, G.pearl, G.galaxy];
    let nid = 100;
    const shapeSc = ['almond', 'coffin', 'oval', 'round', 'square', 'squoval', 'stiletto'];
    shapeSc.forEach((sh, i) => {
      const d: Design = {
        id: nid++, name: sh.charAt(0).toUpperCase() + sh.slice(1), artist: 'Showcase',
        grad: grads[i % grads.length], category: 'trendy', photo: `images/showcase_${sh}.png`, pattern: 'glossy',
        shapes: [sh], tones: ['fair', 'wheat', 'tan'], undertones: ['neutral', 'warm'],
        seasons: ['all'], colors: ['nude', 'gold'], popular: false, rating: 4.6,
      };
      d.img = renderNailThumb(d.colors, d.pattern);
      this.all.push(d);
    });
  }

  readonly trending: Design[] = this.all.filter((d) => d.badge === 'trending' || d.popular).slice(0, 5);
  readonly aiPicks: Design[] = this.all.slice(5);
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
