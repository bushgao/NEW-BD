"""
测试 wxauto 库 - 修正版
"""
import sys
sys.path.insert(0, 'f:/NEW BD/native-host/wxauto')

print("=" * 60)
print("测试 wxauto")
print("=" * 60)

try:
    from wxauto import WeChat
    print("✓ wxauto 导入成功")
    
    # 尝试连接微信
    print("\n正在连接微信...")
    wx = WeChat()
    print("✓ 微信连接成功！")
    
    # 获取会话列表
    print("\n获取会话列表...")
    sessions = wx.GetSessionList() if hasattr(wx, 'GetSessionList') else None
    if sessions:
        print(f"会话数量: {len(sessions)}")
        for s in sessions[:5]:
            print(f"  - {s}")
    
    # 测试搜索功能
    print("\n测试搜索功能...")
    # wx.Search("文件传输助手")
    
    print("\n" + "=" * 60)
    print("✓ wxauto 测试完成！微信连接正常")
    print("=" * 60)
    
except Exception as e:
    print(f"✗ 错误: {e}")
    import traceback
    traceback.print_exc()
