"""
测试：使用鼠标点击 + 按钮
通过计算 + 按钮相对于微信窗口的位置来点击
"""
import sys
import time

sys.path.insert(0, r'f:\NEW BD\native-host')

def main():
    print("=" * 60)
    print("测试：鼠标点击 + 按钮")
    print("=" * 60)
    
    import win32gui
    import pyautogui
    from wechat_rpa import activate_wechat, find_wechat_window, hotkey
    
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
    
    # Step 2: 获取微信窗口位置
    print("\n[Step 2] 获取微信窗口位置...")
    hwnd = find_wechat_window()
    rect = win32gui.GetWindowRect(hwnd)
    left, top, right, bottom = rect
    width = right - left
    height = bottom - top
    print(f"  窗口位置: left={left}, top={top}")
    print(f"  窗口大小: {width} x {height}")
    
    # Step 3: 计算 + 按钮位置
    # 从截图分析：+ 按钮在搜索框右边
    # 搜索框在顶部，+ 按钮大约在 x=搜索框右边约 10-20px，y=顶部约 40-50px
    # 实际位置需要根据窗口大小调整
    
    # + 按钮相对位置估算：
    # - X: 左边距（约70px侧边栏）+ 搜索框宽度 + 一点偏移
    # - Y: 顶部约 40px
    
    # 简化：搜索框在左侧边栏右边，+ 按钮在搜索框右边
    # 假设侧边栏宽度约 70px，搜索框宽度约 200px
    plus_x = left + 70 + 200 + 15  # 侧边栏 + 搜索框 + 偏移
    plus_y = top + 45  # 顶部偏移
    
    print(f"\n[Step 3] + 按钮预估位置: ({plus_x}, {plus_y})")
    
    # Step 4: 点击 + 按钮
    print("\n[Step 4] 点击 + 按钮...")
    pyautogui.click(plus_x, plus_y)
    time.sleep(0.8)
    print("  ✓ 已点击")
    
    print("\n>>> 暂停2秒，观察是否弹出菜单 <<<")
    time.sleep(2)
    
    print("\n" + "=" * 60)
    print("测试完成！")
    print("请确认是否弹出了菜单（发起群聊、添加朋友、新建笔记）？")
    print("=" * 60)

if __name__ == "__main__":
    main()
