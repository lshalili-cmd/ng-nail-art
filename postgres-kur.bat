@echo off
REM ngNailArt — PostgreSQL'i Windows'un winget araciyla UCRETSIZ kurar (EDB web sayfasina girmeden).
REM Kurulum penceresi acilir: sadece 'postgres' SIFRESINI belirle (harf+rakam), gerisi Ileri-Ileri.

echo.
echo ============================================================
echo   PostgreSQL UCRETSIZ KURULUM (winget ile)
echo ============================================================
echo.
echo   Simdi resmi PostgreSQL installer'i indirilip baslatilacak.
echo   Acilan pencerede:
echo     - 'postgres' kullanicisi icin bir SIFRE belirle (sadece harf+rakam).
echo     - Port: 5432 (varsayilan) kalsin.
echo     - Diger adimlar: Ileri / Next.
echo.
pause

winget install -e --id PostgreSQL.PostgreSQL.17
if errorlevel 1 (
  echo.
  echo   17 bulunamadi, genel paket deneniyor...
  winget install -e --id PostgreSQL.PostgreSQL
)
if errorlevel 1 goto :err

echo.
echo ============================================================
echo   KURULUM BITTI. Simdi:  yerel-pg-baslat.bat  calistir.
echo   (Belirledigin 'postgres' sifresini soracak.)
echo ============================================================
echo.
pause
goto :eof

:err
echo.
echo !!! winget bulunamadi veya kurulum yarim kaldi.
echo   - Windows 10/11 guncel degilse winget olmayabilir.
echo   - Bu durumda bana yaz; kurulumsuz (zip) yontemi adim adim veririm.
echo.
pause
