"""检查微信窗口类名"""
import win32gui

print("=" * 60)
print("检查微信窗口")
print("=" * 60)

windows = []

def callback(hwnd, _):
    if win32gui.IsWindowVisible(hwnd):
        title = win32gui.GetWindowText(hwnd)
        cls = win32gui.GetClassName(hwnd)
        if '微信' in title or 'WeChat' in cls:
            windows.append((hwnd, cls, title))
    return True

win32gui.EnumWindows(callback, None)

if windows:
    print(f"找到 {len(windows)} 个微信相关窗口:")
    for hwnd, cls, title in windows:
        print(f"  hwnd={hwnd}, class='{cls}', title='{title}'")
else:
    print("未找到微信窗口，请确保微信已打开")
