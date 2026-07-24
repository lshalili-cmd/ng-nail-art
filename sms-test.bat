@echo off
REM ngNailArt — Twilio SMS teshis: anahtarlar okunuyor mu, paket var mi, SMS gidiyor mu?
cd /d "%~dp0server"
echo.
set /p NUM=Test SMS gonderilecek numara (dogrulanmis, +90...):
echo.
node scripts\sms-test.js %NUM%
echo.
pause
