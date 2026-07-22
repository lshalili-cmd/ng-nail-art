@echo off
REM ngNailArt — Otomatik API testleri (backend calisiyor olmali: yerel-pg-baslat / yerel-baslat).
cd /d "%~dp0"
echo Otomatik testler calisiyor (localhost:3000)...
echo.
node test-calistir.js
echo.
pause
