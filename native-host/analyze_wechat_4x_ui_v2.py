"""
微信 4.x UI 控件树分析工具 v2 - 使用递归遍历
"""
import sys
import os

sys.path.insert(0, r'f:\NEW BD\native-host\wxauto-main')

def analyze_wechat_ui():
    import win32gui
    import win32process
    
    print("=" * 70)
    print("微信 4.x UI 控件树分析工具 v2")
    print("=" * 70)
    
    # 查找微信窗口
    def find_wechat_windows():
        results = []
        def callback(hwnd, _):
            if win32gui.IsWindowVisible(hwnd):
                try:
                    title = win32gui.GetWindowText(hwnd)
                    cls = win32gui.GetClassName(hwnd)
                    if '微信' in title and 'Qt' in cls:
                        _, pid = win32process.GetWindowThreadProcessId(hwnd)
                        results.append({'hwnd': hwnd, 'class': cls, 'title': title, 'pid': pid})
                except:
                    pass
            return True
        win32gui.EnumWindows(callback, None)
        return results
    
    windows = find_wechat_windows()
    
    if not windows:
        print("\n❌ 未找到微信窗口！")
        return
    
    print(f"\n找到 {len(windows)} 个微信窗口")
    
    # 使用 UI Automation
    from wxauto import uia
    
    main_window = windows[0]
    hwnd = main_window['hwnd']
    
    control = uia.ControlFromHandle(hwnd)
    
    output_lines = []
    
    def walk_tree(ctrl, depth=0, max_depth=5):
        """递归遍历控件树"""
        if depth > max_depth:
            return
        
        indent = "  " * depth
        try:
            info = f"{indent}[{ctrl.ControlTypeName}] Name='{ctrl.Name}' Class='{ctrl.ClassName}' AutoId='{ctrl.AutomationId}'"
            output_lines.append(info)
            print(info[:120])  # 控制台只显示前120字符
            
            children = ctrl.GetChildren()
            for child in children:
                walk_tree(child, depth + 1, max_depth)
        except Exception as e:
            output_lines.append(f"{indent}Error: {e}")
    
    print("\n控件树结构（前5层）：")
    print("-" * 70)
    walk_tree(control)
    
    # 保存到文件
    output_file = os.path.join(os.path.dirname(__file__), 'wechat_4x_ui_tree_v2.txt')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"微信 4.x UI 控件树\n")
        f.write(f"窗口句柄: {hwnd}\n")
        f.write(f"窗口类名: {main_window['class']}\n")
        f.write("=" * 70 + "\n\n")
        f.write("\n".join(output_lines))
    
    print(f"\n✅ 已保存到: {output_file}")

if __name__ == "__main__":
    analyze_wechat_ui()
