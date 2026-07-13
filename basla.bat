@echo off
REM ngNailArt — BACKEND + ONYUZ'u ayri, GORUNUR ve KALICI iki pencerede acar.
REM Cift tikla yeter. Iki pencere de acik kaldigi surece uygulama calisir.
cd /d "%~dp0"

echo.
echo ============================================
echo   ngNailArt baslatiliyor...
echo   2 pencere acilacak: BACKEND ve ONYUZ
echo   IKISINI DE KAPATMA.
echo ============================================
echo.

REM Onceki takili node sureclerini temizle (port cakismasini onler)
taskkill /F /IM node.exe >nul 2>&1

REM 1) BACKEND (port 3000) — kendi penceresinde, acik kalir (cmd /k)
start "ngNailArt BACKEND (3000)" cmd /k "cd /d "%~dp0server" && npm start"

REM Backend'e birkac saniye baslama payi ver
timeout /t 4 >nul

REM 2) ONYUZ (port 4200) — kendi penceresinde, acik kalir (cmd /k)
start "ngNailArt ONYUZ (4200)" cmd /k "cd /d "%~dp0" && npm start"

echo Iki pencere acildi.
echo   - BACKEND penceresinde:  Server http://localhost:3000  ve  hazir: iyzico
echo   - ONYUZ penceresinde:    Local: http://localhost:4200
echo Tarayici birazdan acilir. Bu pencereyi kapatabilirsin; diger iki pencere ACIK KALSIN.
echo.
pause
