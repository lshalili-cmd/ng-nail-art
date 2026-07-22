@echo off
REM ngNailArt — CANLI YUK TESTI (senin bilgisayarindan). 30 eszamanli kullanici, 30 sn.
cd /d "%~dp0"
echo Canli yuk testi baslatiliyor... (internet gerekli)
node yuk-testi.js %*
echo.
pause
