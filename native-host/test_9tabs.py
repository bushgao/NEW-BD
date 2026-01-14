"""
测试：9次 Tab 到达 + 按钮
"""
import sys
import time

sys.path.insert(0, r'f:\NEW BD\native-host')

def main():
    print("=" * 60)
    print("测试：9次 Tab 到达 + 按钮")
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
    
    # Step 3: 按 9 次 Tab
    print("\n[Step 3] 按 9 次 Tab...")
    for i in range(9):
        press_key('tab')
        time.sleep(0.15)
        print(f"  Tab {i+1}")
    time.sleep(0.3)
    print("  ✓ 已按 9 次 Tab")
    
    print("\n>>> 暂停2秒，确认焦点在 + 按钮上 <<<")
    time.sleep(2)
    
    # Step 4: Enter 打开菜单
    print("\n[Step 4] 按 Enter 打开菜单...")
    press_key('enter')
    time.sleep(0.5)
    print("  ✓ 已按 Enter")
    
    print("\n>>> 暂停2秒，观察菜单是否弹出 <<<")
    time.sleep(2)
    
    # Step 5: Down 选择 "添加朋友"
    print("\n[Step 5] 按 Down 选择 '添加朋友'...")
    press_key('down')
    time.sleep(0.3)
    print("  ✓ 已按 Down")
    
    # Step 6: Enter 确认
    print("\n[Step 6] 按 Enter 确认...")
    press_key('enter')
    time.sleep(1)
    print("  ✓ 已按 Enter")
    
    print("\n" + "=" * 60)
    print("测试完成！请确认是否打开了 '添加朋友' 界面？")
    print("=" * 60)

if __name__ == "__main__":
    main()
