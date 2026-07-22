@echo off
REM ngNailArt — TEST ONCESI GUVENLIK KAPISI. yerel-pg-baslat.bat ile DB ayarli olmalidir.
cd /d "%~dp0server"
node scripts\guvenlik-kontrol.js
echo.
pause
