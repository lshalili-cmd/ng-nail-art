# ngNailArt — Auto Git Sync
# Klasörü izler; değişiklik olduğunda otomatik commit + push (origin main) yapar.
# Kullanım: bu klasörde bir terminal açıp  ->  powershell -ExecutionPolicy Bypass -File .\auto-git.ps1

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

$interval = 90   # saniye (istersen değiştir)

Write-Host ""
Write-Host "=============================================" -ForegroundColor Magenta
Write-Host "  ngNailArt - Auto Git Sync" -ForegroundColor Magenta
Write-Host "=============================================" -ForegroundColor Magenta
Write-Host "  Klasor:  $projectDir" -ForegroundColor Gray
Write-Host "  Aralik:  $interval sn'de bir" -ForegroundColor Gray
Write-Host "  Durdurmak icin Ctrl+C" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Magenta
Write-Host ""

# Repo kontrolu
git rev-parse --is-inside-work-tree 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "HATA: Bu klasor bir git deposu degil. Once kurulum adimlarini yapin (git init + remote)." -ForegroundColor Red
    exit 1
}

function Get-AutoCommitMessage {
    $changedFiles = git diff --name-only HEAD 2>$null
    $untrackedFiles = git ls-files --others --exclude-standard 2>$null
    $allFiles = @()
    if ($changedFiles) { $allFiles += $changedFiles }
    if ($untrackedFiles) { $allFiles += $untrackedFiles }

    $fileCount = ($allFiles | Measure-Object).Count
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"

    $categories = @()
    foreach ($f in $allFiles) {
        if ($f -match "^src/app/pages/")  { $categories += "pages" }
        if ($f -match "^src/app/core/")   { $categories += "core" }
        if ($f -match "^src/app/shared/") { $categories += "shared" }
        if ($f -match "\.html$")          { $categories += "template" }
        if ($f -match "\.css$")           { $categories += "styles" }
        if ($f -match "\.ts$")            { $categories += "code" }
        if ($f -match "\.(png|jpg|svg|webp)$") { $categories += "assets" }
        if ($f -match "\.(json|md)$")     { $categories += "config" }
    }

    $uniqueCats = $categories | Select-Object -Unique
    if ($uniqueCats) { $scope = $uniqueCats -join ", " } else { $scope = "misc" }

    return "auto: ${scope} (${fileCount} dosya) - ${timestamp}"
}

while ($true) {
    try {
        $changes = git status --porcelain 2>$null
        if ($changes) {
            $fileCount = ($changes | Measure-Object).Count
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] " -NoNewline -ForegroundColor DarkGray
            Write-Host "$fileCount degisiklik bulundu" -ForegroundColor Yellow

            git add -A 2>$null
            $commitMsg = Get-AutoCommitMessage
            git commit -m $commitMsg 2>&1 | Out-Null

            if ($LASTEXITCODE -eq 0) {
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] " -NoNewline -ForegroundColor DarkGray
                Write-Host "Commit: $commitMsg" -ForegroundColor Green

                $pushResult = git push origin main 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] " -NoNewline -ForegroundColor DarkGray
                    Write-Host "GitHub'a push edildi" -ForegroundColor Cyan
                } else {
                    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] " -NoNewline -ForegroundColor DarkGray
                    Write-Host "Push hatasi: $pushResult" -ForegroundColor Red
                }
            }
        } else {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] " -NoNewline -ForegroundColor DarkGray
            Write-Host "Degisiklik yok" -ForegroundColor DarkGray
        }
    } catch {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] " -NoNewline -ForegroundColor DarkGray
        Write-Host "Hata: $_" -ForegroundColor Red
    }
    Start-Sleep -Seconds $interval
}
