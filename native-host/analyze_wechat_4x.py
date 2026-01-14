"""
微信 4.x 窗口结构分析脚本
"""
import win32gui
import win32process
import os

def get_wechat_windows():
    """获取所有微信相关窗口"""
    results = []
    
    def callback(hwnd, _):
        if win32gui.IsWindowVisible(hwnd):
            try:
                title = win32gui.GetWindowText(hwnd)
                cls = win32gui.GetClassName(hwnd)
                _, pid = win32process.GetWindowThreadProcessId(hwnd)
                
                # 检查是否是微信相关窗口
                if ('微信' in title or 
                    'wechat' in cls.lower() or 
                    'wechat' in title.lower()):
                    results.append({
                        'hwnd': hwnd,
                        'class': cls,
                        'title': title,
                        'pid': pid
                    })
            except:
                pass
        return True
    
    win32gui.EnumWindows(callback, None)
    return results

def main():
    print("=" * 60)
    print("微信 4.x 窗口结构分析")
    print("=" * 60)
    
    windows = get_wechat_windows()
    
    if not windows:
        print("\n未找到微信窗口！")
        print("请确保微信已打开并登录。")
        
        # 列出所有顶层窗口看看
        print("\n所有可见的顶层窗口：")
        all_windows = []
        def enum_all(hwnd, _):
            if win32gui.IsWindowVisible(hwnd):
                title = win32gui.GetWindowText(hwnd)
                if title:  # 只显示有标题的窗口
                    cls = win32gui.GetClassName(hwnd)
                    all_windows.append((hwnd, cls, title[:50]))
            return True
        win32gui.EnumWindows(enum_all, None)
        
        for hwnd, cls, title in all_windows[:20]:  # 只显示前20个
            print(f"  hwnd={hwnd}, class={cls}, title={title}")
    else:
        print(f"\n找到 {len(windows)} 个微信窗口：")
        for w in windows:
            print(f"\n  窗口句柄: {w['hwnd']}")
            print(f"  窗口类名: {w['class']}")
            print(f"  窗口标题: {w['title']}")
            print(f"  进程ID: {w['pid']}")

if __name__ == "__main__":
    main()
