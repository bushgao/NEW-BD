"""
调试脚本：打印微信窗口的控件结构
用于识别正确的控件属性来实现更精确的自动化操作
"""
import sys
import time
sys.path.insert(0, 'f:/NEW BD/native-host')

from pywinauto import Application, Desktop
from pywinauto.findbestmatch import MatchError

def main():
    print("=" * 60)
    print("微信控件调试工具")
    print("=" * 60)
    
    # 扫描微信窗口
    desktop = Desktop(backend="uia")
    wechat_windows = []
    
    for win in desktop.windows():
        try:
            class_name = win.class_name() or ''
            title = win.window_text() or ''
            if '微信' in title or 'WeChat' in title or 'Weixin' in class_name.lower():
                wechat_windows.append({
                    'title': title,
                    'class_name': class_name,
                    'handle': win.handle
                })
        except:
            continue
    
    if not wechat_windows:
        print("未找到微信窗口！")
        return
    
    print(f"\n找到 {len(wechat_windows)} 个微信窗口:")
    for i, win in enumerate(wechat_windows):
        print(f"  {i+1}. {win['title']} (class: {win['class_name']}, handle: {win['handle']})")
    
    # 选择第一个窗口进行分析
    target = wechat_windows[0]
    print(f"\n分析窗口: {target['title']}")
    print("-" * 60)
    
    try:
        app = Application(backend="uia").connect(handle=target['handle'])
        window = app.window(handle=target['handle'])
        
        # 打印控件树（只打印前几级避免输出太多）
        print("\n控件结构 (前3级):")
        print("-" * 60)
        
        # 将控件树输出到文件
        output_file = "f:/NEW BD/native-host/wechat_controls.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            window.print_control_identifiers(depth=4, filename=output_file)
        
        print(f"\n控件结构已保存到: {output_file}")
        
        # 尝试查找一些常见控件
        print("\n尝试查找常见控件:")
        print("-" * 60)
        
        controls_to_find = [
            ("搜索", "Edit"),
            ("搜索", "Button"),
            ("添加", "Button"),
            ("网络查找", "ListItem"),
            ("网络查找", "Text"),
        ]
        
        for title_pattern, ctrl_type in controls_to_find:
            try:
                ctrl = window.child_window(title_re=f".*{title_pattern}.*", control_type=ctrl_type)
                if ctrl.exists(timeout=1):
                    print(f"  ✓ 找到: {ctrl_type} - '{title_pattern}' -> {ctrl.window_text()[:50]}")
                else:
                    print(f"  ✗ 未找到: {ctrl_type} - '{title_pattern}'")
            except Exception as e:
                print(f"  ✗ 查找失败: {ctrl_type} - '{title_pattern}' ({e})")
        
        # 列出所有直接子控件
        print("\n直接子控件:")
        print("-" * 60)
        try:
            children = window.children()
            for i, child in enumerate(children[:20]):
                try:
                    print(f"  {i+1}. {child.friendly_class_name()}: '{child.window_text()[:30]}' ({child.class_name()})")
                except:
                    pass
        except Exception as e:
            print(f"获取子控件失败: {e}")
        
    except Exception as e:
        print(f"分析失败: {e}")

if __name__ == "__main__":
    main()
