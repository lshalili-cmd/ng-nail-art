// Kayıt/OTP GEREKTİRMEDEN doğrudan bir YÖNETİCİ hesabı oluşturur (demo giriş için).
// Kullanım:  node scripts/create-admin.js [email] [sifre]
// Varsayılan:  admin@demo.com  /  Admin123
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const email = (process.argv[2] || 'admin@demo.com').toLowerCase().trim();
const pw = process.argv[3] || 'Admin123';
const phone = process.argv[4] || '+900000000001';

(async () => {
  try {
    const passwordHash = await bcrypt.hash(pw, 10);
    const u = await prisma.user.upsert({
      where: { email },
      update: { role: 'admin', verified: true, passwordHash },
      create: { email, phone, firstName: 'Admin', lastName: '', passwordHash, verified: true, role: 'admin' },
    });
    console.log('');
    console.log('✓ Yönetici hesabı hazır!');
    console.log('  E-posta :', u.email);
    console.log('  Şifre   :', pw);
    console.log('  Giriş   : http://localhost:4200/admin');
    console.log('');
  } catch (e) {
    console.error('Hata:', e.message);
    console.error('Not: Önce "npx.cmd prisma db push" çalıştırdığından emin ol (role alanı gerekli).');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
