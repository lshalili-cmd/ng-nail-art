@echo off
REM ngNailArt — TEK TIK: rapor verilerini sik bir HTML tabloya doker ve tarayicida acar.
REM Ciktilar: proje kokunde rapor.html
cd /d "%~dp0server"

echo.
echo ============================================================
echo   HTML RAPOR OLUSTURULUYOR
echo   (kullanicilar, statusler, basarili_odemeler, banlilar)
echo ============================================================

node scripts\rapor-html.js
if errorlevel 1 goto :err

echo.
echo   Tarayicida aciliyor...
start "" "%~dp0rapor.html"
echo.
echo   HAZIR. Guncel veri icin bu dosyayi tekrar calistir.
echo.
pause
goto :eof

:err
echo.
echo !!! Hata olustu. PostgreSQL calisiyor mu? server\.env postgres mi?
echo     Yukaridaki mesaji Claude'a ilet.
echo.
pause
