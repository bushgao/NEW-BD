"""
自动测试 + 按钮菜单打开流程（无需交互）
"""
import sys
import time

sys.path.insert(0, r'f:\NEW BD\native-host')

def main():
    print("=" * 60)
    print("自动测试：打开 + 按钮菜单")
    print("=" * 60)
    
    from wechat_rpa import activate_wechat, hotkey, press_key
    
    print("\n3秒后开始...")
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
    time.sleep(0.5)
    
    # Step 2: Ctrl+F 打开搜索
    print("\n[Step 2] 按 Ctrl+F 打开搜索...")
    hotkey('ctrl', 'f')
    time.sleep(0.5)
    print("  ✓ 已按 Ctrl+F")
    
    # Step 3: Tab 切换到 + 按
    # 钮
    print("\n[Step 3] 按 Tab 切换到 + 按钮...")
    press_key('tab')
    time.sleep(0.3)
    print("  ✓ 已按 Tab")
    
    # Step 4: Enter 打开菜单
    print("\n[Step 4] 按 Enter 打开菜单...")
    press_key('enter')
    time.sleep(0.5)
    print("  ✓ 已按 Enter")
    
    # 暂停2秒，让用户看到菜单
    print("\n>>> 暂停2秒，请观察菜单是否弹出 <<<")
    time.sleep(2)
    
    # Step 5: Down 选择添加朋友
    print("\n[Step 5] 按 Down 选择 '添加朋友'...")
    press_key('down')
    time.sleep(0.3)
    print("  ✓ 已按 Down")
    
    # 暂停1秒
    print("\n>>> 暂停1秒，请观察是否选中'添加朋友' <<<")
    time.sleep(1)
    
    # Step 6: Enter 确认
    print("\n[Step 6] 按 Enter 确认...")
    press_key('enter')
    time.sleep(1)
    print("  ✓ 已按 Enter")
    
    print("\n" + "=" * 60)
    print("测试完成！请检查微信界面。")
    print("=" * 60)

if __name__ == "__main__":
    main()
