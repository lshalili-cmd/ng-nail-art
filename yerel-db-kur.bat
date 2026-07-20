@echo off
REM ngNailArt — YEREL SQLite veritabani kurulumu (internet/Neon GEREKMEZ).
REM Cift tikla: .env'i yerele cevirir, SQLite veritabanini kurar, admin hesabini olusturur.
REM Canli site (Render) HALA Neon kullanir; bu sadece senin makinen icindir.
cd /d "%~dp0server"

echo.
echo ============================================================
echo   YEREL VERITABANI KURULUMU (SQLite - internetsiz, hizli)
echo ============================================================
echo.

echo [1/4] .env yerel SQLite'a ayarlaniyor (Neon yedekleniyor)...
node scripts\use-local-db.js
if errorlevel 1 goto :err

echo.
echo [2/4] Prisma istemcisi (SQLite) uretiliyor...
call npx prisma generate --schema=prisma\schema.local.prisma
if errorlevel 1 goto :err

echo.
echo [3/4] Veritabani tablolari olusturuluyor...
call npx prisma db push --schema=prisma\schema.local.prisma --accept-data-loss
if errorlevel 1 goto :err

echo.
echo [4/4] Yonetici hesabi olusturuluyor (admin@demo.com / Admin123)...
call node scripts\create-admin.js

echo.
echo ============================================================
echo   TAMAM! Artik internete/Neon'a bagimli degilsin.
echo   Simdi baslat:   cd /d "%~dp0server"  ve  npm start
echo   Giris: http://localhost:3000/admin
echo          admin@demo.com  /  Admin123
echo ============================================================
echo.
pause
goto :eof

:err
echo.
echo !!! Bir hata olustu. Yukaridaki mesaji Claude'a iletebilirsin.
echo.
pause
