"""
简化版完整测试：只打开添加朋友界面
不做额外输入，看看 open_add_friend_menu 是否正常
"""
import sys
import time

sys.path.insert(0, r'f:\NEW BD\native-host')

def main():
    print("=" * 60)
    print("测试 open_add_friend_menu 函数")
    print("=" * 60)
    
    from wechat_rpa import open_add_friend_menu
    
    print("\n3秒后开始...")
    for i in range(3, 0, -1):
        print(f"  {i}...")
        time.sleep(1)
    
    print("\n调用 open_add_friend_menu()...")
    result = open_add_friend_menu()
    print(f"返回结果: {result}")
    
    print("\n" + "=" * 60)
    print("测试完成！请确认是否打开了'添加朋友'界面？")
    print("=" * 60)

if __name__ == "__main__":
    main()
