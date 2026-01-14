"""
完整添加好友流程测试
1. 打开添加朋友界面
2. 输入微信号
3. 按 Enter 搜索
"""
import sys
import time

sys.path.insert(0, r'f:\NEW BD\native-host')

def main():
    print("=" * 60)
    print("完整添加好友流程测试")
    print("=" * 60)
    
    from wechat_rpa import open_add_friend_menu, hotkey, press_key
    import pyperclip
    
    test_id = "test_wechat_demo"
    
    print(f"\n测试微信号: {test_id}")
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
    
    # Step 2: 输入微信号（光标应该已在搜索框中）
    print(f"\n[Step 2] 输入微信号: {test_id}")
    pyperclip.copy(test_id)
    hotkey('ctrl', 'v')
    time.sleep(0.5)
    print("  ✓ 已输入")
    
    # Step 3: 按 Enter 搜索
    print("\n[Step 3] 按 Enter 搜索...")
    press_key('enter')
    time.sleep(2)  # 等待搜索结果
    print("  ✓ 已搜索")
    
    print("\n" + "=" * 60)
    print("测试完成！")
    print("请检查：")
    print("1. 是否输入了微信号？")
    print("2. 是否执行了搜索？")
    print("3. 是否显示'该用户不存在'或搜索结果？")
    print("=" * 60)

if __name__ == "__main__":
    main()
