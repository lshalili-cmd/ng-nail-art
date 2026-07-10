# ngNailArt — Guncelle: Indirilenler'deki EN SON ngNailArt*.zip'i bulup
# D:\leman\ngNailArt'a cikarir. Cift tikla (guncelle.bat) yeter.
$ErrorActionPreference = 'Stop'
$dest = 'D:\leman\ngNailArt'
$zip = Get-ChildItem "$HOME\Downloads\ngNailArt*.zip" -ErrorAction SilentlyContinue |
       Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $zip) {
    Write-Host "Indirilenler'de ngNailArt*.zip bulunamadi. Once ZIP'i indir." -ForegroundColor Yellow
} else {
    Expand-Archive -Path $zip.FullName -DestinationPath $dest -Force
    Write-Host "Cikarildi: $($zip.Name)  ->  $dest" -ForegroundColor Green
    Write-Host "Tarayicida F5 yeterli (run.bat aciksa kendi yenilenir)." -ForegroundColor Gray
}
