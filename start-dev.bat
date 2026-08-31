@echo off
TITLE GPS-CC Dev Launcher - Garut Public Service AI Command Center
COLOR 0B
echo ============================================================
echo   GPS-CC DEV LAUNCHER - PUPR KABUPATEN GARUT
echo ============================================================
echo.

REM Memastikan PATH menyertakan Node.js jika belum terdaftar secara global
SET "VS_NODE=C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Microsoft\VisualStudio\NodeJs"
IF EXIST "%VS_NODE%" (
    SET "PATH=%VS_NODE%;%PATH%"
)

echo [1/2] Memulai Baileys WhatsApp Backend Server (Port 3001)...
start "PUPR Garut - Baileys WhatsApp Server" cmd /k "SET PATH=%PATH% && cd /d "%~dp0" && npm run server:baileys"

echo [2/2] Memulai Next.js Dev Server (Port 3000)...
start "PUPR Garut - Next.js Dev Server" cmd /k "SET PATH=%PATH% && cd /d "%~dp0" && npm run dev"

echo.
echo ============================================================
echo   KEDUA SERVER BERHASIL DIJALANKAN (MODE DEV)!
echo   - Web App Command Center : http://localhost:3000
echo   - Baileys WhatsApp Server: http://localhost:3001
echo ============================================================
echo.
pause
