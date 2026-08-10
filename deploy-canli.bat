@echo off
REM ngNailArt — Canli deploy: build al + Plesk/IIS httpdocs klasorune kopyala.
REM Kullanim: once "git pull origin main" ile guncelle, sonra bu dosyaya cift tikla.
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0deploy-canli.ps1"
pause
