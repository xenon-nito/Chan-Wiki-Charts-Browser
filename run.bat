@echo off
:: Start Python HTTP server and open browser to localhost:8000
:: Save this as "start_server.bat"

title Local Python Server Starter
color 0A

echo Starting Python HTTP server on port 8000...
start "" cmd /c python -m http.server 8000

echo Waiting 2 seconds for server to initialize...
timeout /t 2 >nul

echo Opening browser to http://localhost:8000...
start "" "http://localhost:8000"

echo Server is running in a new window.
echo Keep this window open to monitor the server.
echo.
echo Press CTRL+C in the server window to stop it.
pause