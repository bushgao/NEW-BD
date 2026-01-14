"""
完整添加好友流程测试（使用真实账号）

流程：
1. 打开添加朋友界面
2. 输入手机号
3. 搜索
4. 点击"添加到通讯录"按钮
5. 在"申请添加朋友"对话框中填写信息
6. 点击确定
"""
import sys
import time

sys.path.insert(0, r'f:\NEW BD\native-host')

def main():
    print("=" * 60)
    print("完整添加好友流程测试")
    print("=" * 60)
    
    import win32gui
    import pyautogui
    from wechat_rpa import open_add_friend_menu, find_wechat_window, press_key, hotkey
    import pyperclip
    
    # 使用用户提供的手机号
    phone_number = "18502676407"
    verify_message = "你好，我是测试添加"
    remark = "测试备注"
    
    print(f"\n手机号: {phone_number}")
    print(f"验证消息: {verify_message}")
    print(f"备注: {remark}")
    
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
    
    # Step 2: 查找"添加朋友"对话框
    print("\n[Step 2] 查找添加朋友对话框...")
    dialog_hwnd = win32gui.FindWindow(None, "添加朋友")
    if not dialog_hwnd:
        print("  ✗ 未找到对话框")
        return
    
    rect = win32gui.GetWindowRect(dialog_hwnd)
    dlg_left, dlg_top = rect[0], rect[1]
    dlg_width = rect[2] - rect[0]
    dlg_height = rect[3] - rect[1]
    print(f"  ✓ 对话框位置: ({dlg_left}, {dlg_top}), 大小: {dlg_width}x{dlg_height}")
    
    # Step 3: 点击输入框并输入手机号
    print("\n[Step 3] 点击输入框...")
    input_x = dlg_left + dlg_width // 2 - 50
    input_y = dlg_top + 65
    pyautogui.click(input_x, input_y)
    time.sleep(0.3)
    
    print(f"\n[Step 4] 输入手机号: {phone_number}")
    pyperclip.copy(phone_number)
    hotkey('ctrl', 'v')
    time.sleep(0.5)
    
    # Step 5: 搜索
    print("\n[Step 5] 按 Enter 搜索...")
    press_key('enter')
    time.sleep(2)  # 等待搜索结果
    print("  ✓ 已搜索")
    
    # Step 6: 点击"添加到通讯录"按钮
    # 从截图分析，按钮在对话框底部中间
    # 对话框高度约 400-450px，按钮大约在 y=400 左右
    print("\n[Step 6] 点击'添加到通讯录'按钮...")
    add_btn_x = dlg_left + dlg_width // 2
    add_btn_y = dlg_top + 330  # 按钮大约在这个位置
    print(f"  按钮位置: ({add_btn_x}, {add_btn_y})")
    pyautogui.click(add_btn_x, add_btn_y)
    time.sleep(1)  # 等待"申请添加朋友"对话框
    print("  ✓ 已点击")
    
    # Step 7: 查找"申请添加朋友"对话框
    print("\n[Step 7] 查找'申请添加朋友'对话框...")
    apply_dialog = win32gui.FindWindow(None, "申请添加朋友")
    if apply_dialog:
        apply_rect = win32gui.GetWindowRect(apply_dialog)
        apply_left, apply_top = apply_rect[0], apply_rect[1]
        apply_width = apply_rect[2] - apply_rect[0]
        apply_height = apply_rect[3] - apply_rect[1]
        print(f"  ✓ 对话框位置: ({apply_left}, {apply_top}), 大小: {apply_width}x{apply_height}")
        
        # Step 8: 填写验证消息（输入框在顶部）
        print(f"\n[Step 8] 填写验证消息: {verify_message}")
        # 验证消息输入框大约在对话框顶部 y=120
        msg_x = apply_left + apply_width // 2
        msg_y = apply_top + 120
        pyautogui.click(msg_x, msg_y)
        time.sleep(0.2)
        hotkey('ctrl', 'a')
        pyperclip.copy(verify_message)
        hotkey('ctrl', 'v')
        time.sleep(0.3)
        print("  ✓ 已填写")
        
        # Step 9: 填写备注（按 Tab 切换或直接点击）
        print(f"\n[Step 9] 填写备注: {remark}")
        # 备注输入框大约在 y=220
        remark_x = apply_left + apply_width // 2
        remark_y = apply_top + 230
        pyautogui.click(remark_x, remark_y)
        time.sleep(0.2)
        hotkey('ctrl', 'a')
        pyperclip.copy(remark)
        hotkey('ctrl', 'v')
        time.sleep(0.3)
        print("  ✓ 已填写")
        
        # Step 10: 点击"确定"按钮
        print("\n[Step 10] 点击'确定'按钮...")
        # 确定按钮在对话框底部左侧，大约 y=530
        confirm_x = apply_left + 100
        confirm_y = apply_top + apply_height - 60
        print(f"  确定按钮位置: ({confirm_x}, {confirm_y})")
        # 注意：这里先不实际点击，避免发送请求
        print("  [跳过] 为避免实际发送请求，暂不点击确定")
        # pyautogui.click(confirm_x, confirm_y)
    else:
        print("  ✗ 未找到'申请添加朋友'对话框")
    
    print("\n" + "=" * 60)
    print("测试完成！请检查各步骤是否成功。")
    print("=" * 60)

if __name__ == "__main__":
    main()
