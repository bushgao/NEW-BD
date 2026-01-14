@echo off
chcp 65001 >nul

echo ============================================
echo  微信一键添加好友 - Native Host 卸载程序
echo ============================================
echo.

:: 删除注册表项
echo [1/3] 删除注册表项...

reg delete "HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.ics.wechat_bridge" /f >nul 2>&1
reg delete "HKEY_LOCAL_MACHINE\Software\Google\Chrome\NativeMessagingHosts\com.ics.wechat_bridge" /f >nul 2>&1

echo        完成

:: 删除生成的文件
echo.
echo [2/3] 是否删除配置文件和日志？
set /p CONFIRM="输入 Y 确认删除，其他键跳过: "
if /i "%CONFIRM%"=="Y" (
    del "%~dp0wechat_bridge.bat" >nul 2>&1
    del "%~dp0wechat_bridge.log" >nul 2>&1
    echo        已删除
) else (
    echo        已跳过
)

echo.
echo [3/3] 卸载完成
echo.
echo 注意：Python 依赖包未被删除，如需卸载请手动执行：
echo pip uninstall pywinauto pyautogui psutil pywin32 Pillow pyperclip
echo.
pause
