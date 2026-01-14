"""
测试2：只测试 Ctrl+F 后的 Tab 导航
不按 Escape，避免关闭微信
"""
import sys
import time

sys.path.insert(0, r'f:\NEW BD\native-host')

def main():
    print("=" * 60)
    print("测试：Ctrl+F 后按多次 Tab 观察焦点变化")
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
    time.sleep(0.8)
    print("  ✓ 已按 Ctrl+F，搜索框应该打开了")
    print("  >>> 暂停1秒观察 <<<")
    time.sleep(1)
    
    # Step 3: 按第1次 Tab
    print("\n[Step 3] 按第1次 Tab...")
    press_key('tab')
    time.sleep(0.5)
    print("  ✓ 已按 Tab (1)")
    print("  >>> 暂停2秒，观察焦点在哪里 <<<")
    time.sleep(2)
    
    # Step 4: 按第2次 Tab
    print("\n[Step 4] 按第2次 Tab...")
    press_key('tab')
    time.sleep(0.5)
    print("  ✓ 已按 Tab (2)")
    print("  >>> 暂停2秒，观察焦点现在在哪里 <<<")
    time.sleep(2)
    
    # Step 5: 按第3次 Tab
    print("\n[Step 5] 按第3次 Tab...")
    press_key('tab')
    time.sleep(0.5)
    print("  ✓ 已按 Tab (3)")
    print("  >>> 暂停2秒，观察焦点现在在哪里 <<<")
    time.sleep(2)
    
    print("\n" + "=" * 60)
    print("测试完成！")
    print("请告诉我每次按 Tab 后焦点分别在哪里？")
    print("例如：Tab1=搜索框, Tab2=+按钮, Tab3=?")
    print("=" * 60)

if __name__ == "__main__":
    main()
