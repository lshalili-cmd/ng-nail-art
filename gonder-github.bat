@echo off
REM ngNailArt — GUVENLI push: once .env dosyalarini takipten cikarir, sonra commit + push.
cd /d "%~dp0"

echo.
echo ============================================================
echo   GITHUB'A GONDER (once .env guvenligi, sonra push)
echo ============================================================
echo.

echo [1/4] Sir dosyalari (.env*) takipten cikariliyor (varsa)...
for /f "delims=" %%f in ('git ls-files "*.env" "*.env.*" 2^>nul') do (
  echo    - takipten cikariliyor: %%f
  git rm --cached "%%f" >nul 2>&1
)

echo [2/4] Kontrol: hala izlenen .env var mi?
git ls-files "*.env" "*.env.*" > "%TEMP%\ngnail_envcheck.txt" 2>nul
for /f %%s in ("%TEMP%\ngnail_envcheck.txt") do set ENVSIZE=%%~zs
if not "%ENVSIZE%"=="0" (
  echo    !!! UYARI: Hala izlenen .env dosyasi var. Yukaridakileri kontrol et. Push DURDURULDU.
  type "%TEMP%\ngnail_envcheck.txt"
  pause & exit /b 1
)
echo    Temiz — izlenen .env yok.

echo [3/4] Degisiklikler ekleniyor ve commit ediliyor...
git add -A
git commit -m "Guvenlik: IDOR/plan/tutar duzeltmeleri + .env.* gitignore + testler" 2>nul
if errorlevel 1 echo    ^(Yeni commit yok — dogrudan push denenecek.^)

echo [4/4] GitHub'a push...
git push origin main
if errorlevel 1 goto :err

echo.
echo ============================================================
echo   TAMAM. Render birkac dakikada canliya alir.
echo ============================================================
echo.
pause
goto :eof

:err
echo.
echo !!! Push hatasi. Yukaridaki mesaji Claude'a ilet.
echo.
pause
