@echo off
REM ngNailArt — TEK TIK: yerel SQLite'e DOGRULANMIS bir UYE ekler (1 bedava hak ile).
REM Cift tikla. Backend'in acik olmasi GEREKMEZ; bu betik dogrudan veritabanina yazar.
cd /d "%~dp0server"

REM Veritabanini yerel SQLite'a zorla (yerel-baslat ile ayni)
set "DATABASE_URL=file:./dev.db"

echo.
echo ============================================================
echo   YENI UYE OLUSTUR (yerel test - SQLite)
echo ============================================================
echo.
echo   E-posta : uye@demo.com
echo   Sifre   : a12345
echo.
echo   (Farkli bilgi istersen:  node scripts\create-member.js  eposta  sifre)
echo.

node scripts\create-member.js
if errorlevel 1 goto :err

echo.
echo ============================================================
echo   HAZIR. Tarayicida:  http://localhost:4200/profile  -> Giris Yap
echo   uye@demo.com  /  a12345
echo ============================================================
echo.
pause
goto :eof

:err
echo.
echo !!! Hata olustu. Once yerel-baslat.bat ile DB kurulu olmali.
echo     Yukaridaki mesaji Claude'a iletebilirsin.
echo.
pause
