@echo off
echo ============================================================
echo   SOA E-commerce Backend - Stopping All Services
echo ============================================================
echo.

echo [1/6] Stopping User Service...
taskkill /FI "WINDOWTITLE eq User Service (3001)*" /T /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo [2/6] Stopping Product Service...
taskkill /FI "WINDOWTITLE eq Product Service (3002)*" /T /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3002" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo [3/6] Stopping Cart Service...
taskkill /FI "WINDOWTITLE eq Cart Service (3003)*" /T /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3003" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo [4/6] Stopping Order Service...
taskkill /FI "WINDOWTITLE eq Order Service (3004)*" /T /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3004" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo [5/6] Stopping Recommendation Service...
taskkill /FI "WINDOWTITLE eq Recommendation Service (3005)*" /T /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3005" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo [6/6] Stopping API Gateway...
taskkill /FI "WINDOWTITLE eq API Gateway (3000)*" /T /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo.
echo ============================================================
echo   All services have been stopped successfully!
echo ============================================================
pause
