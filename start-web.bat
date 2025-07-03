@echo off
echo.
echo ================================================
echo   Interview Preparation App - Web Version
echo ================================================
echo.
echo Starting the web server...
echo.

cd /d "%~dp0web"

if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

echo Starting server on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

npm start

pause
