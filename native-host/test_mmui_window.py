"""
测试 wechat-automation-api 的窗口查找方法
"""
import uiautomation as auto
import time

print("=" * 60)
print("测试微信 4.x 窗口查找（使用 mmui::MainWindow）")
print("=" * 60)

# 尝试使用 wechat-automation-api 的方法
print("\n1. 查找微信窗口 (ClassName='mmui::MainWindow')...")
wx = auto.WindowControl(searchDepth=1, Name="微信", ClassName='mmui::MainWindow')

if wx.Exists(0, 0):
    print("✅ 成功找到微信窗口！")
    print(f"   窗口标题: {wx.Name}")
    print(f"   窗口类名: {wx.ClassName}")
    print(f"   窗口句柄: {wx.NativeWindowHandle}")
    
    # 尝试获取窗口信息
    rect = wx.BoundingRectangle
    print(f"   窗口位置: ({rect.left}, {rect.top}) - ({rect.right}, {rect.bottom})")
    
    # 尝试查找搜索框
    print("\n2. 查找搜索框...")
    search_box = wx.EditControl(Name='搜索')
    if search_box.Exists(0, 0):
        print("✅ 找到搜索框！")
    else:
        print("❌ 未找到搜索框")
    
    # 尝试查找聊天输入框
    print("\n3. 查找聊天输入框...")
    chat_edit = wx.EditControl(foundIndex=1)
    if chat_edit.Exists(0, 0):
        print("✅ 找到聊天输入框！")
    else:
        print("❌ 未找到聊天输入框")
    
    # 列出一些子控件
    print("\n4. 列出部分子控件...")
    children = wx.GetChildren()
    for i, child in enumerate(children[:5]):
        print(f"   [{i}] {child.ControlTypeName}: Name='{child.Name}', Class='{child.ClassName}'")
    
else:
    print("❌ 未找到微信窗口")
    print("\n尝试其他方法...")
    
    # 尝试不指定类名
    wx2 = auto.WindowControl(searchDepth=1, Name="微信")
    if wx2.Exists(0, 0):
        print(f"找到窗口: ClassName='{wx2.ClassName}'")
    else:
        print("仍然找不到微信窗口")

print("\n完成！")
