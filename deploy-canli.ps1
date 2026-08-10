# ngNailArt — Canliya deploy: Angular build alir, Plesk/IIS'in gercek sundugu
# httpdocs klasorune kopyalar. VDS'te (ng-nail-art-live klasorunde) calistirilir.
# Onemli: git pull bu script'e DAHIL DEGIL — deploy'dan once "git pull origin main"
# ile son degisiklikleri kendin cekmelisin (boylece ne geldigini gorup onaylarsin).
$ErrorActionPreference = 'Stop'

Write-Host "============================================================"
Write-Host "  NGNAILART -- CANLIYA DEPLOY"
Write-Host "============================================================"

$repoRoot = $PSScriptRoot
Set-Location $repoRoot

Write-Host "`n[1/3] Angular build aliniyor..."
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "HATA: build basarisiz oldu (yukarida detay var)." -ForegroundColor Red
  exit 1
}

Write-Host "`n[2/3] IIS'teki 'ngnailart.com' sitesinin gercek yolu bulunuyor..."
Import-Module WebAdministration -ErrorAction SilentlyContinue
$site = Get-Website -Name "ngnailart.com" -ErrorAction SilentlyContinue
if (-not $site) {
  Write-Host "HATA: IIS'te 'ngnailart.com' adinda bir site bulunamadi." -ForegroundColor Red
  Write-Host "      'Get-Website' ciktisinda site adini kontrol et, script'teki adi guncelle." -ForegroundColor Yellow
  exit 1
}
$dest = $site.PhysicalPath
Write-Host "  Hedef: $dest"

$source = Join-Path $repoRoot "dist\ng-nail-art\browser"
if (-not (Test-Path $source)) {
  Write-Host "HATA: Build ciktisi bulunamadi: $source" -ForegroundColor Red
  exit 1
}

Write-Host "`n[3/3] Dosyalar kopyalaniyor (robocopy /E -- var olan designs/images klasorlerine dokunmaz)..."
robocopy $source $dest /E
$rc = $LASTEXITCODE
# robocopy icin 0-7 basarili sayilir; 8 ve uzeri gercek hata demektir.
if ($rc -ge 8) {
  Write-Host "`nHATA: robocopy kod $rc ile basarisiz oldu." -ForegroundColor Red
  exit 1
}

Write-Host "`n============================================================"
Write-Host "  TAMAM. https://ngnailart.com adresini sert yenileyerek (Ctrl+Shift+R) kontrol et."
Write-Host "============================================================"
