@echo off
REM ngNailArt - CANLI TEST AJANI
REM Cift tikla: yayindaki siteyi (miracle-nailart.onrender.com) bastan sona test eder.
REM   1) Site uyaniyor mu / saglikli mi        4) Galeri fotograflari geliyor mu
REM   2) Ana sayfa aciliyor mu                 5) Kesfet kartlari gorunuyor mu
REM   3) Donma var mi                          6) Giris sistemi calisiyor mu
REM                                            7) Admin sayfasi aciliyor mu
REM Not: Site uykudaysa ilk test uyandirir (1-2 dk surebilir) - sabret.
cd /d "%~dp0"

echo.
echo ============================================================
echo   CANLI TEST AJANI - miracle-nailart.onrender.com
echo   (site uykudaysa ilk adim 1-2 dakika surebilir)
echo ============================================================
echo.

call npx playwright test --config=playwright.canli.config.ts

echo.
echo ============================================================
echo   TEST BITTI. Yukarida her maddenin sonucu yazili:
echo     ok / passed  = calisiyor
echo     failed       = sorun var (satirdaki aciklamayi Claude'a ilet)
echo ============================================================
echo.
pause
