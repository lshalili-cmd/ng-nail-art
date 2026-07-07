param([switch]$Lint)
$ErrorActionPreference = 'Continue'
$root = $PSScriptRoot; Set-Location $root
$reportsDir = Join-Path $root 'test-reports'
New-Item -ItemType Directory -Force -Path $reportsDir | Out-Null
$human = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = Join-Path $reportsDir "rapor-$stamp.txt"
function Run-Cmd([string]$cmd) {
    $out = & cmd.exe /c $cmd 2>&1 | Out-String
    return [pscustomobject]@{ Code = $LASTEXITCODE; Out = $out }
}
$git = (Run-Cmd 'git rev-parse --short HEAD').Out.Trim()
if (-not $git) { $git = 'yok' }
Write-Host ""
Write-Host "=== ngNailArt TEST AJANI ===  $human  (git: $git)" -ForegroundColor Magenta
Write-Host ""
Write-Host "[1/3] Derleme (ng build)... (30-60 sn surebilir)" -ForegroundColor Cyan
$build = Run-Cmd 'npx.cmd ng build'
$buildOk = ($build.Code -eq 0)
Write-Host ("      -> " + $(if ($buildOk) { 'BASARILI' } else { 'HATA' })) -ForegroundColor $(if ($buildOk) { 'Green' } else { 'Red' })
Write-Host "[2/3] Birim testler (vitest)..." -ForegroundColor Cyan
$unit = Run-Cmd 'npx.cmd vitest run'
$unitOk = ($unit.Code -eq 0)
$pass = 0; $fail = 0
if ($unit.Out -match '(?s).*(\d+)\s+passed') { $pass = [int]$Matches[1] }
if ($unit.Out -match '(?s).*(\d+)\s+failed') { $fail = [int]$Matches[1] }
Write-Host ("      -> $pass gecti, $fail kaldi") -ForegroundColor $(if ($unitOk) { 'Green' } else { 'Red' })
$lintStatus = 'ATLANDI'
if ($Lint) {
    Write-Host "[3/3] Lint (ng lint)..." -ForegroundColor Cyan
    $lint = Run-Cmd 'npx.cmd ng lint'
    $lintStatus = $(if ($lint.Code -eq 0) { 'TEMIZ' } else { 'UYARI/HATA' })
    Write-Host ("      -> $lintStatus") -ForegroundColor Yellow
} else {
    Write-Host "[3/3] Lint atlandi (istersen: test.bat -Lint)" -ForegroundColor DarkGray
}
$nb = $(if ($buildOk) { 'OK' } else { 'FAIL' })
$nu = $(if ($unitOk) { 'OK' } else { 'FAIL' })
$statusLine = "STATUS build=$nb unit=$nu pass=$pass fail=$fail lint=$lintStatus git=$git"
$prev = Get-ChildItem $reportsDir -Filter 'rapor-*.txt' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$changes = @(); $prevStatus = $null
if ($prev) {
    $prevStatus = Get-Content $prev.FullName | Where-Object { $_ -like 'STATUS *' } | Select-Object -First 1
    $pb = if ($prevStatus -match 'build=(\w+)') { $Matches[1] } else { '?' }
    $pu = if ($prevStatus -match 'unit=(\w+)') { $Matches[1] } else { '?' }
    $pp = if ($prevStatus -match 'pass=(\d+)') { [int]$Matches[1] } else { -1 }
    if ($pb -eq 'OK' -and $nb -eq 'FAIL') { $changes += '!!! DERLEME BOZULDU (onceki OK -> simdi FAIL). Guncellemede bir sey kirildi.' }
    if ($pb -eq 'FAIL' -and $nb -eq 'OK') { $changes += '+++ Derleme DUZELDI.' }
    if ($pu -eq 'OK' -and $nu -eq 'FAIL') { $changes += '!!! BIRIM TEST BOZULDU (onceki OK -> simdi FAIL).' }
    if ($pu -eq 'FAIL' -and $nu -eq 'OK') { $changes += '+++ Birim testler DUZELDI.' }
    if ($pp -ge 0 -and $pass -lt $pp) { $changes += "!!! Test regresyonu: onceki $pp gecti, simdi $pass." }
    if ($pp -ge 0 -and $pass -gt $pp) { $changes += "+++ $($pass - $pp) yeni test gecti." }
    if ($changes.Count -eq 0) { $changes += 'Degisiklik yok. Guvenli.' }
} else { $changes += 'Ilk calisma - onceki rapor yok (baseline kaydedildi).' }
$lines = @()
$lines += "=== ngNailArt TEST RAPORU ==="; $lines += "Tarih: $human"; $lines += "Git  : $git"; $lines += $statusLine; $lines += ""
$lines += "--- SONUCLAR ---"
$lines += ("Derleme (ng build)     : " + $(if ($buildOk) { 'BASARILI' } else { 'HATA (asagida)' }))
$lines += ("Birim testler (vitest) : $pass gecti, $fail kaldi")
$lines += ("Lint (ng lint)         : $lintStatus"); $lines += ""
$lines += "--- ONCEKI CALISMAYA GORE DEGISIM ---"
if ($prevStatus) { $lines += "Onceki: $prevStatus"; $lines += "Simdi : $statusLine" }
$lines += $changes
if (-not $buildOk) { $lines += ""; $lines += "--- DERLEME HATA CIKTISI (son satirlar) ---"; $lines += (($build.Out -split "`n") | Select-Object -Last 30) }
if (-not $unitOk) { $lines += ""; $lines += "--- BIRIM TEST CIKTISI (son satirlar) ---"; $lines += (($unit.Out -split "`n") | Select-Object -Last 25) }
$lines | Set-Content -Encoding UTF8 $reportPath
Write-Host ""; Write-Host "=============== OZET ===============" -ForegroundColor Magenta
Write-Host ("Derleme : " + $(if ($buildOk) { 'BASARILI' } else { 'HATA' })) -ForegroundColor $(if ($buildOk) { 'Green' } else { 'Red' })
Write-Host ("Testler : $pass gecti, $fail kaldi") -ForegroundColor $(if ($unitOk) { 'Green' } else { 'Red' })
Write-Host ("Lint    : $lintStatus") -ForegroundColor Yellow
Write-Host "--- Onceki calismaya gore ---" -ForegroundColor Cyan
foreach ($c in $changes) { $col = if ($c -like '!!!*') { 'Red' } elseif ($c -like '+++*') { 'Green' } else { 'Gray' }; Write-Host "  $c" -ForegroundColor $col }
Write-Host ""; Write-Host "Rapor: $reportPath" -ForegroundColor Gray
Write-Host "====================================" -ForegroundColor Magenta



