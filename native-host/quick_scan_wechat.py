"""
快速测试微信窗口类名
"""
import win32gui
import win32process

print("=" * 60)
print("快速扫描所有可见的微信相关窗口")
print("=" * 60)

def callback(hwnd, results):
    if win32gui.IsWindowVisible(hwnd):
        try:
            title = win32gui.GetWindowText(hwnd)
            cls = win32gui.GetClassName(hwnd)
            if '微信' in title or 'WeChat' in title or 'mmui' in cls:
                results.append({
                    'hwnd': hwnd,
                    'title': title,
                    'class': cls
                })
        except:
            pass
    return True

results = []
win32gui.EnumWindows(callback, results)

if results:
    print(f"\n找到 {len(results)} 个相关窗口：\n")
    for w in results:
        print(f"  hwnd={w['hwnd']}")
        print(f"  title='{w['title']}'")
        print(f"  class='{w['class']}'")
        print()
else:
    print("\n未找到微信相关窗口")

print("完成！")
