@echo off
echo Voxel Engine Pro - Starting Server...
echo.
echo Choose server option:
echo 1. Python HTTP Server (Port 8000)
echo 2. Node.js HTTP Server (Port 3000)
echo 3. PHP Server (Port 8080)
echo 4. Open in Browser (file://)
echo.

set /p choice="Enter choice (1-4): "

if "%choice%"=="1" (
    echo Starting Python server on port 8000...
    echo Open: http://localhost:8000
    python -m http.server 8000
) else if "%choice%"=="2" (
    echo Starting Node.js server on port 3000...
    echo Open: http://localhost:3000
    npx http-server -p 3000
) else if "%choice%"=="3" (
    echo Starting PHP server on port 8080...
    echo Open: http://localhost:8080
    php -S localhost:8080
) else if "%choice%"=="4" (
    echo Opening in browser...
    start index.html
    pause
) else (
    echo Invalid choice. Starting Python server...
    python -m http.server 8000
)

pause