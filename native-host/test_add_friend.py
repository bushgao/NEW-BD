"""
微信 RPA 添加好友测试脚本
请在 PowerShell 中运行:
    python test_add_friend.py

注意：此测试将尝试添加一个模拟微信号，请确保输入有效的微信号用于测试
"""
import sys
import time

sys.path.insert(0, r'f:\NEW BD\native-host')

def main():
    print("=" * 60)
    print("微信 RPA 添加好友测试")
    print("=" * 60)
    
    # 导入模块
    print("\n1. 导入 RPA 模块...")
    try:
        from wechat_rpa import (
            check_wechat_running, 
            add_friend_by_id
        )
        print("   ✓ 模块导入成功")
    except Exception as e:
        print(f"   ✗ 导入失败: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # 检查微信状态
    print("\n2. 检查微信状态...")
    status = check_wechat_running()
    print(f"   运行状态: {status}")
    
    if not status.get('running'):
        print("   ✗ 微信未运行，请先启动微信！")
        return
    
    # 获取测试微信号
    print("\n3. 请输入要添加的微信号/手机号（或按 Enter 使用模拟测试）:")
    wechat_id = input("   微信号: ").strip()
    
    if not wechat_id:
        # 使用一个不存在的测试号来验证流程
        wechat_id = "test_wechat_12345_demo"
        print(f"   使用测试微信号: {wechat_id}")
    
    # 3秒倒计时
    print("\n4. 3秒后开始添加好友操作...")
    print("   请确保微信窗口可见，不要操作鼠标键盘！")
    for i in range(3, 0, -1):
        print(f"   {i}...")
        time.sleep(1)
    
    # 执行添加好友
    print("\n5. 执行添加好友操作...")
    result = add_friend_by_id(
        wechat_id=wechat_id,
        message="你好，我是通过测试添加的",
        remark=None
    )
    
    print(f"\n6. 结果: {result}")
    
    if result.get('success'):
        print("\n" + "=" * 60)
        print("✓ 添加好友流程执行成功！")
        print("请检查微信是否显示了添加结果")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("✗ 添加好友流程执行失败")
        print(f"错误信息: {result.get('message')}")
        print("=" * 60)

if __name__ == "__main__":
    main()
