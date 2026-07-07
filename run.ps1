param([int]$CheckSeconds = 5, [int]$Poll = 1500, [switch]$NoGit)
$ErrorActionPreference = 'Continue'
$root = $PSScriptRoot; Set-Location $root
$backendDir = Join-Path $root 'server'
$autoGitPath = Join-Path $root 'auto-git.ps1'
$hasAutoGit = (-not $NoGit) -and (Test-Path $autoGitPath)
function Test-Port([int]$port) {
  try {
    $c = New-Object Net.Sockets.TcpClient
    $iar = $c.BeginConnect('127.0.0.1', $port, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne(700) -and $c.Connected
    $c.Close(); return $ok
  } catch { return $false }
}
function Start-Svc([string]$name, [string]$dir, [string]$cmd) {
  Write-Host ("[bekci] {0} baslatiliyor..." -f $name) -ForegroundColor Cyan
  return Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $cmd -WorkingDirectory $dir -WindowStyle Minimized -PassThru
}
Write-Host "=== ngNailArt BEKCI === backend:3000  onyuz:4200  (Ctrl+C ile durdur)" -ForegroundColor Magenta
$backend=$null; $frontend=$null; $autogit=$null; $browserOpened=$false
while ($true) {
  if (-not $backend -or $backend.HasExited) {
    if (-not (Test-Port 3000)) { $backend = Start-Svc 'Backend (3000)' $backendDir 'npm.cmd start'; Start-Sleep -Seconds 2 }
  }
  if (-not $frontend -or $frontend.HasExited) {
    if (-not (Test-Port 4200)) {
      $cmd = "npx.cmd ng serve --host localhost --port 4200 --poll $Poll --live-reload"
      $frontend = Start-Svc 'On yuz (4200)' $root $cmd
    }
  }
  if ($hasAutoGit -and (-not $autogit -or $autogit.HasExited)) {
    $autogit = Start-Process -FilePath 'powershell.exe' -ArgumentList '-ExecutionPolicy','Bypass','-File',$autoGitPath -WorkingDirectory $root -WindowStyle Minimized -PassThru
  }
  if (-not $browserOpened -and (Test-Port 4200)) {
    Start-Process 'http://localhost:4200'; $browserOpened = $true
    Write-Host "[bekci] Hazir: http://localhost:4200" -ForegroundColor Green
  }
  Start-Sleep -Seconds $CheckSeconds
}
