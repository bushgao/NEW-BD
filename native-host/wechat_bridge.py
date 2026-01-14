#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微信添加好友桥接程序

Chrome Extension Native Messaging Host
用于在 Chrome 插件和微信 PC 端之间进行通信
"""

import sys
import os
import logging
from typing import Dict, Any

# 添加当前目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from native_messaging import NativeMessagingHost, send_success, send_error
from wechat_automation import WeChatAutomation, get_automation, AUTOMATION_AVAILABLE

# 尝试导入 wxauto 桥接模块
WXAUTO_AVAILABLE = False
try:
    from wxauto_bridge import (
        get_wechat_instance,
        get_all_wechat_clients,
        add_friend_wxauto,
        check_wxauto_available
    )
    WXAUTO_AVAILABLE = True
except ImportError as e:
    pass  # wxauto 不可用时使用旧的 pywinauto 方式

# 配置日志
log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'wechat_bridge.log')
logging.basicConfig(
    filename=log_file,
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============================================
# 消息处理函数
# ============================================

def handle_ping(message: Dict[str, Any]) -> Dict[str, Any]:
    """
    心跳检测
    """
    return {
        "status": "ok",
        "version": "1.0.0",
        "automation_available": AUTOMATION_AVAILABLE or WXAUTO_AVAILABLE,
        "wxauto_available": WXAUTO_AVAILABLE,
        "pywinauto_available": AUTOMATION_AVAILABLE
    }


def handle_get_wechat_windows(message: Dict[str, Any]) -> Dict[str, Any]:
    """
    获取所有微信窗口
    优先使用 wxauto，如果不可用则使用 pywinauto
    """
    # 优先使用 wxauto
    if WXAUTO_AVAILABLE:
        try:
            clients = get_all_wechat_clients()
            return {
                "windows": clients,
                "count": len(clients),
                "method": "wxauto"
            }
        except Exception as e:
            logger.warning(f"wxauto 获取微信窗口失败: {e}，尝试使用 pywinauto")
    
    # 回退到 pywinauto
    if not AUTOMATION_AVAILABLE:
        raise Exception("自动化模块未安装，请先安装 Python 依赖")
    
    automation = get_automation()
    windows = automation.get_wechat_windows()
    
    return {
        "windows": windows,
        "count": len(windows)
    }


def handle_get_wechat_processes(message: Dict[str, Any]) -> Dict[str, Any]:
    """
    获取所有微信进程
    """
    if not AUTOMATION_AVAILABLE:
        raise Exception("自动化模块未安装，请先安装 Python 依赖")
    
    automation = get_automation()
    processes = automation.find_wechat_processes()
    
    return {
        "processes": processes,
        "count": len(processes)
    }


def handle_add_friend(message: Dict[str, Any]) -> Dict[str, Any]:
    """
    添加微信好友
    优先使用 wxauto（更稳定），回退到 pywinauto
    
    消息格式:
    {
        "action": "add_friend",
        "wechat_id": "目标微信号",
        "nickname": "达人昵称",
        "platform": "平台名称",
        "message": "验证消息",
        "hwnd": 窗口句柄(可选)
    }
    """
    wechat_id = message.get('wechat_id')
    nickname = message.get('nickname', '')
    platform = message.get('platform', '')
    verify_message = message.get('message', '')
    hwnd = message.get('hwnd')
    
    if not wechat_id:
        raise Exception("缺少 wechat_id 参数")
    
    # 生成备注格式：昵称-平台
    remark = f"{nickname}-{platform}" if nickname else None
    
    # 优先使用 wxauto（更稳定的 API）
    if WXAUTO_AVAILABLE:
        logger.info("使用 wxauto 添加好友")
        try:
            result = add_friend_wxauto(
                wechat_id=wechat_id,
                message=verify_message,
                remark=remark,
                hwnd=hwnd
            )
            result['method'] = 'wxauto'
            return result
        except Exception as e:
            logger.warning(f"wxauto 添加好友失败: {e}，尝试使用 pywinauto")
    
    # 回退到 pywinauto
    if not AUTOMATION_AVAILABLE:
        raise Exception("自动化模块未安装，请先安装 Python 依赖")
    
    logger.info("使用 pywinauto 添加好友")
    automation = get_automation()
    result = automation.add_friend(
        wechat_id=wechat_id,
        message=verify_message,
        remark=remark,
        auto_confirm=False
    )
    result['method'] = 'pywinauto'
    
    return result


def handle_search_wechat(message: Dict[str, Any]) -> Dict[str, Any]:
    """
    步骤1: 搜索微信号（用户需要手动点击搜索结果）
    
    消息格式:
    {
        "action": "search_wechat",
        "wechat_id": "目标微信号",
        "window_handle": 可选的窗口句柄
    }
    """
    if not AUTOMATION_AVAILABLE:
        raise Exception("自动化模块未安装，请先安装 Python 依赖")
    
    wechat_id = message.get('wechat_id')
    window_handle = message.get('window_handle')
    
    if not wechat_id:
        raise Exception("缺少 wechat_id 参数")
    
    automation = get_automation()
    
    # 连接到微信
    if window_handle:
        if not automation.connect_to_wechat(handle=window_handle):
            return {"success": False, "message": "无法连接到指定的微信窗口"}
    else:
        if not automation.connect_to_wechat():
            return {"success": False, "message": "无法连接到微信，请确保微信已登录"}
    
    # 激活窗口
    if not automation.activate_window():
        return {"success": False, "message": "无法激活微信窗口"}
    
    # 搜索微信号
    if not automation.search_wechat_id(wechat_id):
        return {"success": False, "message": f"搜索微信号 {wechat_id} 失败"}
    
    return {
        "success": True,
        "message": f"已在微信中搜索 {wechat_id}，请手动点击绿色的「网络查找微信号」区域"
    }


def handle_fill_friend_info(message: Dict[str, Any]) -> Dict[str, Any]:
    """
    步骤2: 填写验证消息和备注（用户需要已经进入添加好友界面）
    
    消息格式:
    {
        "action": "fill_friend_info",
        "message": "验证消息",
        "remark": "备注",
        "window_handle": 可选的窗口句柄
    }
    """
    if not AUTOMATION_AVAILABLE:
        raise Exception("自动化模块未安装，请先安装 Python 依赖")
    
    verify_message = message.get('message', '')
    remark = message.get('remark', '')
    window_handle = message.get('window_handle')
    
    automation = get_automation()
    
    # 连接到微信
    if window_handle:
        if not automation.connect_to_wechat(handle=window_handle):
            return {"success": False, "message": "无法连接到指定的微信窗口"}
    else:
        if not automation.connect_to_wechat():
            return {"success": False, "message": "无法连接到微信"}
    
    # 激活窗口
    automation.activate_window()
    
    results = []
    
    # 填写验证消息
    if verify_message:
        if automation.fill_add_friend_message(verify_message):
            results.append("验证消息已填写")
        else:
            results.append("验证消息填写失败（可能界面不对）")
    
    # 设置备注
    if remark:
        if automation.set_friend_remark(remark):
            results.append("备注已设置")
        else:
            results.append("备注设置失败（可能界面不对）")
    
    return {
        "success": True,
        "message": "、".join(results) if results else "请手动填写信息，然后点击发送按钮"
    }


def handle_check_wechat_status(message: Dict[str, Any]) -> Dict[str, Any]:
    """
    检查微信连接状态
    """
    if not AUTOMATION_AVAILABLE:
        return {
            "installed": False,
            "running": False,
            "logged_in": False,
            "window_count": 0,
            "message": "自动化模块未安装"
        }
    
    automation = get_automation()
    
    # 检测微信进程
    processes = automation.find_wechat_processes()
    logger.info(f"找到微信进程: {processes}")
    
    # 检测微信窗口
    windows = automation.get_wechat_windows()
    logger.info(f"找到微信窗口: {windows}")
    
    if not processes:
        return {
            "installed": True,  # 假设已安装
            "running": False,
            "logged_in": False,
            "window_count": 0,
            "processes": [],
            "windows": [],
            "message": "微信未运行，请先打开微信"
        }
    
    if not windows:
        return {
            "installed": True,
            "running": True,
            "logged_in": False,
            "window_count": 0,
            "processes": processes,
            "windows": [],
            "message": f"检测到 {len(processes)} 个微信进程，但未找到主窗口。请确保微信已登录并显示主界面。"
        }
    
    return {
        "installed": True,
        "running": True,
        "logged_in": True,
        "window_count": len(windows),
        "processes": processes,
        "windows": windows,
        "message": f"找到 {len(windows)} 个微信窗口"
    }


def handle_highlight_window(message: Dict[str, Any]) -> Dict[str, Any]:
    """
    高亮/置顶指定的微信窗口，帮助用户识别
    """
    if not AUTOMATION_AVAILABLE:
        return {"success": False, "message": "自动化模块未安装"}
    
    window_handle = message.get('window_handle')
    if not window_handle:
        return {"success": False, "message": "未指定窗口句柄"}
    
    automation = get_automation()
    
    # 将窗口置顶
    success = automation.bring_window_to_front(window_handle)
    
    # 闪烁窗口
    automation.flash_window(window_handle)
    
    return {
        "success": success,
        "message": "已高亮显示窗口" if success else "高亮窗口失败"
    }


# ============================================
# 主程序入口
# ============================================

def main():
    """
    主入口函数
    """
    logger.info("=" * 50)
    logger.info("微信桥接程序启动")
    logger.info(f"Python 版本: {sys.version}")
    logger.info(f"自动化模块可用: {AUTOMATION_AVAILABLE}")
    logger.info("=" * 50)
    
    # 创建 Native Messaging Host
    host = NativeMessagingHost()
    
    # 注册消息处理函数
    host.register_handler("ping", handle_ping)
    host.register_handler("get_wechat_windows", handle_get_wechat_windows)
    host.register_handler("get_wechat_processes", handle_get_wechat_processes)
    host.register_handler("add_friend", handle_add_friend)
    host.register_handler("check_wechat_status", handle_check_wechat_status)
    host.register_handler("highlight_window", handle_highlight_window)
    # 分步 API
    host.register_handler("search_wechat", handle_search_wechat)
    host.register_handler("fill_friend_info", handle_fill_friend_info)
    
    # 启动消息循环
    try:
        host.run()
    except Exception as e:
        logger.error(f"程序异常退出: {e}")
        sys.exit(1)
    
    logger.info("微信桥接程序正常退出")


if __name__ == "__main__":
    main()
