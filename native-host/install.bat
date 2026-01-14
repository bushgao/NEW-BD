@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ============================================
echo  微信一键添加好友 - Native Host 安装程序
echo ============================================
echo.

:: 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

:: 检查 Python 是否已安装
echo [1/5] 检查 Python 环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Python，请先安装 Python 3.8+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo        Python 版本: %PYTHON_VERSION%

:: 安装 Python 依赖
echo.
echo [2/5] 安装 Python 依赖...
pip install -r "%SCRIPT_DIR%\requirements.txt" --quiet
if errorlevel 1 (
    echo [警告] 部分依赖可能安装失败，尝试单独安装...
    pip install pywinauto pyautogui psutil pywin32 Pillow pyperclip --quiet
)
echo        依赖安装完成

:: 生成 Native Host 配置文件
echo.
echo [3/5] 生成配置文件...

:: 获取 Chrome 扩展 ID（需要用户手动输入或从 manifest 获取）
set "EXTENSION_ID="
set /p EXTENSION_ID="请输入 Chrome 扩展 ID（留空则使用默认值）: "
if "%EXTENSION_ID%"=="" (
    set "EXTENSION_ID=*"
    echo        使用通配符模式（允许所有扩展）
) else (
    echo        扩展 ID: %EXTENSION_ID%
)

:: 创建 wechat_bridge.bat 启动脚本
echo @echo off > "%SCRIPT_DIR%\wechat_bridge.bat"
echo python "%SCRIPT_DIR%\wechat_bridge.py" >> "%SCRIPT_DIR%\wechat_bridge.bat"

:: 生成 JSON 配置文件
echo { > "%SCRIPT_DIR%\com.ics.wechat_bridge.json"
echo   "name": "com.ics.wechat_bridge", >> "%SCRIPT_DIR%\com.ics.wechat_bridge.json"
echo   "description": "微信一键添加好友桥接程序", >> "%SCRIPT_DIR%\com.ics.wechat_bridge.json"
echo   "path": "%SCRIPT_DIR:\=\\%\\wechat_bridge.bat", >> "%SCRIPT_DIR%\com.ics.wechat_bridge.json"
echo   "type": "stdio", >> "%SCRIPT_DIR%\com.ics.wechat_bridge.json"
if "%EXTENSION_ID%"=="*" (
    echo   "allowed_origins": ["chrome-extension://*/*"] >> "%SCRIPT_DIR%\com.ics.wechat_bridge.json"
) else (
    echo   "allowed_origins": ["chrome-extension://%EXTENSION_ID%/"] >> "%SCRIPT_DIR%\com.ics.wechat_bridge.json"
)
echo } >> "%SCRIPT_DIR%\com.ics.wechat_bridge.json"

echo        配置文件已生成

:: 注册到 Windows 注册表
echo.
echo [4/5] 注册 Native Messaging Host...

:: 检查是否以管理员权限运行
net session >nul 2>&1
if errorlevel 1 (
    echo [警告] 未以管理员权限运行，尝试当前用户注册...
    set "REG_PATH=HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.ics.wechat_bridge"
) else (
    set "REG_PATH=HKEY_LOCAL_MACHINE\Software\Google\Chrome\NativeMessagingHosts\com.ics.wechat_bridge"
)

reg add "%REG_PATH%" /ve /t REG_SZ /d "%SCRIPT_DIR%\com.ics.wechat_bridge.json" /f >nul 2>&1
if errorlevel 1 (
    echo [错误] 注册表写入失败，请以管理员权限运行此脚本
    pause
    exit /b 1
)
echo        注册表写入成功

:: 验证安装
echo.
echo [5/5] 验证安装...
python -c "from wechat_automation import AUTOMATION_AVAILABLE; print('自动化模块:', '可用' if AUTOMATION_AVAILABLE else '不可用')" 2>nul
if errorlevel 1 (
    echo [警告] 验证失败，但安装可能仍然成功
) else (
    echo        安装验证通过
)

echo.
echo ============================================
echo  安装完成！
echo ============================================
echo.
echo 下一步操作：
echo 1. 打开 Chrome 浏览器
echo 2. 进入 chrome://extensions/
echo 3. 找到达人采集插件，复制其 ID
echo 4. 重新运行此脚本并输入扩展 ID（如已输入则跳过）
echo 5. 重启 Chrome 浏览器
echo.
echo 日志文件位置: %SCRIPT_DIR%\wechat_bridge.log
echo.
pause
