@echo off
REM ngNailArt — TEK TIK: eski iyzico odemelerinin maskeli kart bilgisini doldurur.
REM (Tam kart no ASLA saklanmaz; yalnizca "ilk4 **** **** son4".)
cd /d "%~dp0server"

echo.
echo ============================================================
echo   KART MASKESI DOLDURMA (eski iyzico odemeleri)
echo ============================================================

node scripts\kart-doldur.js
if errorlevel 1 goto :err

echo.
echo   Simdi raporu tazele:  rapor-kur.bat  veya  rapor-html.bat
echo.
pause
goto :eof

:err
echo.
echo !!! Hata olustu. PostgreSQL calisiyor mu? Sema guncel mi (yerel-pg-baslat.bat)?
echo     Yukaridaki mesaji Claude'a ilet.
echo.
pause
