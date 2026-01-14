"""
单独测试 + 按钮菜单打开流程
分步骤执行，每步暂停让用户确认
"""
import sys
import time

sys.path.insert(0, r'f:\NEW BD\native-host')

def main():
    print("=" * 60)
    print("测试：打开 + 按钮菜单")
    print("=" * 60)
    
    from wechat_rpa import activate_wechat, hotkey, press_key
    import pyautogui
    
    print("\n请确保微信窗口可见!")
    print("3秒后开始...")
    for i in range(3, 0, -1):
        print(f"  {i}...")
        time.sleep(1)
    
    # Step 1: 激活微信
    print("\n[Step 1] 激活微信窗口...")
    if activate_wechat():
        print("  ✓ 微信已激活")
    else:
        print("  ✗ 激活失败")
        return
    
    input("\n按 Enter 继续下一步 (Ctrl+F 打开搜索)...")
    
    # Step 2: Ctrl+F 打开搜索
    print("\n[Step 2] 按 Ctrl+F 打开搜索...")
    hotkey('ctrl', 'f')
    time.sleep(0.5)
    print("  ✓ 已按 Ctrl+F")
    
    input("\n请确认：搜索框是否打开？光标是否在搜索框中？\n按 Enter 继续下一步 (Tab 切换到 + 按钮)...")
    
    # Step 3: Tab 切换到 + 按钮
    print("\n[Step 3] 按 Tab 切换到 + 按钮...")
    press_key('tab')
    time.sleep(0.3)
    print("  ✓ 已按 Tab")
    
    input("\n请确认：焦点是否移到了 + 按钮？\n按 Enter 继续下一步 (Enter 打开菜单)...")
    
    # Step 4: Enter 打开菜单
    print("\n[Step 4] 按 Enter 打开菜单...")
    press_key('enter')
    time.sleep(0.5)
    print("  ✓ 已按 Enter")
    
    input("\n请确认：是否弹出了菜单（发起群聊、添加朋友、新建笔记）？\n按 Enter 继续下一步 (Down 选择添加朋友)...")
    
    # Step 5: Down 选择添加朋友
    print("\n[Step 5] 按 Down 选择 '添加朋友' (第二个选项)...")
    press_key('down')
    time.sleep(0.2)
    print("  ✓ 已按 Down")
    
    input("\n请确认：'添加朋友' 选项是否高亮？\n按 Enter 继续下一步 (Enter 确认)...")
    
    # Step 6: Enter 确认
    print("\n[Step 6] 按 Enter 确认...")
    press_key('enter')
    time.sleep(0.8)
    print("  ✓ 已按 Enter")
    
    print("\n" + "=" * 60)
    print("测试完成！")
    print("请确认：是否打开了 '添加朋友' 界面？")
    print("=" * 60)

if __name__ == "__main__":
    main()
