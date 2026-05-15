@echo off
echo ============================================================
echo   SOA E-commerce Backend — Installing Dependencies
echo ============================================================
echo.

echo [1/6] Installing API Gateway dependencies...
cd /d %~dp0services\api-gateway && npm install
echo.

echo [2/6] Installing User Service dependencies...
cd /d %~dp0services\user-service && npm install
echo.

echo [3/6] Installing Product Service dependencies...
cd /d %~dp0services\product-service && npm install
echo.

echo [4/6] Installing Cart Service dependencies...
cd /d %~dp0services\cart-service && npm install
echo.

echo [5/6] Installing Order Service dependencies...
cd /d %~dp0services\order-service && npm install
echo.

echo [6/6] Installing Recommendation Service dependencies...
cd /d %~dp0services\recommendation-service && npm install
echo.

echo ============================================================
echo   All dependencies installed!
echo   Run start-all.bat to start all services.
echo ============================================================
pause
