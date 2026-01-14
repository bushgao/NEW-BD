"""
坐标检测工具
把鼠标移到 + 按钮上，5秒后会打印当前鼠标位置
"""
import sys
import time
import pyautogui

sys.path.insert(0, r'f:\NEW BD\native-host')

def main():
    print("=" * 60)
    print("坐标检测工具")
    print("=" * 60)
    print("\n请把鼠标移动到微信的 + 按钮上！")
    print("5秒后会记录鼠标位置...\n")
    
    for i in range(5, 0, -1):
        pos = pyautogui.position()
        print(f"  {i}... 当前位置: ({pos.x}, {pos.y})")
        time.sleep(1)
    
    pos = pyautogui.position()
    print(f"\n\n>>> 记录的鼠标位置: ({pos.x}, {pos.y}) <<<")
    
    # 同时获取微信窗口位置以计算相对坐标
    from wechat_rpa import find_wechat_window
    import win32gui
    
    hwnd = find_wechat_window()
    if hwnd:
        rect = win32gui.GetWindowRect(hwnd)
        left, top = rect[0], rect[1]
        rel_x = pos.x - left
        rel_y = pos.y - top
        print(f"\n微信窗口位置: ({left}, {top})")
        print(f"相对于微信窗口的偏移: ({rel_x}, {rel_y})")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
