"""
完整添加好友流程 - 包括点击确定按钮
"""
import sys
import time

sys.path.insert(0, r'f:\NEW BD\native-host')

def main():
    print("=" * 60)
    print("完整添加好友流程（包括确定）")
    print("=" * 60)
    
    import win32gui
    import pyautogui
    from wechat_rpa import open_add_friend_menu, find_wechat_window, press_key, hotkey
    import pyperclip
    
    phone_number = "18502676407"
    verify_message = "你好，我是测试添加"
    remark = "测试备注"
    
    print(f"\n手机号: {phone_number}")
    print("\n3秒后开始...")
    for i in range(3, 0, -1):
        print(f"  {i}...")
        time.sleep(1)
    
    # Step 1-5: 打开界面并搜索
    print("\n[Step 1] 打开添加朋友界面...")
    if not open_add_friend_menu():
        print("  ✗ 打开失败")
        return
    print("  ✓ 成功打开")
    time.sleep(0.5)
    
    dialog_hwnd = win32gui.FindWindow(None, "添加朋友")
    rect = win32gui.GetWindowRect(dialog_hwnd)
    dlg_left, dlg_top = rect[0], rect[1]
    dlg_width = rect[2] - rect[0]
    dlg_height = rect[3] - rect[1]
    
    print("\n[Step 2] 输入手机号并搜索...")
    input_x = dlg_left + dlg_width // 2 - 50
    input_y = dlg_top + 65
    pyautogui.click(input_x, input_y)
    time.sleep(0.3)
    pyperclip.copy(phone_number)
    hotkey('ctrl', 'v')
    time.sleep(0.5)
    press_key('enter')
    time.sleep(2)
    print("  ✓ 已搜索")
    
    # 重新获取对话框位置
    rect = win32gui.GetWindowRect(dialog_hwnd)
    dlg_left, dlg_top = rect[0], rect[1]
    dlg_width = rect[2] - rect[0]
    dlg_height = rect[3] - rect[1]
    
    # Step 6: 点击添加到通讯录
    print("\n[Step 3] 点击添加到通讯录...")
    add_btn_x = dlg_left + dlg_width // 2
    add_btn_y = dlg_top + dlg_height - 70
    pyautogui.click(add_btn_x, add_btn_y)
    time.sleep(1)
    print("  ✓ 已点击")
    
    # Step 7: 找到申请对话框并填写
    print("\n[Step 4] 填写验证消息和备注...")
    apply_dialog = win32gui.FindWindow(None, "申请添加朋友")
    if not apply_dialog:
        print("  ✗ 未找到申请对话框")
        return
    
    apply_rect = win32gui.GetWindowRect(apply_dialog)
    apply_left, apply_top = apply_rect[0], apply_rect[1]
    apply_width = apply_rect[2] - apply_rect[0]
    apply_height = apply_rect[3] - apply_rect[1]
    
    # 验证消息
    msg_x = apply_left + apply_width // 2
    msg_y = apply_top + 120
    pyautogui.click(msg_x, msg_y)
    time.sleep(0.2)
    hotkey('ctrl', 'a')
    pyperclip.copy(verify_message)
    hotkey('ctrl', 'v')
    time.sleep(0.3)
    
    # 备注
    remark_x = apply_left + apply_width // 2
    remark_y = apply_top + 275
    pyautogui.click(remark_x, remark_y)
    time.sleep(0.2)
    hotkey('ctrl', 'a')
    pyperclip.copy(remark)
    hotkey('ctrl', 'v')
    time.sleep(0.3)
    print("  ✓ 已填写")
    
    # Step 8: 点击确定按钮
    print("\n[Step 5] 点击确定按钮...")
    confirm_x = apply_left + 120
    confirm_y = apply_top + apply_height - 50
    print(f"  确定按钮位置: ({confirm_x}, {confirm_y})")
    pyautogui.click(confirm_x, confirm_y)
    time.sleep(1)
    print("  ✓ 已点击确定")
    
    print("\n" + "=" * 60)
    print("✓ 完整流程执行完成！")
    print("请检查微信是否显示'添加成功'或已发送好友请求")
    print("=" * 60)

if __name__ == "__main__":
    main()
