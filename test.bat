@echo off
REM ngNailArt - TEST AJANI: guncellemeden once ve sonra cift tikla.
REM Derleme + birim testleri calistirir, rapor verir, onceki calismayla karsilastirir.
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0test-agent.ps1" %*
pause
