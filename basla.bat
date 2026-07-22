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
timeout /t 1 >nul

REM 1) BACKEND (port 3000) — server klasorunde, kendi penceresinde acik kalir.
REM    Calisma klasoru "start /D" ile verilir (ic ice tirnak sorunu olmaz).
start "ngNailArt BACKEND (3000)" /D "%~dp0server" cmd /k npm start

REM Backend'e birkac saniye baslama payi ver
timeout /t 5 >nul

REM 2) ONYUZ (port 4200) — ana klasorde, kendi penceresinde acik kalir.
REM    --poll: disaridan (Claude kopru) yazilan degisimleri yakalar, --live-reload otomatik yeniler.
start "ngNailArt ONYUZ (4200)" /D "%~dp0" cmd /k npx ng serve --open --host localhost --port 4200 --poll 1500 --live-reload

echo Iki pencere acildi.
echo   - BACKEND penceresinde:  Server http://localhost:3000  ve  hazir: iyzico
echo   - ONYUZ penceresinde:    Local: http://localhost:4200
echo Tarayici birazdan acilir. Bu pencereyi kapatabilirsin; diger iki pencere ACIK KALSIN.
echo.
pause
