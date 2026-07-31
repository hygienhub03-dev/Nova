@echo off
echo ============================================
echo   Nova PC Controller Server
echo   Remote Control for Nova Android App
echo ============================================
echo.
echo Starting Tailscale daemon...
start "" "C:\Program Files\Tailscale\tailscale.exe" up --login-server=https://controlplane.tailscale.com 2>nul
echo.
echo Waiting for Tailscale to connect...
timeout /t 3 /nobreak >nul
echo.
echo Starting Nova PC Controller Server...
echo.
python "%~dp0PCController.py"
pause