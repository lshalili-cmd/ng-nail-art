@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0test-agent.ps1" %*
pause
