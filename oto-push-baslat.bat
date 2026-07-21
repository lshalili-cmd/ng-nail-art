@echo off
REM ngNailArt — TEK TIK: otomatik GitHub izleyicisini baslatir (auto-git.ps1).
REM Acik kaldigi surece her ~90 sn'de bir degisiklikleri otomatik commit + push eder.
REM Bu pencereyi ACIK birak; kapatinca otomatik push durur.
cd /d "%~dp0"

echo.
echo ============================================================
echo   OTOMATIK GITHUB PUSH baslatiliyor (auto-git.ps1)
echo   Bu pencere ACIK kaldikca degisiklikler otomatik gider.
echo   Durdurmak icin: Ctrl+C veya pencereyi kapat.
echo ============================================================
echo.

powershell -ExecutionPolicy Bypass -File ".\auto-git.ps1"

pause
