@echo off
REM ngNailArt — cift tikla: en son inen ngNailArt zip'ini otomatik cikarir
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0guncelle.ps1"
pause
