@echo off
REM ngNailArt — TEK TIK: YEREL PostgreSQL ile kur, hesaplari olustur ve backend'i baslat.
REM On kosul: PostgreSQL kurulu ve calisiyor (localhost:5432), kurulumda bir 'postgres' sifresi belirledin.
REM Bu pencere backend'i calistirir; ACIK kalsin.
cd /d "%~dp0server"

echo.
echo ============================================================
echo   YEREL POSTGRESQL KURULUM + BASLATMA
echo ============================================================
echo.
echo   Not: Sifreni sadece HARF ve RAKAM olacak sekilde sec (ozel karakter yok:  @ : / ? # ).
echo.
set /p PGPASS=PostgreSQL 'postgres' kullanicisinin sifresi:

REM Yerel Postgres adresi — varsayilan 'postgres' veritabani (her zaman vardir), public sema.
set "DATABASE_URL=postgresql://postgres:%PGPASS%@localhost:5432/postgres?schema=public"

echo.
echo [1/6] Eski sunucular kapatiliyor...
taskkill /F /IM node.exe >nul 2>&1

echo [2/6] .env yerel PostgreSQL'e ayarlaniyor (Neon yedekleniyor)...
node scripts\use-local-pg.js "%DATABASE_URL%"
if errorlevel 1 goto :err

echo [3/6] Prisma istemcisi (PostgreSQL) uretiliyor...
call npx prisma generate --schema=prisma\schema.prisma
if errorlevel 1 goto :err

echo [4/6] Veritabani tablolari kuruluyor (schema.prisma)...
call npx prisma db push --schema=prisma\schema.prisma --accept-data-loss
if errorlevel 1 goto :dberr

echo [5/6] Hesaplar olusturuluyor (admin + test uyesi)...
call node scripts\create-admin.js
call node scripts\create-member.js

echo [6/6] Backend baslatiliyor...
echo.
echo ============================================================
echo   KURULUM TAMAM. Bu pencere ACIK kalsin. Tarayicida:
echo     Admin :  http://localhost:3000/admin   admin@demo.com / Admin123
echo     Uye   :  http://localhost:4200/profile  uye@demo.com  / a12345
echo   (4200 icin ayrica ng serve calisiyor olmali.)
echo ============================================================
echo.
npm start
goto :eof

:dberr
echo.
echo !!! Veritabanina baglanilamadi. Muhtemel nedenler:
echo     - PostgreSQL calismiyor (Services icinde 'postgresql' baslat).
echo     - Sifre yanlis, ya da sifrede ozel karakter var.
echo     - Port 5432 degil.
echo   Yukaridaki mesaji Claude'a iletebilirsin.
echo.
pause
goto :eof

:err
echo.
echo !!! Bir adimda hata olustu. Yukaridaki mesaji Claude'a iletebilirsin.
echo.
pause
