import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * ÜYELİK KAPISI — üye olmayanları uygulama içeriğinden uzak tutar.
 * Giriş yapılmamışsa (token yoksa) kullanıcı üyelik/giriş sayfasına (/profile) yönlendirilir;
 * orada yalnızca slogan + "Giriş Yap / Kayıt Ol" görünür. Token varsa (sayfa yenilemede
 * kullanıcı henüz yüklenmemiş olabilir) içeri alınır — böylece yenilemede atılmaz.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.token() || auth.loggedIn()) return true;
  return router.parseUrl('/profile');
};
