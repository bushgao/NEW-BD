"""
微信 4.x UI 控件树分析工具
运行此脚本，会输出微信窗口的完整控件结构
"""
import sys
import os

# 添加 comtypes 路径
sys.path.insert(0, r'f:\NEW BD\native-host\wxauto-main')

def analyze_wechat_ui():
    import win32gui
    import win32process
    
    print("=" * 70)
    print("微信 4.x UI 控件树分析工具")
    print("=" * 70)
    
    # 1. 查找微信窗口
    def find_wechat_windows():
        results = []
        def callback(hwnd, _):
            if win32gui.IsWindowVisible(hwnd):
                try:
                    title = win32gui.GetWindowText(hwnd)
                    cls = win32gui.GetClassName(hwnd)
                    if '微信' in title or 'wechat' in cls.lower():
                        _, pid = win32process.GetWindowThreadProcessId(hwnd)
                        results.append({'hwnd': hwnd, 'class': cls, 'title': title, 'pid': pid})
                except:
                    pass
            return True
        win32gui.EnumWindows(callback, None)
        return results
    
    windows = find_wechat_windows()
    
    if not windows:
        print("\n❌ 未找到微信窗口！请确保微信已打开并登录。")
        return
    
    print(f"\n找到 {len(windows)} 个微信窗口：")
    for i, w in enumerate(windows):
        print(f"\n  [{i+1}] hwnd={w['hwnd']}, class={w['class']}, title={w['title']}")
    
    # 2. 使用 UI Automation 分析控件树
    print("\n" + "=" * 70)
    print("正在分析 UI 控件树（可能需要几秒钟）...")
    print("=" * 70)
    
    try:
        from wxauto import uia
        
        main_window = windows[0]
        hwnd = main_window['hwnd']
        
        control = uia.ControlFromHandle(hwnd)
        if control:
            print(f"\n主窗口控件信息：")
            print(f"  Name: {control.Name}")
            print(f"  ClassName: {control.ClassName}")
            print(f"  ControlTypeName: {control.ControlTypeName}")
            print(f"  AutomationId: {control.AutomationId}")
            
            # 获取子控件
            print(f"\n直接子控件：")
            children = control.GetChildren()
            for i, child in enumerate(children[:10]):  # 只显示前10个
                print(f"\n  [{i+1}] {child.ControlTypeName}")
                print(f"      Name: '{child.Name}'")
                print(f"      ClassName: '{child.ClassName}'")
                print(f"      AutomationId: '{child.AutomationId}'")
                
                # 显示孙子控件
                grandchildren = child.GetChildren()
                if grandchildren:
                    print(f"      子控件数量: {len(grandchildren)}")
                    for j, gc in enumerate(grandchildren[:5]):
                        print(f"        [{j+1}] {gc.ControlTypeName}: '{gc.Name}' (class={gc.ClassName})")
            
            # 保存完整的控件树到文件
            print("\n" + "=" * 70)
            print("正在保存完整控件树到文件...")
            output_file = os.path.join(os.path.dirname(__file__), 'wechat_4x_ui_tree.txt')
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(f"微信 4.x UI 控件树\n")
                f.write(f"窗口句柄: {hwnd}\n")
                f.write(f"窗口类名: {main_window['class']}\n")
                f.write(f"窗口标题: {main_window['title']}\n")
                f.write("=" * 70 + "\n\n")
                try:
                    f.write(control.tree_text)
                except Exception as e:
                    f.write(f"无法获取完整控件树: {e}\n")
            
            print(f"✅ 完整控件树已保存到: {output_file}")
            print("\n请将该文件的内容发给开发者分析！")
        else:
            print("❌ 无法获取窗口控件")
            
    except Exception as e:
        print(f"\n❌ 分析失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    analyze_wechat_ui()
    input("\n按 Enter 键退出...")
