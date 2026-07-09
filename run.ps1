# ngNailArt - BEKCI (Watchdog)
# ------------------------------------------------------------
# Amac: uygulama HER ZAMAN webde ayakta kalsin. Backend (3000) ve
# on yuz / ng serve (4200) surekli izlenir; biri kapanirsa saniyeler
# icinde otomatik yeniden baslatilir. Boylece "siteye ulasilamiyor"
# bir daha gorunmez. Tarayici, 4200 hazir olunca bir kez otomatik acilir.
#
# Kullanim:
#   Cift tikla  ->  run.bat
#   veya        ->  powershell -ExecutionPolicy Bypass -File .\run.ps1
#   Durdurmak icin bu pencerede: Ctrl+C
#
# Not: npm/npx yerine npm.cmd/npx.cmd kullanilir (PowerShell imza sorununu
# tamamen atlatir). Backend zaten calisiyorsa ikinci kez baslatilmaz.

param(
    [int]$CheckSeconds = 5,   # kac saniyede bir saglik kontrolu
    [int]$Poll = 1500,        # ng serve dosya tarama araligi (ms) - dis yazimlari yakalar
    [switch]$NoGit            # auto-git.ps1'i baslatma
)

$ErrorActionPreference = 'Continue'
$root = $PSScriptRoot
Set-Location $root

$backendDir = Join-Path $root 'server'
$autoGitPath = Join-Path $root 'auto-git.ps1'
$hasAutoGit = (-not $NoGit) -and (Test-Path $autoGitPath)

function Test-Port([int]$port) {
    try {
        $c = New-Object Net.Sockets.TcpClient
        $iar = $c.BeginConnect('127.0.0.1', $port, $null, $null)
        $ok = $iar.AsyncWaitHandle.WaitOne(700) -and $c.Connected
        $c.Close()
        return $ok
    } catch { return $false }
}

function Start-Svc([string]$name, [string]$dir, [string]$cmd) {
    Write-Host ("[bekci] {0} baslatiliyor..." -f $name) -ForegroundColor Cyan
    return Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $cmd `
        -WorkingDirectory $dir -WindowStyle Minimized -PassThru
}

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Magenta
Write-Host "  ngNailArt - BEKCI (watchdog)" -ForegroundColor Magenta
Write-Host "  Backend : http://localhost:3000" -ForegroundColor Gray
Write-Host "  On yuz  : http://localhost:4200" -ForegroundColor Gray
Write-Host "  Git     : $hasAutoGit    Kontrol: $CheckSeconds sn" -ForegroundColor Gray
Write-Host "  Durdurmak icin: Ctrl+C" -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Magenta
Write-Host ""

# Ilk kurulum: bagimliliklar
if (-not (Test-Path (Join-Path $root 'node_modules'))) {
    Write-Host "[bekci] Ilk kurulum (on yuz): npm install ..." -ForegroundColor Yellow
    & cmd.exe /c 'npm.cmd install'
}
if (-not (Test-Path (Join-Path $backendDir 'node_modules'))) {
    Write-Host "[bekci] Ilk kurulum (backend): npm install ..." -ForegroundColor Yellow
    Push-Location $backendDir; & cmd.exe /c 'npm.cmd install'; Pop-Location
}

$backend = $null
$frontend = $null
$autogit = $null
$browserOpened = $false

while ($true) {
    # --- Backend (3000) ---
    if (-not $backend -or $backend.HasExited) {
        if (-not (Test-Port 3000)) {
            $backend = Start-Svc 'Backend (3000)' $backendDir 'npm.cmd start'
            Start-Sleep -Seconds 2
        }
    }

    # --- On yuz / ng serve (4200) ---
    if (-not $frontend -or $frontend.HasExited) {
        if (-not (Test-Port 4200)) {
            $cmd = "npx.cmd ng serve --host localhost --port 4200 --poll $Poll --live-reload"
            $frontend = Start-Svc 'On yuz (4200)' $root $cmd
        }
    }

    # --- Auto-git izleyici (istege bagli) ---
    if ($hasAutoGit -and (-not $autogit -or $autogit.HasExited)) {
        $autogit = Start-Process -FilePath 'powershell.exe' `
            -ArgumentList '-ExecutionPolicy', 'Bypass', '-File', $autoGitPath `
            -WorkingDirectory $root -WindowStyle Minimized -PassThru
    }

    # --- Tarayiciyi 4200 hazir olunca bir kez ac ---
    if (-not $browserOpened -and (Test-Port 4200)) {
        Start-Process 'http://localhost:4200'
        $browserOpened = $true
        Write-Host "[bekci] Hazir. Tarayici acildi: http://localhost:4200" -ForegroundColor Green
    }

    Start-Sleep -Seconds $CheckSeconds
}
