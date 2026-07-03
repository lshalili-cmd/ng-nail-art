# ngNailArt — Tek Komut Geliştirme Başlatıcısı
# ------------------------------------------------------------
# Amac: elle bir sey yapmadan, kaydedilen her degisiklik otomatik derlensin
# ve tarayici kendiliginden yenilensin. GitHub'a da otomatik commit+push olsun.
#
# NEDEN --poll: Dosyalar Claude kopru ile DISARIDAN yazildiginda Windows'un
# dosya-degisti olaylari her zaman tetiklenmez; Angular izleyici degisimi kacirir
# ve ekran ESKI kalir. --poll, sunucunun dosyalari periyodik taramasini saglar;
# boylece dis yazimlar da yakalanir, otomatik derlenir ve tarayici otomatik yenilenir.
# (Boylece elle Ctrl+F5 / sunucu yeniden baslatma / cache temizleme GEREKMEZ.)
#
# Kullanim:
#   Cift tikla  ->  dev.bat
#   veya        ->  powershell -ExecutionPolicy Bypass -File .\dev.ps1
#   Secenekler:
#     -NoGit     Otomatik git eslemesini baslatma
#     -Clean     Baslamadan .angular onbellegini temizle (takilma olursa)
#     -Poll <ms> Tarama araligi (varsayilan 1500 ms)

param(
    [switch]$NoGit,
    [switch]$Clean,
    [int]$Poll = 1500
)

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

Write-Host ""
Write-Host "=============================================" -ForegroundColor Magenta
Write-Host "  ngNailArt - Otomatik Gelistirme" -ForegroundColor Magenta
Write-Host "=============================================" -ForegroundColor Magenta
Write-Host "  Klasor : $PSScriptRoot" -ForegroundColor Gray
Write-Host "  Poll   : $Poll ms (dis yazimlari yakalar)" -ForegroundColor Gray
Write-Host "  Git    : $([bool](-not $NoGit))" -ForegroundColor Gray
Write-Host "=============================================" -ForegroundColor Magenta
Write-Host ""

# Bagimliliklar
if (-not (Test-Path 'node_modules')) {
    Write-Host "Ilk kurulum: npm install ..." -ForegroundColor Yellow
    npm install
}

# Istege bagli onbellek temizligi (takilma yasanirsa)
if ($Clean -and (Test-Path '.angular')) {
    Write-Host ".angular onbellegi temizleniyor..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force '.angular'
}

# Otomatik git eslemesini ayri pencerede baslat
if (-not $NoGit -and (Test-Path 'auto-git.ps1')) {
    Write-Host "Auto-git izleyici ayri pencerede baslatiliyor..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList '-NoExit','-ExecutionPolicy','Bypass','-File','auto-git.ps1'
}

# Dev sunucu: --poll dis (kopruyle yazilan) degisimleri yakalar,
# --live-reload tarayiciyi otomatik yeniler, --open tarayiciyi bir kez acar.
Write-Host "Dev sunucu baslatiliyor (otomatik derleme + otomatik yenileme)..." -ForegroundColor Green
Write-Host "Durdurmak icin: Ctrl+C" -ForegroundColor Yellow
Write-Host ""
npx ng serve --open --host localhost --port 4200 --poll $Poll --live-reload
