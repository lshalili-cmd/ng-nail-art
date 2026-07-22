@echo off
REM ngNailArt — TEK TIK: rapor semasini ve 4 raporu (view) olusturur (aktif .env veritabanina).
REM kullanicilar, banli_kullanicilar, basarili_odemeler, kullanici_durumlari
cd /d "%~dp0server"

echo.
echo ============================================================
echo   RAPOR SEMASI KURULUMU
echo   (rapor: kullanicilar, banli, basarili_odemeler, statusler)
echo ============================================================

node scripts\rapor-kur.js
if errorlevel 1 goto :err

echo.
echo   HAZIR. pgAdmin4'te:  Schemas -^> rapor -^> Tables  (sag tik -^> Refresh)
echo.
pause
goto :eof

:err
echo.
echo !!! Hata olustu. PostgreSQL calisiyor mu? server\.env postgres mi?
echo     Yukaridaki mesaji Claude'a ilet.
echo.
pause
