"""
完整的 RPA 搜索并选择测试
"""
import win32gui
import win32con
import time
import pyautogui
import pyperclip

def test_full_search():
    print("=" * 60)
    print("完整 RPA 测试：搜索并打开对话")
    print("=" * 60)
    
    # 1. 查找并激活微信窗口
    print("\n1. 查找并激活微信窗口...")
    hwnd = win32gui.FindWindow(None, "微信")
    if not hwnd:
        print("   ✗ 未找到微信窗口")
        return False
    
    win32gui.SetForegroundWindow(hwnd)
    time.sleep(0.5)
    print(f"   ✓ 窗口已激活 (hwnd={hwnd})")
    
    # 2. 按 Esc 关闭可能存在的搜索框/弹窗
    print("\n2. 清理状态...")
    pyautogui.press('escape')
    time.sleep(0.3)
    
    # 3. 打开搜索框 Ctrl+F
    print("\n3. 打开搜索框 (Ctrl+F)...")
    pyautogui.hotkey('ctrl', 'f')
    time.sleep(0.5)
    print("   ✓ 已发送 Ctrl+F")
    
    # 4. 输入搜索内容
    search_text = "文件传输助手"
    print(f"\n4. 输入搜索内容 '{search_text}'...")
    pyperclip.copy(search_text)
    pyautogui.hotkey('ctrl', 'a')  # 全选清空
    time.sleep(0.1)
    pyautogui.hotkey('ctrl', 'v')  # 粘贴
    time.sleep(1)  # 等待搜索结果
    print("   ✓ 已输入搜索内容")
    
    # 5. 用方向键选择 "功能" 下的 "文件传输助手"
    print("\n5. 选择搜索结果...")
    # 按两次 Down 键选择功能区的文件传输助手
    pyautogui.press('down')
    time.sleep(0.2)
    pyautogui.press('down')
    time.sleep(0.2)
    print("   ✓ 已选择")
    
    # 6. 按 Enter 确认
    print("\n6. 按 Enter 确认...")
    pyautogui.press('enter')
    time.sleep(0.5)
    print("   ✓ 已确认")
    
    print("\n" + "=" * 60)
    print("测试完成！")
    print("=" * 60)
    return True

if __name__ == "__main__":
    print("3秒后开始测试，请确保微信窗口可见...")
    time.sleep(3)
    test_full_search()
