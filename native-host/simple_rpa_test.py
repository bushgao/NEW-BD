"""
简单测试 - 直接使用 win32gui 激活微信窗口
"""
import win32gui
import win32con
import time
import pyautogui
import pyperclip

print("=" * 60)
print("简单 RPA 测试（直接使用 win32gui）")
print("=" * 60)

# 1. 查找微信窗口
print("\n1. 查找微信窗口...")
hwnd = win32gui.FindWindow(None, "微信")
if hwnd:
    print(f"   ✓ 找到微信窗口: hwnd={hwnd}")
else:
    print("   ✗ 未找到微信窗口")
    exit(1)

# 2. 激活窗口
print("\n2. 激活微信窗口...")
try:
    # 如果窗口最小化，先恢复
    if win32gui.IsIconic(hwnd):
        win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
    
    # 设置为前台窗口
    win32gui.SetForegroundWindow(hwnd)
    time.sleep(0.5)
    print("   ✓ 窗口已激活")
except Exception as e:
    print(f"   ✗ 激活失败: {e}")
    exit(1)

# 3. 发送 Ctrl+F 快捷键
print("\n3. 发送 Ctrl+F 打开搜索...")
time.sleep(0.5)
pyautogui.hotkey('ctrl', 'f')
time.sleep(0.5)
print("   ✓ 已发送 Ctrl+F")

# 4. 输入搜索内容
print("\n4. 输入搜索内容 '文件传输助手'...")
pyperclip.copy("文件传输助手")
pyautogui.hotkey('ctrl', 'v')
time.sleep(0.5)
print("   ✓ 已输入搜索内容")

# 5. 按 Enter
print("\n5. 按 Enter 选择...")
pyautogui.press('enter')
time.sleep(0.5)
print("   ✓ 已按 Enter")

print("\n" + "=" * 60)
print("测试完成！请检查微信是否已打开'文件传输助手'对话框")
print("=" * 60)
