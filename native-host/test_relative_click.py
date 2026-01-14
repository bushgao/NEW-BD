"""
使用相对坐标点击 + 按钮
+ 按钮位置相对于微信窗口是固定的
"""
import sys
import time

sys.path.insert(0, r'f:\NEW BD\native-host')

def main():
    print("=" * 60)
    print("使用相对坐标点击 + 按钮")
    print("=" * 60)
    
    import win32gui
    import pyautogui
    from wechat_rpa import activate_wechat, find_wechat_window, press_key
    
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
    print(f"  窗口左上角: ({left}, {top})")
    print(f"  窗口宽度: {width}")
    
    # Step 3: 计算 + 按钮位置
    # 从截图分析：
    # - 左侧边栏约 55-60px
    # - 搜索框在侧边栏右边，宽度约 180px
    # - + 按钮紧挨着搜索框右边
    # 所以 + 按钮的 X 坐标约为: 左侧边栏 + 搜索框宽度 + 一点偏移
    # Y 坐标约为顶部 40px（标题栏 + 一点距离）
    
    # 相对偏移（需要根据实际微信界面调整）
    plus_offset_x = 245  # 从窗口左边到 + 按钮中心的距离
    plus_offset_y = 40   # 从窗口顶部到 + 按钮中心的距离
    
    plus_x = left + plus_offset_x
    plus_y = top + plus_offset_y
    
    print(f"\n[Step 3] + 按钮位置: ({plus_x}, {plus_y})")
    print(f"  相对偏移: ({plus_offset_x}, {plus_offset_y})")
    
    # Step 4: 点击 + 按钮
    print("\n[Step 4] 点击 + 按钮...")
    pyautogui.click(plus_x, plus_y)
    time.sleep(0.5)
    print("  ✓ 已点击")
    
    print("\n>>> 暂停1秒观察菜单 <<<")
    time.sleep(1)
    
    # Step 5: 菜单应该弹出，按 Down 选择 "添加朋友"
    print("\n[Step 5] 按 2 次 Down 选择添加朋友...")
    press_key('down')
    time.sleep(0.2)
    press_key('down')
    time.sleep(0.3)
    print("  ✓ 已按 2 次 Down")
    
    # Step 6: Enter 确认
    print("\n[Step 6] 按 Enter 确认...")
    press_key('enter')
    time.sleep(1)
    print("  ✓ 已按 Enter")
    
    print("\n" + "=" * 60)
    print("测试完成！请确认是否打开了 '添加朋友' 界面？")
    print("如果没点中 + 按钮，需要调整 plus_offset_x 和 plus_offset_y")
    print("=" * 60)

if __name__ == "__main__":
    main()
