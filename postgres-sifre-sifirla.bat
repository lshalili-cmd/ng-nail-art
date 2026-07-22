@echo off
REM ngNailArt — PostgreSQL 'postgres' sifresini OTOMATIK 'test1234' yapar.
REM !!! YONETICI OLARAK CALISTIR (sag tik -> Yonetici olarak calistir) !!!
REM Yontem: pg_hba.conf gecici 'trust' -> sifre ayarla -> pg_hba geri yukle.
setlocal enabledelayedexpansion

echo ============================================================
echo   PostgreSQL SIFRE SIFIRLAMA (otomatik)
echo ============================================================

REM 1) PostgreSQL kurulum dizinini bul (en yuksek surum)
set "PGDIR="
for /d %%d in ("C:\Program Files\PostgreSQL\*") do set "PGDIR=%%d"
if not defined PGDIR (
  echo HATA: C:\Program Files\PostgreSQL altinda kurulum bulunamadi.
  pause & exit /b 1
)
echo Kurulum: %PGDIR%
set "HBA=%PGDIR%\data\pg_hba.conf"
set "PSQL=%PGDIR%\bin\psql.exe"
if not exist "%HBA%" ( echo HATA: pg_hba.conf yok: %HBA% & pause & exit /b 1 )

REM 2) Yedekle
copy /Y "%HBA%" "%HBA%.yedek" >nul
echo pg_hba.conf yedeklendi -> %HBA%.yedek

REM 3) Yerel satirlarda auth yontemini gecici 'trust' yap
powershell -NoProfile -Command "(Get-Content -Raw '%HBA%') -replace '(?m)^(host\s+all\s+all\s+(127\.0\.0\.1/32|::1/128)\s+)\S+', '$1trust' | Set-Content -NoNewline '%HBA%'"
echo Auth yontemi gecici olarak 'trust' yapildi.

REM 4) Servisi yeniden baslat
powershell -NoProfile -Command "Restart-Service -Name postgresql* -Force"
echo Servis yeniden baslatildi.

REM 5) Sifreyi ayarla (trust oldugundan sifre sormaz)
"%PSQL%" -U postgres -h 127.0.0.1 -c "ALTER USER postgres PASSWORD 'test1234';"
if errorlevel 1 (
  echo UYARI: Sifre ayarlanamadi ^(servis gec kalkmis olabilir^). pg_hba geri yukleniyor...
)

REM 6) pg_hba geri yukle + servisi tekrar baslat (guvenli hale don)
copy /Y "%HBA%.yedek" "%HBA%" >nul
powershell -NoProfile -Command "Restart-Service -Name postgresql* -Force"
echo pg_hba.conf eski haline donduruldu, servis tekrar baslatildi.

echo.
echo ============================================================
echo   TAMAM. Yeni 'postgres' sifresi:  test1234
echo   Simdi: yerel-pg-baslat.bat  calistir, sifre olarak  test1234  gir.
echo ============================================================
echo.
pause
