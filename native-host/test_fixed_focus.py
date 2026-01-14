"""
修复版：确保每步操作前都激活微信窗口
"""
import sys
import time

sys.path.insert(0, r'f:\NEW BD\native-host')

def main():
    print("=" * 60)
    print("修复版：确保激活微信窗口")
    print("=" * 60)
    
    import win32gui
    import win32con
    import pyautogui
    from wechat_rpa import activate_wechat, open_add_friend_menu, hotkey, press_key
    import pyperclip
    
    verify_message = "你好，我是测试添加"
    remark = "测试备注"
    
    print("\n请确保微信已登录")
    print("3秒后开始...")
    for i in range(3, 0, -1):
        print(f"  {i}...")
        time.sleep(1)
    
    # Step 1: 激活微信并查找申请对话框
    print("\n[Step 1] 激活微信窗口...")
    if not activate_wechat():
        print("  ✗ 无法激活微信")
        return
    print("  ✓ 微信已激活")
    time.sleep(0.5)
    
    # Step 2: 查找申请对话框
    print("\n[Step 2] 查找申请添加朋友对话框...")
    apply_dialog = win32gui.FindWindow(None, "申请添加朋友")
    if not apply_dialog:
        print("  ✗ 未找到申请对话框")
        print("  请先手动点击'添加到通讯录'按钮打开对话框")
        return
    
    # 激活申请对话框
    win32gui.SetForegroundWindow(apply_dialog)
    time.sleep(0.3)
    
    apply_rect = win32gui.GetWindowRect(apply_dialog)
    apply_left, apply_top = apply_rect[0], apply_rect[1]
    apply_width = apply_rect[2] - apply_rect[0]
    apply_height = apply_rect[3] - apply_rect[1]
    print(f"  ✓ 对话框: ({apply_left}, {apply_top}), 大小: {apply_width}x{apply_height}")
    
    # Step 3: 点击验证消息输入框
    print(f"\n[Step 3] 填写验证消息: {verify_message}")
    msg_x = apply_left + apply_width // 2
    msg_y = apply_top + 160  # 调整位置
    print(f"  点击: ({msg_x}, {msg_y})")
    pyautogui.click(msg_x, msg_y)
    time.sleep(0.3)
    
    # 三击选中当前行内容，而不是 Ctrl+A
    pyautogui.click(msg_x, msg_y, clicks=3)
    time.sleep(0.1)
    pyperclip.copy(verify_message)
    hotkey('ctrl', 'v')
    time.sleep(0.3)
    print("  ✓ 已填写")
    
    # Step 4: 点击备注输入框
    print(f"\n[Step 4] 填写备注: {remark}")
    remark_x = apply_left + apply_width // 2
    remark_y = apply_top + 280
    print(f"  点击: ({remark_x}, {remark_y})")
    pyautogui.click(remark_x, remark_y)
    time.sleep(0.3)
    
    pyautogui.click(remark_x, remark_y, clicks=3)
    time.sleep(0.1)
    pyperclip.copy(remark)
    hotkey('ctrl', 'v')
    time.sleep(0.3)
    print("  ✓ 已填写")
    
    # Step 5: 点击确定按钮
    print("\n[Step 5] 点击确定按钮...")
    confirm_x = apply_left + 120
    confirm_y = apply_top + apply_height - 50
    print(f"  确定按钮: ({confirm_x}, {confirm_y})")
    pyautogui.click(confirm_x, confirm_y)
    time.sleep(1)
    print("  ✓ 已点击确定")
    
    print("\n" + "=" * 60)
    print("✓ 完成！请检查微信是否发送成功")
    print("=" * 60)

if __name__ == "__main__":
    main()
