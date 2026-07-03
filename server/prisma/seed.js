// ngNailArt — Başlangıç verisi (birkaç örnek tasarım)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DESIGNS = [
  { name: 'Gold Chrome', artist: 'Luna Design', pattern: 'chrome', category: 'luxury',
    colors: ['gold', 'chrome', 'warm'], shapes: ['almond', 'coffin', 'stiletto'],
    tones: ['tan', 'wheat'], undertones: ['warm'], seasons: ['fall', 'winter'], popular: true, rating: 4.8, source: 'seed' },
  { name: 'Pink Ombré', artist: 'Rose Studio', pattern: 'ombre', category: 'trendy',
    colors: ['pink', 'rose', 'pastel'], shapes: ['oval', 'almond'], tones: ['very_fair', 'fair'],
    undertones: ['cool', 'neutral'], seasons: ['spring', 'summer'], popular: true, rating: 4.6, source: 'seed' },
  { name: 'French Gold', artist: 'Élite Art', pattern: 'french', category: 'bridal',
    colors: ['nude', 'white', 'gold'], shapes: ['oval', 'almond', 'squoval'], tones: ['very_fair', 'fair', 'wheat'],
    undertones: ['neutral', 'warm'], seasons: ['all'], popular: true, rating: 4.9, source: 'seed' },
  { name: 'Galaxy Dreams', artist: 'Nova Nails', pattern: 'galaxy', category: 'trendy',
    colors: ['blue', 'purple', 'dark', 'glitter'], shapes: ['coffin', 'stiletto'], tones: ['fair', 'tan'],
    undertones: ['cool'], seasons: ['winter'], popular: false, rating: 4.4, source: 'seed' },
  { name: 'Emerald Marble', artist: 'Jade Studio', pattern: 'marble', category: 'luxury',
    colors: ['green', 'emerald', 'dark'], shapes: ['squoval', 'square'], tones: ['tan', 'dark_brown'],
    undertones: ['cool', 'warm'], seasons: ['fall', 'winter'], popular: false, rating: 4.3, source: 'seed' },
];

async function main() {
  const count = await prisma.design.count();
  if (count > 0) {
    console.log(`ℹ️  Zaten ${count} tasarım var, seed atlanıyor.`);
    return;
  }
  for (const d of DESIGNS) {
    await prisma.design.create({
      data: {
        name: d.name, artist: d.artist, pattern: d.pattern, category: d.category,
        colors: JSON.stringify(d.colors), shapes: JSON.stringify(d.shapes),
        tones: JSON.stringify(d.tones), undertones: JSON.stringify(d.undertones),
        seasons: JSON.stringify(d.seasons), popular: d.popular, rating: d.rating, source: d.source,
      },
    });
  }
  console.log(`✅ ${DESIGNS.length} örnek tasarım eklendi.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
