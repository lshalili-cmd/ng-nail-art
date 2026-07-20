@echo off
REM ngNailArt — TEK TIK: yerel SQLite'i kurar, admin olusturur ve backend'i baslatir.
REM Cift tikla, sonuna kadar bekle. Sonunda backend calisir; bu pencere ACIK kalsin.
cd /d "%~dp0server"

REM Prisma komutlari ve backend icin veritabanini yerel SQLite'a zorla
set "DATABASE_URL=file:./dev.db"

echo.
echo ============================================================
echo   YEREL KURULUM + BASLATMA (SQLite - internetsiz)
echo ============================================================
echo.

echo [1/5] Eski sunucular kapatiliyor...
taskkill /F /IM node.exe >nul 2>&1

echo [2/5] .env yerel SQLite'a ayarlaniyor (Neon yedekleniyor)...
node scripts\use-local-db.js
if errorlevel 1 goto :err

echo [3/5] Prisma istemcisi (SQLite) uretiliyor...
call npx prisma generate --schema=prisma\schema.local.prisma
if errorlevel 1 goto :err

echo [4/5] Veritabani tablolari kuruluyor...
call npx prisma db push --schema=prisma\schema.local.prisma --accept-data-loss
if errorlevel 1 goto :err

echo [5/5] Yonetici hesabi olusturuluyor (admin@demo.com / Admin123)...
call node scripts\create-admin.js

echo.
echo ============================================================
echo   KURULUM TAMAM. Backend baslatiliyor...
echo   Bu pencere ACIK kalsin. Tarayicida:
echo     http://localhost:3000/admin
echo     admin@demo.com  /  Admin123
echo ============================================================
echo.

npm start

goto :eof

:err
echo.
echo !!! Bir adimda hata olustu. Yukaridaki mesaji Claude'a iletebilirsin.
echo.
pause
