// Bir kullanıcıyı YÖNETİCİ (admin) yapar.
// Kullanım:  node scripts/make-admin.js <email>
// Geri almak için: node scripts/make-admin.js <email> user
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const email = (process.argv[2] || '').toLowerCase().trim();
const role = (process.argv[3] || 'admin').toLowerCase().trim() === 'user' ? 'user' : 'admin';

(async () => {
  if (!email) { console.error('Kullanım: node scripts/make-admin.js <email> [admin|user]'); process.exit(1); }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { console.error(`Kullanıcı bulunamadı: ${email}  (önce uygulamadan bu e-posta ile kayıt olun)`); process.exit(1); }
    const u = await prisma.user.update({ where: { id: user.id }, data: { role } });
    console.log(`✓ ${u.email} artık: ${u.role}`);
  } catch (e) {
    console.error('Hata:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
