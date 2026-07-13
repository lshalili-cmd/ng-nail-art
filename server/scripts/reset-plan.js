// TEST YARDIMCISI — Tüm kullanıcıların plan/kota durumunu SIFIRLAR.
// Plan → free, aktif paket → yok, kullanılan/ek görsel → 0.
// Böylece mağazada "limit doldu / kilitli" durumu kalkar ve tekrar satın alma test edilebilir.
// Kullanım (server klasöründe):  node scripts/reset-plan.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const r = await prisma.user.updateMany({
      data: { plan: 'free', planSince: 0, packId: null, packSince: 0, imagesUsed: 0, imagesExtra: 0 },
    });
    console.log('');
    console.log('✓ Sifirlandi:', r.count, 'kullanici');
    console.log('  plan = free · aktif paket = yok · kota = sifir');
    console.log('  Uygulamada CIKIS yapip tekrar GIRIS yapinca limit kalkacak.');
    console.log('');
  } catch (e) {
    console.error('Hata:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
