"""
微信 4.x RPA 自动化模块
使用纯 RPA 技术（键盘/鼠标模拟）实现微信自动化，适用于微信 4.x 版本

设计原则：简单、便捷、提高效率

验证环境：微信 4.1.6.46
"""

import time
import logging
import win32gui
import win32con
import pyautogui
import pyperclip
from typing import Optional, Dict, Any, List

# 配置 pyautogui
pyautogui.FAILSAFE = True  # 鼠标移到左上角会中断
pyautogui.PAUSE = 0.2  # 每个操作后暂停 0.2 秒

logger = logging.getLogger(__name__)

# ============================================================================
# 微信窗口管理
# ============================================================================

def find_wechat_window() -> Optional[int]:
    """查找微信主窗口，返回窗口句柄"""
    try:
        # 先尝试通过标题查找
        hwnd = win32gui.FindWindow(None, "微信")
        if hwnd:
            return hwnd
        
        # 如果找不到，尝试通过类名查找
        for class_name in ['WeChatMainWndForPC', 'Qt51514QWindowIcon']:
            hwnd = win32gui.FindWindow(class_name, None)
            if hwnd:
                return hwnd
        
        return None
    except Exception as e:
        logger.error(f"查找微信窗口失败: {e}")
        return None


def activate_wechat() -> bool:
    """激活微信窗口到前台"""
    hwnd = find_wechat_window()
    if hwnd:
        try:
            # 先显示窗口（处理托盘最小化情况）
            win32gui.ShowWindow(hwnd, win32con.SW_SHOW)
            time.sleep(0.2)
            
            # 如果窗口最小化，恢复
            if win32gui.IsIconic(hwnd):
                win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
                time.sleep(0.2)
            
            # 尝试多种方式激活窗口
            try:
                win32gui.SetForegroundWindow(hwnd)
            except:
                # 如果直接设置前台失败，先最小化再恢复
                win32gui.ShowWindow(hwnd, win32con.SW_MINIMIZE)
                time.sleep(0.1)
                win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
                time.sleep(0.1)
                win32gui.SetForegroundWindow(hwnd)
            
            time.sleep(0.5)
            return True
        except Exception as e:
            logger.error(f"激活微信窗口失败: {e}")
    return False


def get_wechat_info() -> Optional[Dict[str, Any]]:
    """获取微信窗口信息"""
    hwnd = find_wechat_window()
    if hwnd:
        rect = win32gui.GetWindowRect(hwnd)
        return {
            "hwnd": hwnd,
            "left": rect[0],
            "top": rect[1],
            "width": rect[2] - rect[0],
            "height": rect[3] - rect[1]
        }
    return None


# ============================================================================
# 键盘操作（核心）
# ============================================================================

def press_key(key: str, interval: float = 0.1):
    """按下单个键"""
    pyautogui.press(key, interval=interval)


def hotkey(*keys, interval: float = 0.1):
    """按下组合键"""
    pyautogui.hotkey(*keys, interval=interval)


def type_text(text: str, interval: float = 0.05):
    """输入文本（使用剪贴板方式避免中文问题）"""
    import pyperclip
    pyperclip.copy(text)
    hotkey('ctrl', 'v')
    time.sleep(0.2)


# ============================================================================
# 微信操作流程
# ============================================================================

def open_search() -> bool:
    """打开微信搜索框 (Ctrl+F)"""
    if not activate_wechat():
        return False
    hotkey('ctrl', 'f')
    time.sleep(0.5)
    return True


def open_add_friend_menu() -> bool:
    """
    打开添加好友菜单
    
    使用相对坐标点击方式（更稳定）：
    1. 激活微信窗口
    2. 获取窗口位置
    3. 计算 + 按钮位置（相对于窗口的固定偏移）
    4. 点击 + 按钮
    5. 按 2 次 Down 选择 "添加朋友"
    6. 按 Enter 确认
    
    Returns:
        True 如果成功打开添加好友界面
    """
    try:
        if not activate_wechat():
            logger.error("无法激活微信窗口")
            return False
        
        # 获取微信窗口位置
        hwnd = find_wechat_window()
        if not hwnd:
            logger.error("无法找到微信窗口")
            return False
        
        rect = win32gui.GetWindowRect(hwnd)
        left, top = rect[0], rect[1]
        
        # + 按钮相对于窗口左上角的固定偏移
        # 这个偏移值经过验证适用于微信 4.x
        plus_offset_x = 245
        plus_offset_y = 40
        
        plus_x = left + plus_offset_x
        plus_y = top + plus_offset_y
        
        logger.info(f"点击 + 按钮: ({plus_x}, {plus_y})")
        
        # 点击 + 按钮
        pyautogui.click(plus_x, plus_y)
        time.sleep(0.5)
        
        # 菜单弹出后，按 2 次 Down 选择 "添加朋友"
        # 菜单结构：1. 发起群聊, 2. 添加朋友, 3. 新建笔记
        press_key('down')
        time.sleep(0.2)
        press_key('down')
        time.sleep(0.2)
        
        # Enter 确认
        press_key('enter')
        time.sleep(0.8)  # 等待添加朋友界面打开
        
        logger.info("成功打开添加好友界面")
        return True
        
    except Exception as e:
        logger.error(f"打开添加好友菜单失败: {e}")
        return False


def search_contact(keyword: str, select_result: bool = True, down_count: int = 6) -> bool:
    """
    搜索联系人/微信号
    
    微信搜索结果结构（从上到下）：
    1. 搜索网络结果
    2. 多个搜索建议（约5个）
    3. 功能区 - 联系人/公众号（绿色图标）
    4. 聊天记录
    5. 收藏
    
    流程：
    1. Ctrl+F 打开搜索
    2. 输入关键词
    3. 等待搜索结果
    4. 按多次 Down 键跳过搜索建议，选择功能区联系人
    
    Args:
        keyword: 搜索关键词
        select_result: 是否自动选择结果
        down_count: 按下向下键的次数（默认6次跳过搜索建议）
    """
    try:
        if not open_search():
            logger.error("无法打开搜索框")
            return False
        
        # 清空搜索框并输入
        hotkey('ctrl', 'a')
        time.sleep(0.1)
        pyperclip.copy(keyword)
        hotkey('ctrl', 'v')
        time.sleep(1.5)  # 等待搜索结果加载
        
        if select_result:
            # 按多次向下键跳过搜索建议，选择功能区联系人
            logger.info(f"按 {down_count} 次向下键选择功能区联系人...")
            for i in range(down_count):
                press_key('down')
                time.sleep(0.15)
            
            time.sleep(0.3)
            # 按 Enter 确认
            press_key('enter')
            time.sleep(0.5)
        
        logger.info(f"搜索并选择联系人成功: {keyword}")
        return True
        
    except Exception as e:
        logger.error(f"搜索联系人失败: {e}")
        return False


def add_friend_by_id(
    wechat_id: str,
    message: str = "你好，很高兴认识你",
    remark: str = None
) -> Dict[str, Any]:
    """
    通过微信号/手机号添加陌生人好友
    
    经验证的流程：
    1. 点击 + 按钮打开菜单，选择"添加朋友"
    2. 查找"添加朋友"对话框，点击输入框
    3. 输入微信号并搜索
    4. 点击"添加到通讯录"按钮（在对话框底部）
    5. 在"申请添加朋友"对话框填写验证消息和备注
    6. 点击确定发送请求
    
    Args:
        wechat_id: 微信号或手机号
        message: 验证消息
        remark: 备注名（可选）
    
    Returns:
        Dict 包含 success, message 等信息
    """
    try:
        logger.info(f"开始添加好友: {wechat_id}")
        
        # Step 1: 打开添加好友菜单
        if not open_add_friend_menu():
            return {"success": False, "message": "无法打开添加好友界面", "wechat_id": wechat_id}
        
        time.sleep(0.5)
        
        # Step 2: 查找"添加朋友"对话框
        dialog_hwnd = win32gui.FindWindow(None, "添加朋友")
        if not dialog_hwnd:
            logger.error("无法找到添加朋友对话框")
            return {"success": False, "message": "无法找到添加朋友对话框", "wechat_id": wechat_id}
        
        rect = win32gui.GetWindowRect(dialog_hwnd)
        dlg_left, dlg_top = rect[0], rect[1]
        dlg_width = rect[2] - rect[0]
        dlg_height = rect[3] - rect[1]
        
        # Step 3: 点击输入框
        input_x = dlg_left + dlg_width // 2 - 50
        input_y = dlg_top + 65
        logger.info(f"点击输入框: ({input_x}, {input_y})")
        pyautogui.click(input_x, input_y)
        time.sleep(0.3)
        
        # Step 4: 输入微信号
        logger.info(f"输入微信号: {wechat_id}")
        pyperclip.copy(wechat_id)
        hotkey('ctrl', 'v')
        time.sleep(0.5)
        
        # Step 5: 按 Enter 搜索
        press_key('enter')
        time.sleep(2)  # 等待搜索结果
        
        # Step 6: 重新获取对话框位置（搜索后可能变化）
        rect = win32gui.GetWindowRect(dialog_hwnd)
        dlg_left, dlg_top = rect[0], rect[1]
        dlg_width = rect[2] - rect[0]
        dlg_height = rect[3] - rect[1]
        
        # Step 7: 点击"添加到通讯录"按钮
        # 按钮始终在对话框底部，距离底部约 70px，水平居中
        add_btn_x = dlg_left + dlg_width // 2
        add_btn_y = dlg_top + dlg_height - 70
        logger.info(f"点击添加到通讯录: ({add_btn_x}, {add_btn_y})")
        pyautogui.click(add_btn_x, add_btn_y)
        time.sleep(1)
        
        # Step 8: 查找"申请添加朋友"对话框
        apply_dialog = win32gui.FindWindow(None, "申请添加朋友")
        if not apply_dialog:
            logger.error("无法找到申请添加朋友对话框")
            return {"success": False, "message": "无法找到申请添加朋友对话框（可能用户不存在）", "wechat_id": wechat_id}
        
        apply_rect = win32gui.GetWindowRect(apply_dialog)
        apply_left, apply_top = apply_rect[0], apply_rect[1]
        apply_width = apply_rect[2] - apply_rect[0]
        apply_height = apply_rect[3] - apply_rect[1]
        
        # Step 9: 点击验证消息输入框并填写
        # 验证消息输入框在对话框顶部，距离顶部约 120px
        msg_x = apply_left + apply_width // 2
        msg_y = apply_top + 120
        logger.info(f"点击验证消息输入框: ({msg_x}, {msg_y})")
        pyautogui.click(msg_x, msg_y)
        time.sleep(0.2)
        hotkey('ctrl', 'a')
        pyperclip.copy(message)
        hotkey('ctrl', 'v')
        time.sleep(0.3)
        
        # Step 10: 如果有备注，点击备注输入框并填写
        if remark:
            # 备注输入框大约在 y = 230
            remark_x = apply_left + apply_width // 2
            remark_y = apply_top + 275
            logger.info(f"点击备注输入框: ({remark_x}, {remark_y})")
            pyautogui.click(remark_x, remark_y)
            time.sleep(0.2)
            hotkey('ctrl', 'a')
            pyperclip.copy(remark)
            hotkey('ctrl', 'v')
            time.sleep(0.3)
        
        # Step 11: 点击"确定"按钮
        # 确定按钮在对话框底部左侧，距离底部约 50px
        confirm_x = apply_left + 120
        confirm_y = apply_top + apply_height - 50
        logger.info(f"点击确定按钮: ({confirm_x}, {confirm_y})")
        pyautogui.click(confirm_x, confirm_y)
        time.sleep(0.5)
        
        # 关闭可能残留的对话框
        press_key('escape')
        time.sleep(0.3)
        
        logger.info(f"添加好友请求已发送: {wechat_id}")
        return {
            "success": True,
            "message": "添加好友请求已发送",
            "wechat_id": wechat_id
        }
        
    except Exception as e:
        logger.error(f"添加好友失败: {e}")
        return {
            "success": False,
            "message": str(e),
            "wechat_id": wechat_id
        }


def send_message(who: str, message: str) -> Dict[str, Any]:
    """
    发送消息给指定联系人
    
    Args:
        who: 联系人昵称/备注
        message: 消息内容
    """
    try:
        # 搜索联系人
        if not search_contact(who):
            return {"success": False, "message": "无法搜索联系人"}
        
        # 按 Enter 选择联系人
        press_key('enter')
        time.sleep(0.5)
        
        # 输入消息并发送
        type_text(message)
        press_key('enter')
        
        return {"success": True, "message": "消息已发送"}
        
    except Exception as e:
        logger.error(f"发送消息失败: {e}")
        return {"success": False, "message": str(e)}


# ============================================================================
# 状态检测
# ============================================================================

def check_wechat_running() -> Dict[str, Any]:
    """检查微信是否运行"""
    hwnd = find_wechat_window()
    if hwnd:
        try:
            title = win32gui.GetWindowText(hwnd)
            rect = win32gui.GetWindowRect(hwnd)
            return {
                "running": True,
                "hwnd": hwnd,
                "window_title": title,
                "position": {"x": rect[0], "y": rect[1]},
                "size": {"width": rect[2] - rect[0], "height": rect[3] - rect[1]}
            }
        except Exception as e:
            logger.error(f"获取窗口信息失败: {e}")
            return {"running": True, "hwnd": hwnd}
    return {"running": False, "message": "未找到微信窗口"}


# ============================================================================
# 批量操作
# ============================================================================

def batch_add_friends(
    wechat_ids: List[str],
    message: str = "你好，很高兴认识你",
    delay_between: float = 5.0
) -> List[Dict[str, Any]]:
    """
    批量添加好友
    
    Args:
        wechat_ids: 微信号列表
        message: 验证消息
        delay_between: 每次添加之间的延迟（秒），建议 5-10 秒
    
    Returns:
        每个添加操作的结果列表
    """
    results = []
    
    for i, wechat_id in enumerate(wechat_ids):
        logger.info(f"添加好友 [{i+1}/{len(wechat_ids)}]: {wechat_id}")
        
        result = add_friend_by_id(wechat_id, message)
        result["index"] = i
        results.append(result)
        
        # 添加延迟，避免操作过快被限制
        if i < len(wechat_ids) - 1:
            logger.info(f"等待 {delay_between} 秒...")
            time.sleep(delay_between)
    
    return results


# ============================================================================
# 测试函数
# ============================================================================

def test_rpa():
    """测试 RPA 功能"""
    print("=" * 60)
    print("微信 RPA 测试")
    print("=" * 60)
    
    # 检测微信
    status = check_wechat_running()
    print(f"微信状态: {status}")
    
    if not status.get("running"):
        print("请先打开微信！")
        return
    
    # 测试激活窗口
    print("\n测试激活微信窗口...")
    if activate_wechat():
        print("✓ 微信窗口已激活")
    else:
        print("✗ 激活失败")
        return
    
    # 测试搜索
    print("\n测试搜索功能（将搜索'文件传输助手'）...")
    time.sleep(2)
    if search_contact("文件传输助手"):
        print("✓ 搜索成功")
        press_key('escape')  # 关闭搜索
    else:
        print("✗ 搜索失败")
    
    print("\n测试完成！")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    test_rpa()
