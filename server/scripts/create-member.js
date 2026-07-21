// Kayıt/OTP GEREKTİRMEDEN doğrudan DOĞRULANMIŞ bir ÜYE (normal kullanıcı) oluşturur.
// "1 bedava hak" akışını test etmek için: hak sıfırdan (imagesUsed=0) başlar.
// Kullanım:  node scripts/create-member.js [email] [sifre] [telefon]
// Varsayılan:  uye@demo.com  /  a12345  /  +900000000002
//
// Şifre kuralı: TAM 1 harf + geri kalanı rakam, en az 6 karakter (ör. a12345).
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const email = (process.argv[2] || 'uye@demo.com').toLowerCase().trim();
const pw = process.argv[3] || 'a12345';
const phone = process.argv[4] || '+900000000002';

(async () => {
  try {
    const passwordHash = await bcrypt.hash(pw, 10);
    const u = await prisma.user.upsert({
      where: { email },
      // Var olan hesabı da SIFIRLAR: normal üye + doğrulanmış + hak sıfır (temiz test).
      update: { role: 'user', verified: true, passwordHash, plan: 'free', imagesUsed: 0, imagesExtra: 0, packId: null },
      create: { email, phone, firstName: 'Üye', lastName: '', passwordHash, verified: true, role: 'user', plan: 'free' },
    });
    console.log('');
    console.log('✓ Üye hesabı hazır (1 bedava hak ile)!');
    console.log('  E-posta :', u.email);
    console.log('  Şifre   :', pw);
    console.log('  Giriş   : http://localhost:4200/profile → Giriş Yap');
    console.log('');
  } catch (e) {
    console.error('Hata:', e.message);
    console.error('Not: Önce yerel DB kurulu olmalı (yerel-baslat.bat ya da prisma db push).');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
