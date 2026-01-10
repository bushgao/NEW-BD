@echo off
echo ========================================
echo 重启后端服务
echo ========================================
echo.

echo [1/2] 进入后端目录...
cd packages\backend

echo.
echo [2/2] 启动后端服务...
echo.
echo 提示：如果看到 "Server running on port 3000"，说明启动成功
echo 然后请：
echo   1. 打开浏览器 http://localhost:5173
echo   2. 按F12打开控制台
echo   3. 输入: localStorage.clear(); location.reload();
echo   4. 重新登录
echo.
echo ========================================
echo 正在启动...
echo ========================================
echo.

npm run dev
