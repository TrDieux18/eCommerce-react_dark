@echo off
echo ============================================================
echo   SOA E-commerce Backend — Starting All Services
echo ============================================================
echo.

:: Start each service in its own terminal window
echo [1/6] Starting User Service (port 3001)...
start "User Service (3001)" cmd /k "cd /d %~dp0services\user-service && npm run dev"

echo [2/6] Starting Product Service (port 3002)...
start "Product Service (3002)" cmd /k "cd /d %~dp0services\product-service && npm run dev"

echo [3/6] Starting Cart Service (port 3003)...
start "Cart Service (3003)" cmd /k "cd /d %~dp0services\cart-service && npm run dev"

echo [4/6] Starting Order Service (port 3004)...
start "Order Service (3004)" cmd /k "cd /d %~dp0services\order-service && npm run dev"

echo [5/6] Starting Recommendation Service (port 3005)...
start "Recommendation Service (3005)" cmd /k "cd /d %~dp0services\recommendation-service && npm run dev"

:: Wait a bit for services to start before starting gateway
echo.
echo Waiting 3 seconds for services to initialize...
timeout /t 3 /nobreak > nul

echo [6/6] Starting API Gateway (port 3000)...
start "API Gateway (3000)" cmd /k "cd /d %~dp0services\api-gateway && npm run dev"

echo.
echo ============================================================
echo   All services started! 
echo   API Gateway:            http://localhost:3000
echo   User Service:           http://localhost:3001
echo   Product Service:        http://localhost:3002
echo   Cart Service:           http://localhost:3003
echo   Order Service:          http://localhost:3004
echo   Recommendation Service: http://localhost:3005
echo ============================================================
echo.
echo Frontend can connect to http://localhost:3000 (unchanged)
echo Press any key to exit this window...
pause > nul
