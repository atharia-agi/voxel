#!/bin/bash

echo "🎮 Voxel Engine Pro - Starting Server..."
echo ""
echo "Choose server option:"
echo "1. Python HTTP Server (Port 8000)"
echo "2. Node.js HTTP Server (Port 3000)"
echo "3. PHP Server (Port 8080)"
echo "4. Open in Browser"
echo ""

read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo "Starting Python server on port 8000..."
        echo "Open: http://localhost:8000"
        python3 -m http.server 8000
        ;;
    2)
        echo "Starting Node.js server on port 3000..."
        echo "Open: http://localhost:3000"
        npx http-server -p 3000
        ;;
    3)
        echo "Starting PHP server on port 8080..."
        echo "Open: http://localhost:8080"
        php -S localhost:8080
        ;;
    4)
        echo "Opening in browser..."
        if command -v xdg-open > /dev/null; then
            xdg-open index.html
        elif command -v open > /dev/null; then
            open index.html
        else
            echo "Please open index.html manually in your browser"
        fi
        ;;
    *)
        echo "Invalid choice. Starting Python server..."
        python3 -m http.server 8000
        ;;
esac