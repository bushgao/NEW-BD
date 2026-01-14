"""
微信自动化模块 - 基于 wxauto 库（Apache-2.0 许可证）
用于实现一键添加微信好友功能
wxauto 项目地址: https://github.com/cluic/wxauto
"""
import sys
import os
import logging
import time
from typing import Optional, List, Dict, Any

# 配置日志
logger = logging.getLogger(__name__)

# 添加 wxauto 到模块路径
WXAUTO_PATH = os.path.join(os.path.dirname(__file__), 'wxauto-main')
if WXAUTO_PATH not in sys.path:
    sys.path.insert(0, WXAUTO_PATH)

# 缓存微信实例
_wx_instance = None
_wx_cache = {}  # 缓存多个微信实例

def get_wechat_instance(nickname: str = None, hwnd: int = None) -> Optional[Any]:
    """
    获取微信实例（使用缓存避免重复连接）
    
    Args:
        nickname: 微信昵称（可选）
        hwnd: 窗口句柄（可选）
    
    Returns:
        WeChat 实例或 None
    """
    global _wx_instance, _wx_cache
    
    try:
        from wxauto import WeChat, get_wx_clients
        
        # 如果指定了句柄，尝试使用缓存
        cache_key = hwnd or nickname or 'default'
        if cache_key in _wx_cache:
            wx = _wx_cache[cache_key]
            # 验证实例是否仍然有效
            try:
                if wx._api.exists():
                    logger.info(f"使用缓存的微信实例: {cache_key}")
                    return wx
            except:
                del _wx_cache[cache_key]
        
        # 创建新实例
        if hwnd:
            wx = WeChat(hwnd=hwnd)
            logger.info(f"通过句柄 {hwnd} 连接微信")
        elif nickname:
            wx = WeChat(nickname=nickname)
            logger.info(f"通过昵称 {nickname} 连接微信")
        else:
            wx = WeChat()
            logger.info("连接默认微信实例")
        
        _wx_cache[cache_key] = wx
        return wx
        
    except Exception as e:
        logger.error(f"获取微信实例失败: {e}")
        return None


def get_all_wechat_clients() -> List[Dict[str, Any]]:
    """
    获取所有已登录的微信客户端
    
    Returns:
        微信客户端列表 [{nickname, hwnd, display_name}, ...]
    """
    try:
        from wxauto import get_wx_clients
        
        clients = get_wx_clients()
        result = []
        
        for i, wx in enumerate(clients):
            try:
                info = {
                    'nickname': wx.nickname,
                    'hwnd': wx._api.hwnd,
                    'display_name': f"{wx.nickname}" if wx.nickname else f"微信 #{i+1}",
                    'title': wx.nickname or f"微信 #{i+1}",
                    'handle': wx._api.hwnd,
                }
                result.append(info)
                logger.info(f"找到微信: {info['display_name']} (hwnd: {info['hwnd']})")
            except Exception as e:
                logger.warning(f"获取微信 #{i+1} 信息失败: {e}")
        
        logger.info(f"共找到 {len(result)} 个微信客户端")
        return result
        
    except Exception as e:
        logger.error(f"获取微信客户端列表失败: {e}")
        return []


def add_friend_wxauto(
    wechat_id: str,
    message: str = None,
    remark: str = None,
    tags: List[str] = None,
    hwnd: int = None,
    timeout: int = 10
) -> Dict[str, Any]:
    """
    使用 wxauto 添加微信好友
    
    Args:
        wechat_id: 微信号、手机号或 QQ 号
        message: 验证消息
        remark: 好友备注
        tags: 标签列表
        hwnd: 指定微信窗口句柄
        timeout: 超时时间（秒）
    
    Returns:
        {'success': bool, 'message': str}
    """
    try:
        wx = get_wechat_instance(hwnd=hwnd)
        if not wx:
            return {
                'success': False,
                'message': '无法连接到微信客户端'
            }
        
        logger.info(f"开始添加好友: {wechat_id}")
        logger.info(f"验证消息: {message}")
        logger.info(f"备注: {remark}")
        
        # 调用 wxauto 的 AddNewFriend 方法
        result = wx.AddNewFriend(
            keywords=wechat_id,
            addmsg=message,
            remark=remark,
            tags=tags,
            permission='朋友圈',
            timeout=timeout
        )
        
        # 检查结果
        if result.success:
            logger.info(f"添加好友成功: {wechat_id}")
            return {
                'success': True,
                'message': '好友请求已发送'
            }
        else:
            logger.warning(f"添加好友失败: {result.message}")
            return {
                'success': False,
                'message': result.message or '添加好友失败'
            }
            
    except Exception as e:
        logger.error(f"添加好友异常: {e}")
        return {
            'success': False,
            'message': str(e)
        }


def search_wechat_id_wxauto(
    wechat_id: str,
    hwnd: int = None
) -> Dict[str, Any]:
    """
    搜索微信号（不发送好友请求）
    
    Args:
        wechat_id: 微信号、手机号或 QQ 号
        hwnd: 指定微信窗口句柄
    
    Returns:
        {'success': bool, 'message': str}
    """
    try:
        wx = get_wechat_instance(hwnd=hwnd)
        if not wx:
            return {
                'success': False,
                'message': '无法连接到微信客户端'
            }
        
        # 使用 ChatWith 打开搜索
        # 注意：这会尝试搜索联系人
        wx._api.switch_chat(wechat_id, exact=False, force=True, force_wait=1)
        
        return {
            'success': True,
            'message': f'已搜索 {wechat_id}'
        }
            
    except Exception as e:
        logger.error(f"搜索微信号异常: {e}")
        return {
            'success': False,
            'message': str(e)
        }


def check_wxauto_available() -> Dict[str, Any]:
    """
    检查 wxauto 库是否可用
    
    Returns:
        {'available': bool, 'message': str, 'version': str}
    """
    try:
        from wxauto import WeChat
        
        # 尝试获取微信客户端
        clients = get_all_wechat_clients()
        
        return {
            'available': True,
            'message': f'wxauto 可用，检测到 {len(clients)} 个微信客户端',
            'version': 'wxauto-main',
            'clients': clients
        }
        
    except ImportError as e:
        return {
            'available': False,
            'message': f'wxauto 库未安装或导入失败: {e}',
            'version': None,
            'clients': []
        }
    except Exception as e:
        return {
            'available': False,
            'message': f'检查 wxauto 时出错: {e}',
            'version': None,
            'clients': []
        }


if __name__ == '__main__':
    # 测试
    logging.basicConfig(level=logging.DEBUG)
    
    print("检查 wxauto 可用性...")
    result = check_wxauto_available()
    print(f"结果: {result}")
    
    if result['available']:
        print("\n获取微信客户端列表...")
        clients = get_all_wechat_clients()
        for client in clients:
            print(f"  - {client}")
