"""
修正版：打开添加朋友界面后，先点击输入框再输入
"""
import sys
import time

sys.path.insert(0, r'f:\NEW BD\native-host')

def main():
    print("=" * 60)
    print("修正版：点击输入框后再输入")
    print("=" * 60)
    
    import win32gui
    import pyautogui
    from wechat_rpa import open_add_friend_menu, find_wechat_window, hotkey, press_key
    import pyperclip
    
    test_id = "test_demo_123"
    
    print(f"\n测试微信号: {test_id}")
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
    
    # Step 2: 点击输入框
    # 添加朋友对话框相对于微信主窗口的位置
    # 从截图分析，搜索输入框在对话框的上部
    print("\n[Step 2] 点击输入框...")
    
    # 获取微信窗口位置（添加朋友对话框是微信的子窗口）
    hwnd = find_wechat_window()
    rect = win32gui.GetWindowRect(hwnd)
    left, top = rect[0], rect[1]
    
    # 输入框相对于窗口的偏移
    # 从截图看，添加朋友对话框左上角大约在微信窗口左侧
    # 输入框在对话框中间偏上
    input_offset_x = 140  # 输入框中心 X
    input_offset_y = 120  # 输入框中心 Y（对话框标题 + 输入框位置）
    
    input_x = left + input_offset_x
    input_y = top + input_offset_y
    
    print(f"  输入框位置: ({input_x}, {input_y})")
    pyautogui.click(input_x, input_y)
    time.sleep(0.3)
    print("  ✓ 已点击输入框")
    
    # Step 3: 输入微信号
    print(f"\n[Step 3] 输入微信号: {test_id}")
    pyperclip.copy(test_id)
    hotkey('ctrl', 'v')
    time.sleep(0.5)
    print("  ✓ 已输入")
    
    # Step 4: 按 Enter 搜索
    print("\n[Step 4] 按 Enter 搜索...")
    press_key('enter')
    time.sleep(2)
    print("  ✓ 已搜索")
    
    print("\n" + "=" * 60)
    print("测试完成！请检查微信界面")
    print("=" * 60)

if __name__ == "__main__":
    main()
