"""
完整测试：添加好友流程
1. 打开添加朋友界面
2. 输入微信号
3. 按 Enter 搜索
"""
import sys
import time

sys.path.insert(0, r'f:\NEW BD\native-host')

def main():
    print("=" * 60)
    print("完整测试：添加好友")
    print("=" * 60)
    
    from wechat_rpa import open_add_friend_menu, hotkey, press_key
    import pyperclip
    
    test_wechat_id = "test_demo_wechat"
    
    print(f"\n测试微信号: {test_wechat_id}")
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
    
    # Step 2: 输入微信号
    print(f"\n[Step 2] 输入微信号: {test_wechat_id}")
    pyperclip.copy(test_wechat_id)
    hotkey('ctrl', 'v')
    time.sleep(0.5)
    print("  ✓ 已输入")
    
    # Step 3: 按 Enter 搜索
    print("\n[Step 3] 按 Enter 搜索...")
    press_key('enter')
    time.sleep(2)
    print("  ✓ 已搜索")
    
    print("\n" + "=" * 60)
    print("测试完成！")
    print("请检查微信：是否搜索了该微信号？")
    print("（因为是测试号，应该显示'用户不存在'）")
    print("=" * 60)

if __name__ == "__main__":
    main()
