"""
微信 4.x UI 分析工具 v3 - 使用 comtypes 直接访问 UI Automation
"""
import sys
sys.path.insert(0, r'f:\NEW BD\native-host\wxauto-main')

import win32gui
import win32process
import ctypes
from ctypes import wintypes

def analyze():
    print("=" * 70)
    print("微信 4.x UI 分析工具 v3")
    print("=" * 70)
    
    # 1. 查找微信窗口
    results = []
    def callback(hwnd, _):
        if win32gui.IsWindowVisible(hwnd):
            try:
                title = win32gui.GetWindowText(hwnd)
                cls = win32gui.GetClassName(hwnd)
                if '微信' in title:
                    _, pid = win32process.GetWindowThreadProcessId(hwnd)
                    results.append({'hwnd': hwnd, 'class': cls, 'title': title, 'pid': pid})
            except:
                pass
        return True
    win32gui.EnumWindows(callback, None)
    
    print(f"\n找到 {len(results)} 个微信窗口：")
    for w in results:
        print(f"  hwnd={w['hwnd']}, class={w['class'][:30]}, title={w['title']}")
    
    if not results:
        print("❌ 未找到微信窗口")
        return
    
    main_hwnd = results[0]['hwnd']
    
    # 2. 枚举子窗口
    print(f"\n子窗口列表 (hwnd={main_hwnd})：")
    child_windows = []
    def enum_child(hwnd, _):
        try:
            cls = win32gui.GetClassName(hwnd)
            title = win32gui.GetWindowText(hwnd)
            child_windows.append({'hwnd': hwnd, 'class': cls, 'title': title})
        except:
            pass
        return True
    win32gui.EnumChildWindows(main_hwnd, enum_child, None)
    
    print(f"  找到 {len(child_windows)} 个子窗口")
    for i, w in enumerate(child_windows[:20]):
        print(f"    [{i+1}] class={w['class']}, title={w['title'][:30] if w['title'] else '(无)'}")
    
    # 3. 尝试使用 pywinauto 的 Desktop
    print(f"\n使用 pywinauto 分析 (hwnd={main_hwnd})：")
    try:
        from pywinauto import Desktop
        from pywinauto.application import Application
        
        # 连接到微信窗口
        app = Application(backend='uia').connect(handle=main_hwnd)
        wnd = app.window(handle=main_hwnd)
        
        print(f"  窗口名称: {wnd.window_text()}")
        print(f"  窗口类名: {wnd.class_name()}")
        
        # 打印控件信息
        print(f"\n  控件树（使用 print_control_identifiers）：")
        wnd.print_control_identifiers(depth=3)
        
    except Exception as e:
        print(f"  pywinauto 分析失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    analyze()
