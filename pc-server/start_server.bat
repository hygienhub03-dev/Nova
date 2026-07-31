@echo off
echo ============================================
echo   Nova PC Controller Server Launcher
echo   Remote Control for Nova Android App
echo ============================================
echo.
echo Step 1: Checking Tailscale...
if exist "C:\Program Files\Tailscale\tailscale.exe" (
    echo Tailscale found. Starting...
    start "" "C:\Program Files\Tailscale\tailscale.exe" up --login-server=https://controlplane.tailscale.com 2>nul
) else (
    echo Tailscale not found at default location.
    echo Download from: https://tailscale.com/download/windows
)
echo.
echo Step 2: Waiting for connection...
echo Make sure your PC is connected to Tailscale.
echo (Check tailscale status at https://login.tailscale.com/admin/machines)
echo.
timeout /t 5 /nobreak >nul
echo.
echo Step 3: Getting Tailscale IP...
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr "IPv4"') do set IP=%%i
echo PC IP: %IP%
echo.
echo ============================================
echo  QR Code Data for Nova App: %IP%:8765
echo ============================================
echo.
echo Step 4: Starting Nova PC Controller...
echo   Listening on port 8765
echo   Gemini model: %GEMINI_MODEL%
echo   All remote commands will be executed on this PC
echo   Audio streams are bridged to Gemini Live API
echo.
echo Press Ctrl+C to stop the server.
echo ============================================
echo.
set GEMINI_API_KEY=%GEMINI_API_KEY%
python "%~dp0PCController.py"
pause