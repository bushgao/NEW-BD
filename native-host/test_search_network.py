"""
测试：纯键盘添加好友（搜索网络结果方式）

流程：
1. Ctrl+F 打开搜索
2. 输入微信号
3. 按 1 次 Down 选择 "搜索网络结果"
4. 按 Enter 进入搜索结果页
5. 观察结果

这个测试不会关闭微信（不按 Escape）
"""
import sys
import time

sys.path.insert(0, r'f:\NEW BD\native-host')

def main():
    print("=" * 60)
    print("测试：纯键盘添加好友（搜索网络结果）")
    print("=" * 60)
    
    from wechat_rpa import activate_wechat, hotkey, press_key
    import pyperclip
    
    test_wechat_id = "test12345demo"
    
    print(f"\n测试微信号: {test_wechat_id}")
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
    
    # Step 3: 输入微信号
    print(f"\n[Step 3] 输入微信号: {test_wechat_id}")
    hotkey('ctrl', 'a')
    time.sleep(0.1)
    pyperclip.copy(test_wechat_id)
    hotkey('ctrl', 'v')
    time.sleep(1.5)  # 等待搜索建议出现
    print("  ✓ 已输入")
    
    print("\n>>> 暂停2秒，观察搜索结果列表 <<<")
    time.sleep(2)
    
    # Step 4: 按 1 次 Down 选择 "搜索网络结果"
    print("\n[Step 4] 按 Down 选择 '搜索网络结果'...")
    press_key('down')
    time.sleep(0.3)
    print("  ✓ 已按 Down")
    
    print("\n>>> 暂停1秒，确认选中了'搜索网络结果' <<<")
    time.sleep(1)
    
    # Step 5: Enter 进入搜索结果
    print("\n[Step 5] 按 Enter 进入搜索结果...")
    press_key('enter')
    time.sleep(2)
    print("  ✓ 已按 Enter")
    
    print("\n" + "=" * 60)
    print("测试完成！请观察微信界面：")
    print("1. 是否进入了网络搜索结果页？")
    print("2. 是否显示 '该用户不存在' 或用户信息？")
    print("=" * 60)

if __name__ == "__main__":
    main()
