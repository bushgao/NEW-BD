"""
只测试后续步骤：填写验证消息、备注、点击确定
假设"申请添加朋友"对话框已打开
"""
import sys
import time

sys.path.insert(0, r'f:\NEW BD\native-host')

def main():
    print("=" * 60)
    print("测试后续步骤（申请对话框已打开）")
    print("=" * 60)
    
    import win32gui
    import pyautogui
    from wechat_rpa import hotkey
    import pyperclip
    
    verify_message = "你好，我是测试添加"
    remark = "测试备注"
    
    print("\n3秒后开始...")
    for i in range(3, 0, -1):
        print(f"  {i}...")
        time.sleep(1)
    
    # Step 1: 查找申请对话框
    print("\n[Step 1] 查找申请添加朋友对话框...")
    apply_dialog = win32gui.FindWindow(None, "申请添加朋友")
    if not apply_dialog:
        print("  ✗ 未找到申请对话框")
        print("  请先手动点击'添加到通讯录'按钮")
        return
    
    apply_rect = win32gui.GetWindowRect(apply_dialog)
    apply_left, apply_top = apply_rect[0], apply_rect[1]
    apply_width = apply_rect[2] - apply_rect[0]
    apply_height = apply_rect[3] - apply_rect[1]
    print(f"  ✓ 对话框: ({apply_left}, {apply_top}), 大小: {apply_width}x{apply_height}")
    
    # Step 2: 填写验证消息
    print(f"\n[Step 2] 填写验证消息: {verify_message}")
    msg_x = apply_left + apply_width // 2
    msg_y = apply_top + 120
    print(f"  点击: ({msg_x}, {msg_y})")
    pyautogui.click(msg_x, msg_y)
    time.sleep(0.2)
    hotkey('ctrl', 'a')
    pyperclip.copy(verify_message)
    hotkey('ctrl', 'v')
    time.sleep(0.3)
    print("  ✓ 已填写")
    
    # Step 3: 填写备注
    print(f"\n[Step 3] 填写备注: {remark}")
    remark_x = apply_left + apply_width // 2
    remark_y = apply_top + 275
    print(f"  点击: ({remark_x}, {remark_y})")
    pyautogui.click(remark_x, remark_y)
    time.sleep(0.2)
    hotkey('ctrl', 'a')
    pyperclip.copy(remark)
    hotkey('ctrl', 'v')
    time.sleep(0.3)
    print("  ✓ 已填写")
    
    # Step 4: 点击确定
    print("\n[Step 4] 点击确定按钮...")
    confirm_x = apply_left + 120
    confirm_y = apply_top + apply_height - 50
    print(f"  确定按钮: ({confirm_x}, {confirm_y})")
    pyautogui.click(confirm_x, confirm_y)
    time.sleep(1)
    print("  ✓ 已点击确定")
    
    print("\n" + "=" * 60)
    print("✓ 完成！请检查是否发送成功")
    print("=" * 60)

if __name__ == "__main__":
    main()
