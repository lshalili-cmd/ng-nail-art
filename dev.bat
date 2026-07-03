@echo off
REM ngNailArt — cift tikla calistir: otomatik derleme + otomatik tarayici yenileme + otomatik git
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0dev.ps1" %*
pause
