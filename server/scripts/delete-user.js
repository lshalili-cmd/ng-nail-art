// Tek seferlik kullanıcı silme yardımcı betiği.
// Kullanım:  node scripts/delete-user.js [email]
// email verilmezse varsayılan olarak test kullanıcısını siler.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const email = (process.argv[2] || 'testuser@ngnail.local').toLowerCase();

(async () => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { console.log(`Kullanıcı bulunamadı: ${email}`); return; }
    const uid = String(user.id);
    // Kullanıcıya bağlı test verilerini de temizle
    await prisma.favorite.deleteMany({ where: { userId: uid } }).catch(() => {});
    await prisma.scanAnalysis.deleteMany({ where: { userId: uid } }).catch(() => {});
    await prisma.order.deleteMany({ where: { userId: uid } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } });
    console.log(`✓ Silindi: ${email} (id ${user.id}) ve bağlı verileri.`);
  } catch (e) {
    console.error('Silme hatası:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
