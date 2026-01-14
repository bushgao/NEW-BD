"""
微信 RPA 测试脚本
请在 PowerShell 中运行:
    python test_rpa_search.py
"""
import sys
import time

# 添加路径
sys.path.insert(0, r'f:\NEW BD\native-host')

def main():
    print("=" * 50)
    print("微信 RPA 测试脚本")
    print("=" * 50)
    
    # 导入模块
    print("\n1. 导入 RPA 模块...")
    try:
        from wechat_rpa import (
            check_wechat_running, 
            find_wechat_window, 
            activate_wechat,
            search_contact
        )
        print("   ✓ 模块导入成功")
    except Exception as e:
        print(f"   ✗ 导入失败: {e}")
        return
    
    # 检查微信状态
    print("\n2. 检查微信状态...")
    status = check_wechat_running()
    print(f"   运行状态: {status}")
    
    if not status.get('running'):
        print("   ✗ 微信未运行，请先启动微信！")
        return
    
    # 3秒倒计时
    print("\n3. 3秒后开始测试...")
    for i in range(3, 0, -1):
        print(f"   {i}...")
        time.sleep(1)
    
    # 激活微信
    print("\n4. 激活微信窗口...")
    if activate_wechat():
        print("   ✓ 微信窗口已激活")
    else:
        print("   ✗ 激活失败")
        return
    
    # 搜索测试
    print("\n5. 搜索 '文件传输助手'...")
    result = search_contact("文件传输助手", select_result=True)
    
    if result:
        print("   ✓ 搜索并选择成功！")
        print("\n" + "=" * 50)
        print("测试完成！请检查微信是否打开了 '文件传输助手' 对话框")
        print("=" * 50)
    else:
        print("   ✗ 搜索失败")

if __name__ == "__main__":
    main()
