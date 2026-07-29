// ngNailArt — ESKİ iyzico ödemelerinin maskeli kart bilgisini (ilk4 **** **** son4)
// iyzico'dan yeniden sorgulayıp Order tablosuna doldurur (tek seferlik/tekrarlanabilir).
// Kullanım: kart-doldur.bat (çift tık)  ·  ya da:  cd server && node scripts/kart-doldur.js
// NOT: Tam kart numarası HİÇBİR ZAMAN alınmaz/saklanmaz — iyzico yalnızca BIN + son 4 verir.
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const payments = require('../payments');
const prisma = new PrismaClient();

(async () => {
  console.log('\n=== Eski iyzico ödemelerine kart maskesi doldurma ===\n');
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'paid', provider: 'iyzico', cardMask: '' },
      orderBy: { id: 'asc' },
    });
    if (!orders.length) {
      console.log('  Doldurulacak kayıt yok — tüm iyzico ödemelerinde kart maskesi zaten dolu.\n');
      return;
    }
    console.log(`  ${orders.length} kayıt bulundu, iyzico'dan sorgulanıyor...\n`);
    let ok = 0, fail = 0;
    for (const o of orders) {
      const ref = o.providerRef || o.ref;
      try {
        const v = await payments.verifyPayment({ provider: 'iyzico', ref, amount: o.amount, currency: o.currency });
        if (v && v.cardMask) {
          await prisma.order.update({ where: { id: o.id }, data: { cardMask: v.cardMask, cardBrand: v.cardBrand || '' } });
          console.log(`  ✓ sipariş ${o.id}: ${v.cardMask}${v.cardBrand ? ' (' + v.cardBrand + ')' : ''}`);
          ok++;
        } else {
          console.log(`  - sipariş ${o.id}: alınamadı (${(v && v.status) || 'bilinmiyor'})`);
          fail++;
        }
      } catch (e) {
        console.log(`  - sipariş ${o.id}: hata — ${e.message}`);
        fail++;
      }
    }
    console.log(`\n✓ BİTTİ — dolduruldu: ${ok} · alınamadı: ${fail}`);
    if (fail) console.log('  Not: çok eski kayıtlarda iyzico token süresi dolmuş olabilir; onlar "-" kalır.');
    console.log('  Demo/PayTR ödemelerinde kart bilgisi yoktur ("-" normaldir).');
    console.log('  Raporu tazele: rapor-kur.bat / rapor-html.bat\n');
  } catch (e) {
    console.error('\n❌ Hata:', e.message);
    console.error('Not: Önce yerel-pg-baslat.bat ile şemanın güncel olması (cardMask sütunu) gerekir.\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
