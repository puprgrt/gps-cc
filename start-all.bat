@echo off
TITLE GPS-CC Launcher - Garut Public Service AI Command Center
COLOR 0A
echo ============================================================
echo   GPS-CC GARUT PUBLIC SERVICE AI COMMAND CENTER LAUNCHER
echo ============================================================
echo.

REM Memastikan PATH menyertakan Node.js jika belum terdaftar secara global
SET "VS_NODE=C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Microsoft\VisualStudio\NodeJs"
IF EXIST "%VS_NODE%" (
    SET "PATH=%VS_NODE%;%PATH%"
)

echo [1/2] Memulai Baileys WhatsApp Backend Server (Port 3001)...
start "PUPR Garut - Baileys WhatsApp Server" cmd /k "SET PATH=%PATH% && cd /d "%~dp0" && npm run server:baileys"

echo [2/2] Memulai Next.js Production Web App (Port 3000)...
start "PUPR Garut - Next.js Command Center" cmd /k "SET PATH=%PATH% && cd /d "%~dp0" && npm run start"

echo.
echo ============================================================
echo   KEDUA SERVER BERHASIL DIJALANKAN!
echo   - Web App Command Center : http://localhost:3000
echo   - Baileys WhatsApp Server: http://localhost:3001
echo ============================================================
echo.
pause
