"""
查找添加朋友对话框窗口，获取其位置
"""
import sys
import time

sys.path.insert(0, r'f:\NEW BD\native-host')

def main():
    print("=" * 60)
    print("查找添加朋友对话框")
    print("=" * 60)
    
    import win32gui
    import pyautogui
    from wechat_rpa import open_add_friend_menu, press_key, hotkey
    import pyperclip
    
    print("\n3秒后开始...")
    for i in range(3, 0, -1):
        print(f"  {i}...")
        time.sleep(1)
    
    # Step 1: 打开添加朋友界面
    print("\n[Step 1] 打开添加朋友界面...")
    if open_add_friend_menu():
        print("  ✓ 成功打开")
    else:
        print("  ✗ 打开失败")
        return
    
    time.sleep(0.5)
    
    # Step 2: 查找 "添加朋友" 对话框
    print("\n[Step 2] 查找添加朋友对话框...")
    
    # 尝试通过标题查找
    dialog_hwnd = win32gui.FindWindow(None, "添加朋友")
    
    if dialog_hwnd:
        rect = win32gui.GetWindowRect(dialog_hwnd)
        left, top, right, bottom = rect
        width = right - left
        height = bottom - top
        print(f"  ✓ 找到对话框: hwnd={dialog_hwnd}")
        print(f"  位置: ({left}, {top})")
        print(f"  大小: {width} x {height}")
        
        # 输入框在对话框中的相对位置
        # 从截图分析：标题约40px，输入框在下面，居中
        input_x = left + width // 2 - 50  # 输入框中心偏左
        input_y = top + 65  # 标题栏 + 一点距离
        
        print(f"\n[Step 3] 点击输入框: ({input_x}, {input_y})")
        pyautogui.click(input_x, input_y)
        time.sleep(0.3)
        print("  ✓ 已点击")
        
        # Step 4: 输入
        print("\n[Step 4] 输入微信号...")
        pyperclip.copy("test_wechat_abc")
        hotkey('ctrl', 'v')
        time.sleep(0.5)
        print("  ✓ 已输入")
        
        # Step 5: Enter 搜索
        print("\n[Step 5] 按 Enter 搜索...")
        press_key('enter')
        time.sleep(2)
        print("  ✓ 已搜索")
    else:
        print("  ✗ 未找到对话框")
        # 尝试枚举所有窗口
        print("\n  枚举所有可见窗口...")
        def callback(hwnd, windows):
            if win32gui.IsWindowVisible(hwnd):
                title = win32gui.GetWindowText(hwnd)
                if title and ("添加" in title or "朋友" in title):
                    windows.append((hwnd, title))
            return True
        windows = []
        win32gui.EnumWindows(callback, windows)
        for hwnd, title in windows:
            print(f"    {hwnd}: {title}")
    
    print("\n" + "=" * 60)
    print("测试完成！")
    print("=" * 60)

if __name__ == "__main__":
    main()
