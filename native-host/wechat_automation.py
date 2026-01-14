#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微信 PC 端 UI 自动化模块

使用 pywinauto 进行微信窗口操作
"""

import time
import logging
import psutil
from typing import List, Dict, Any, Optional, Tuple

try:
    from pywinauto import Application, Desktop
    from pywinauto.findwindows import ElementNotFoundError
    from pywinauto.keyboard import send_keys
    import pyautogui
    AUTOMATION_AVAILABLE = True
except ImportError:
    AUTOMATION_AVAILABLE = False

logger = logging.getLogger(__name__)


class WeChatAutomation:
    """
    微信自动化操作类
    """
    
    # 微信窗口类名列表（支持多种版本）
    WECHAT_WINDOW_CLASSES = [
        "WeChatMainWndForPC",      # 标准微信 PC
        "WeixinMainWndForPC",      # 微信 PC（中文版）
        "WeWorkWindow",            # 企业微信
        "WeChatLoginWndForPC",     # 微信登录窗口
        "WeixinLoginWndForPC",     # 微信登录窗口（中文版）
        "ChatWnd",                 # 聊天窗口
        "ImagePreviewWnd",         # 图片预览
        "SelectContactWnd",        # 选择联系人
        "AddContactWnd",           # 添加联系人
        "CefWebViewWnd",           # 新版微信 WebView 窗口
        "Chrome_WidgetWin_0",      # 某些微信版本使用 Chromium
    ]
    
    # 窗口类名关键字（用于模糊匹配）
    WECHAT_CLASS_KEYWORDS = ['WeChat', 'Weixin', '微信', 'WxWork']
    WECHAT_LOGIN_CLASS = "WeChatLoginWndForPC"
    
    # 微信进程名称列表
    WECHAT_PROCESS_NAMES = [
        'WeChat', 'Weixin', '微信',
        'WeChatAppEx', 'WeChatApp',
    ]
    
    def __init__(self):
        if not AUTOMATION_AVAILABLE:
            raise ImportError("pywinauto 或 pyautogui 未安装，请先安装依赖")
        
        self.app: Optional[Application] = None
        self.main_window = None
    
    def find_wechat_processes(self) -> List[Dict[str, Any]]:
        """
        查找所有微信进程
        """
        wechat_processes = []
        
        for proc in psutil.process_iter(['pid', 'name', 'exe']):
            try:
                proc_name = proc.info['name'] or ''
                # 检查是否是微信相关进程
                is_wechat = any(name in proc_name for name in self.WECHAT_PROCESS_NAMES)
                if is_wechat:
                    wechat_processes.append({
                        'pid': proc.info['pid'],
                        'name': proc.info['name'],
                        'exe': proc.info['exe']
                    })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        return wechat_processes
    
    def get_account_nickname(self, window_handle: int) -> Optional[str]:
        """
        获取窗口对应的进程 PID 作为区分标识
        """
        try:
            import ctypes
            from ctypes import wintypes
            
            # 获取窗口所属进程ID
            pid = wintypes.DWORD()
            ctypes.windll.user32.GetWindowThreadProcessId(window_handle, ctypes.byref(pid))
            
            if pid.value:
                return f"PID:{pid.value}"
            
            return None
            
        except Exception as e:
            logger.error(f"获取进程PID失败: {e}")
            return None
    
    def flash_window(self, window_handle: int) -> bool:
        """
        闪烁指定窗口以帮助用户识别
        """
        try:
            import ctypes
            
            # 使用 FlashWindow API 闪烁窗口
            ctypes.windll.user32.FlashWindow(window_handle, True)
            return True
        except Exception as e:
            logger.error(f"闪烁窗口失败: {e}")
            return False
    
    def bring_window_to_front(self, window_handle: int) -> bool:
        """
        将窗口置顶显示
        """
        try:
            # 方法1: 使用 pywinauto
            try:
                app = Application(backend="uia").connect(handle=window_handle)
                window = app.window(handle=window_handle)
                
                # 恢复窗口
                if window.is_minimized():
                    window.restore()
                
                # 设置焦点
                window.set_focus()
                
                logger.info(f"使用 pywinauto 置顶窗口 {window_handle} 成功")
                return True
            except Exception as e1:
                logger.warning(f"pywinauto 方法失败: {e1}")
            
            # 方法2: 使用 pyautogui 模拟点击
            try:
                import ctypes
                from ctypes import wintypes
                
                # 获取窗口位置
                class RECT(ctypes.Structure):
                    _fields_ = [
                        ("left", ctypes.c_long),
                        ("top", ctypes.c_long),
                        ("right", ctypes.c_long),
                        ("bottom", ctypes.c_long),
                    ]
                
                rect = RECT()
                ctypes.windll.user32.GetWindowRect(window_handle, ctypes.byref(rect))
                
                # 恢复窗口
                ctypes.windll.user32.ShowWindow(window_handle, 9)  # SW_RESTORE
                
                # 点击窗口标题栏区域
                center_x = (rect.left + rect.right) // 2
                title_y = rect.top + 15  # 标题栏位置
                
                pyautogui.click(center_x, title_y)
                
                logger.info(f"使用 pyautogui 点击窗口 ({center_x}, {title_y}) 成功")
                return True
            except Exception as e2:
                logger.warning(f"pyautogui 方法失败: {e2}")
            
            return False
            
        except Exception as e:
            logger.error(f"置顶窗口失败: {e}")
            return False
    
    def get_wechat_windows(self) -> List[Dict[str, Any]]:
        """
        获取所有微信窗口信息（支持多种版本）
        """
        windows = []
        found_classes = set()
        all_windows_info = []  # 用于调试
        
        try:
            desktop = Desktop(backend="uia")
            
            for win in desktop.windows():
                try:
                    class_name = win.class_name() or ''
                    title = win.window_text() or ''
                    
                    # 记录所有窗口用于调试
                    if class_name:
                        all_windows_info.append(f"{class_name}: {title[:30]}")
                    
                    # 检查是否是已知的微信窗口类
                    is_wechat_class = class_name in self.WECHAT_WINDOW_CLASSES
                    
                    # 检查类名是否包含微信相关关键字
                    is_wechat_keyword = any(kw in class_name for kw in self.WECHAT_CLASS_KEYWORDS)
                    
                    # 检查标题是否包含微信相关关键字
                    is_wechat_title = any(kw in title for kw in self.WECHAT_CLASS_KEYWORDS)
                    
                    if is_wechat_class or is_wechat_keyword or is_wechat_title:
                        found_classes.add(class_name)
                        # 只添加有标题的主窗口（排除登录窗口等）
                        if class_name not in [self.WECHAT_LOGIN_CLASS, "WeixinLoginWndForPC"] and title:
                            # 获取窗口位置信息用于区分
                            try:
                                rect = win.rectangle()
                                position = f"({rect.left}, {rect.top})"
                            except:
                                position = "未知位置"
                            
                            windows.append({
                                'title': title,
                                'handle': win.handle,
                                'class_name': class_name,
                                'account_name': title,
                                'position': position,
                            })
                except Exception:
                    continue
            
            logger.info(f"扫描到的微信窗口类: {found_classes}")
            logger.debug(f"所有窗口: {all_windows_info[:20]}")  # 只记录前20个
            
            # 尝试为每个窗口获取账号昵称
            for win in windows:
                try:
                    nickname = self.get_account_nickname(win['handle'])
                    if nickname:
                        win['account_name'] = nickname
                        logger.info(f"获取到昵称: {nickname}")
                except Exception as e:
                    logger.debug(f"获取昵称失败: {e}")
            
            # 为相同标题的窗口添加编号
            title_count = {}
            for win in windows:
                title = win['title']
                if title in title_count:
                    title_count[title] += 1
                else:
                    title_count[title] = 1
            
            # 生成显示名称
            title_index = {}
            for win in windows:
                title = win['title']
                account = win.get('account_name', '')
                
                # 如果获取到了昵称且与标题不同，使用昵称
                if account and account != title and account != '微信':
                    win['display_name'] = account
                elif title_count[title] > 1:
                    # 有重复标题，添加编号区分
                    if title not in title_index:
                        title_index[title] = 1
                    else:
                        title_index[title] += 1
                    win['display_name'] = f"{title} (窗口{title_index[title]} - {win['position']})"
                else:
                    win['display_name'] = title
            
        except Exception as e:
            logger.error(f"获取微信窗口失败: {e}")
        
        return windows
    
    def connect_to_wechat(self, handle: Optional[int] = None) -> bool:
        """
        连接到微信窗口
        
        Args:
            handle: 窗口句柄，如果不指定则连接第一个找到的微信窗口
        """
        try:
            if handle:
                self.app = Application(backend="uia").connect(handle=handle)
                self.main_window = self.app.window(handle=handle)
            else:
                # 查找可用的微信窗口
                windows = self.get_wechat_windows()
                if not windows:
                    logger.error("未找到微信窗口")
                    return False
                
                # 使用第一个找到的窗口
                first_window = windows[0]
                self.app = Application(backend="uia").connect(handle=first_window['handle'])
                self.main_window = self.app.window(handle=first_window['handle'])
                logger.info(f"连接到微信窗口: {first_window['title']} (类: {first_window['class_name']})")
            
            # 确保窗口存在
            if self.main_window.exists():
                logger.info("成功连接到微信窗口")
                return True
            else:
                logger.error("微信窗口不存在")
                return False
                
        except ElementNotFoundError:
            logger.error("未找到微信窗口，请确保微信已登录")
            return False
        except Exception as e:
            logger.error(f"连接微信窗口失败: {e}")
            return False
    
    def activate_window(self) -> bool:
        """
        激活（置顶）微信窗口
        """
        if not self.main_window:
            logger.error("未连接到微信窗口")
            return False
        
        try:
            self.main_window.set_focus()
            self.main_window.restore()  # 如果最小化则恢复
            time.sleep(0.3)
            return True
        except Exception as e:
            logger.error(f"激活窗口失败: {e}")
            return False
    
    def open_add_friend_dialog(self) -> bool:
        """
        打开添加好友对话框
        通过快捷键 Ctrl+F 搜索或点击添加按钮
        """
        if not self.activate_window():
            return False
        
        try:
            # 方式1: 尝试点击添加好友按钮
            # 微信左上角有个 "+" 按钮
            add_button = self.main_window.child_window(
                title="添加",
                control_type="Button"
            )
            
            if add_button.exists(timeout=2):
                add_button.click_input()
                time.sleep(0.5)
                
                # 点击"添加朋友"选项
                add_friend_item = self.main_window.child_window(
                    title="添加朋友",
                    control_type="Text"
                )
                if add_friend_item.exists(timeout=2):
                    add_friend_item.click_input()
                    time.sleep(0.5)
                    return True
            
            logger.warning("未找到添加好友按钮，尝试使用快捷键")
            return False
            
        except Exception as e:
            logger.error(f"打开添加好友对话框失败: {e}")
            return False
    
    def search_wechat_id(self, wechat_id: str) -> bool:
        """
        搜索微信号
        
        Args:
            wechat_id: 要搜索的微信号
        """
        try:
            if not self.activate_window():
                return False
            
            # 使用 Ctrl+F 打开搜索
            send_keys('^f')
            time.sleep(0.3)
            
            # 输入微信号
            send_keys(wechat_id, with_spaces=True, pause=0.05)
            time.sleep(0.5)
            
            # 按回车搜索
            send_keys('{ENTER}')
            time.sleep(1)
            
            return True
            
        except Exception as e:
            logger.error(f"搜索微信号失败: {e}")
            return False
    
    def fill_add_friend_message(self, message: str) -> bool:
        """
        填写添加好友验证消息
        首先找到"申请添加朋友"弹窗，然后在其中操作
        
        Args:
            message: 验证消息内容
        """
        try:
            import pyperclip
            from pywinauto import Desktop
            
            # 扫描所有窗口，找到"申请添加朋友"弹窗
            desktop = Desktop(backend="uia")
            add_friend_dialog = None
            
            for win in desktop.windows():
                try:
                    title = win.window_text() or ''
                    class_name = win.class_name() or ''
                    
                    # 查找"申请添加朋友"或类似标题的弹窗
                    if '申请添加朋友' in title or '添加朋友' in title or '申请添加' in title:
                        add_friend_dialog = win
                        logger.info(f"找到添加好友弹窗: {title} (class: {class_name})")
                        break
                except:
                    continue
            
            if not add_friend_dialog:
                logger.warning("未找到'申请添加朋友'弹窗，尝试在主窗口中操作")
                # 如果没找到弹窗，回退到在主窗口操作
                add_friend_dialog = self.main_window
            
            # 获取弹窗位置
            rect = add_friend_dialog.rectangle()
            logger.info(f"弹窗位置: left={rect.left}, top={rect.top}, right={rect.right}, bottom={rect.bottom}")
            
            # 激活弹窗
            try:
                add_friend_dialog.set_focus()
            except:
                pass
            time.sleep(0.3)
            
            # 计算验证消息输入框位置
            # "申请添加朋友"弹窗中，验证消息输入框在弹窗的上部
            dialog_width = rect.right - rect.left
            dialog_height = rect.bottom - rect.top
            
            # 验证消息输入框: 在弹窗宽度中间，高度约 1/6 处
            click_x = rect.left + dialog_width // 2
            click_y = rect.top + int(dialog_height * 0.18)  # 约 18% 位置
            
            logger.info(f"点击验证消息输入框: ({click_x}, {click_y})")
            pyautogui.click(click_x, click_y)
            time.sleep(0.3)
            
            # 全选并删除原有内容
            send_keys('^a')
            time.sleep(0.1)
            
            # 使用剪贴板粘贴新内容
            pyperclip.copy(message)
            send_keys('^v')
            time.sleep(0.3)
            
            logger.info("验证消息填写完成")
            return True
                
        except Exception as e:
            logger.error(f"填写验证消息失败: {e}")
            return False
    
    def set_friend_remark(self, remark: str) -> bool:
        """
        设置好友备注
        首先找到"申请添加朋友"弹窗，然后在其中操作
        
        Args:
            remark: 备注名称
        """
        try:
            import pyperclip
            from pywinauto import Desktop
            
            # 扫描所有窗口，找到"申请添加朋友"弹窗
            desktop = Desktop(backend="uia")
            add_friend_dialog = None
            
            for win in desktop.windows():
                try:
                    title = win.window_text() or ''
                    
                    # 查找"申请添加朋友"或类似标题的弹窗
                    if '申请添加朋友' in title or '添加朋友' in title or '申请添加' in title:
                        add_friend_dialog = win
                        logger.info(f"找到添加好友弹窗: {title}")
                        break
                except:
                    continue
            
            if not add_friend_dialog:
                logger.warning("未找到'申请添加朋友'弹窗，尝试在主窗口中操作")
                add_friend_dialog = self.main_window
            
            # 获取弹窗位置
            rect = add_friend_dialog.rectangle()
            logger.info(f"弹窗位置: left={rect.left}, top={rect.top}")
            
            # 激活弹窗
            try:
                add_friend_dialog.set_focus()
            except:
                pass
            time.sleep(0.3)
            
            # 计算备注输入框位置
            dialog_width = rect.right - rect.left
            dialog_height = rect.bottom - rect.top
            
            # 备注输入框: 在弹窗宽度中间，高度约 35% 处
            click_x = rect.left + dialog_width // 2
            click_y = rect.top + int(dialog_height * 0.35)
            
            logger.info(f"点击备注输入框: ({click_x}, {click_y})")
            pyautogui.click(click_x, click_y)
            time.sleep(0.3)
            
            # 全选并删除原有内容
            send_keys('^a')
            time.sleep(0.1)
            
            # 使用剪贴板粘贴新内容
            pyperclip.copy(remark)
            send_keys('^v')
            time.sleep(0.3)
            
            logger.info("备注设置完成")
            return True
                
        except Exception as e:
            logger.error(f"设置备注失败: {e}")
            return False
    
    def add_friend(
        self,
        wechat_id: str,
        message: str,
        remark: Optional[str] = None,
        auto_confirm: bool = False
    ) -> Dict[str, Any]:
        """
        添加好友完整流程
        
        Args:
            wechat_id: 目标微信号
            message: 验证消息
            remark: 备注名称
            auto_confirm: 是否自动点击发送（默认 False，留给用户手动确认）
        
        Returns:
            操作结果
        """
        result = {
            "success": False,
            "step": "",
            "message": ""
        }
        
        try:
            # 1. 连接微信
            if not self.connect_to_wechat():
                result["step"] = "connect"
                result["message"] = "无法连接到微信，请确保微信已登录"
                return result
            
            # 2. 激活窗口
            if not self.activate_window():
                result["step"] = "activate"
                result["message"] = "无法激活微信窗口"
                return result
            
            # 3. 搜索微信号
            result["step"] = "search"
            if not self.search_wechat_id(wechat_id):
                result["message"] = f"搜索微信号 {wechat_id} 失败"
                return result
            
            # 等待搜索结果加载
            time.sleep(1.5)
            
            # 4. 点击搜索结果（"网络查找微信号"区域）
            result["step"] = "click_result"
            clicked = False
            
            try:
                # 尝试多种方式点击搜索结果
                search_result = None
                
                # 方式1: 查找所有可能的控件类型
                control_types = ["ListItem", "Button", "Text", "Pane", "Custom"]
                for ctrl_type in control_types:
                    if clicked:
                        break
                    try:
                        # 查找包含 "网络查找" 的控件
                        search_result = self.main_window.child_window(
                            title_re=".*网络查找.*",
                            control_type=ctrl_type
                        )
                        if search_result.exists(timeout=0.5):
                            search_result.click_input()
                            logger.info(f"通过 {ctrl_type} 类型点击'网络查找'成功")
                            clicked = True
                            break
                    except:
                        pass
                    
                    try:
                        # 查找包含微信号的控件
                        search_result = self.main_window.child_window(
                            title_re=f".*{wechat_id}.*",
                            control_type=ctrl_type
                        )
                        if search_result.exists(timeout=0.5):
                            search_result.click_input()
                            logger.info(f"通过 {ctrl_type} 类型点击微信号成功")
                            clicked = True
                            break
                    except:
                        pass
                
                # 方式2: 使用 pyautogui 在搜索框下方点击
                if not clicked:
                    logger.info("尝试使用 pyautogui 点击搜索结果区域")
                    try:
                        # 获取微信窗口位置
                        rect = self.main_window.rectangle()
                        logger.info(f"窗口位置: left={rect.left}, top={rect.top}, right={rect.right}, bottom={rect.bottom}")
                        
                        # 先将焦点移到窗口
                        self.main_window.set_focus()
                        time.sleep(0.3)
                        
                        # 尝试多个点击位置（搜索结果区域）
                        # 位置1: 搜索框正下方第一个结果（绿色区域）
                        click_positions = [
                            (rect.left + 150, rect.top + 130),  # 更靠左上
                            (rect.left + 150, rect.top + 150),  # 稍微下移
                            (rect.left + 200, rect.top + 120),  # 另一个尝试
                            (rect.left + 180, rect.top + 140),  # 中间位置
                        ]
                        
                        for i, (click_x, click_y) in enumerate(click_positions):
                            logger.info(f"尝试位置 {i+1}: ({click_x}, {click_y})")
                            pyautogui.click(click_x, click_y)
                            time.sleep(0.5)
                            
                            # 检查是否打开了新界面（通过查找添加好友相关按钮）
                            try:
                                add_btn = self.main_window.child_window(
                                    title_re=".*添加.*",
                                    control_type="Button"
                                )
                                if add_btn.exists(timeout=0.5):
                                    logger.info(f"位置 {i+1} 点击成功，找到添加按钮")
                                    clicked = True
                                    break
                            except:
                                pass
                        
                        if not clicked:
                            clicked = True  # 即使没确认也继续
                            
                    except Exception as e:
                        logger.warning(f"pyautogui 点击失败: {e}")
                
                # 方式3: 使用键盘导航
                if not clicked:
                    logger.info("尝试使用键盘导航")
                    # 按向下键选择搜索结果，然后回车
                    send_keys('{DOWN}')
                    time.sleep(0.3)
                    send_keys('{ENTER}')
                    clicked = True
                
                if clicked:
                    time.sleep(1.5)  # 等待界面切换
                    
            except Exception as e:
                logger.warning(f"点击搜索结果失败: {e}")
                # 即使失败也继续
            
            # 5. 点击 "添加到通讯录" 按钮（如果存在）
            result["step"] = "click_add"
            try:
                add_contact_btn = self.main_window.child_window(
                    title_re=".*添加.*通讯录.*|.*添加.*好友.*",
                    control_type="Button"
                )
                if add_contact_btn.exists(timeout=2):
                    add_contact_btn.click_input()
                    logger.info("点击添加到通讯录按钮成功")
                    time.sleep(1)
            except Exception as e:
                logger.warning(f"点击添加按钮失败: {e}")
            
            # 6. 填写验证消息
            result["step"] = "message"
            if message and not self.fill_add_friend_message(message):
                logger.warning("填写验证消息失败，但继续流程")
            
            # 7. 设置备注
            if remark:
                result["step"] = "remark"
                if not self.set_friend_remark(remark):
                    logger.warning("设置备注失败，但继续流程")
            
            # 8. 如果不自动确认，到这里就结束（等待用户手动点击发送）
            if not auto_confirm:
                result["success"] = True
                result["step"] = "ready"
                result["message"] = "已准备好，请手动点击发送按钮"
                return result
            
            # 7. 如果自动确认，点击发送按钮
            result["step"] = "send"
            send_button = self.main_window.child_window(
                title="发送",
                control_type="Button"
            )
            
            if send_button.exists(timeout=2):
                send_button.click_input()
                time.sleep(0.5)
                result["success"] = True
                result["message"] = "添加请求已发送"
            else:
                result["message"] = "未找到发送按钮"
            
            return result
            
        except Exception as e:
            result["message"] = str(e)
            logger.error(f"添加好友失败: {e}")
            return result


# 单例实例
_automation_instance: Optional[WeChatAutomation] = None


def get_automation() -> WeChatAutomation:
    """获取自动化实例"""
    global _automation_instance
    if _automation_instance is None:
        _automation_instance = WeChatAutomation()
    return _automation_instance


if __name__ == "__main__":
    # 测试代码
    automation = WeChatAutomation()
    
    print("查找微信进程...")
    processes = automation.find_wechat_processes()
    print(f"找到 {len(processes)} 个微信进程")
    
    print("\n查找微信窗口...")
    windows = automation.get_wechat_windows()
    for win in windows:
        print(f"  - {win['title']} (handle: {win['handle']})")
    
    if windows:
        print("\n连接到第一个微信窗口...")
        if automation.connect_to_wechat():
            print("连接成功！")
            automation.activate_window()
