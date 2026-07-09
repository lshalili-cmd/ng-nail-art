@echo off
REM ngNailArt - BEKCI: cift tikla, uygulama hep ayakta kalir (backend + on yuz).
REM Cokerse otomatik yeniden baslar. Durdurmak icin bu pencerede Ctrl+C.
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0run.ps1" %*
pause
