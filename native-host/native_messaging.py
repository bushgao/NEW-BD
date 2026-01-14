#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Chrome Native Messaging 通信模块

处理与 Chrome 插件之间的 stdin/stdout 通信
"""

import sys
import struct
import json
import threading
import logging
from typing import Dict, Any, Optional, Callable

# 配置日志
logging.basicConfig(
    filename='wechat_bridge.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def read_message() -> Optional[Dict[str, Any]]:
    """
    从 stdin 读取 Chrome Native Messaging 格式的消息
    格式: 4字节长度（小端序） + JSON 数据
    """
    try:
        # 读取消息长度（4字节，小端序）
        raw_length = sys.stdin.buffer.read(4)
        if not raw_length:
            logger.info("No more input, exiting")
            return None
        
        message_length = struct.unpack('<I', raw_length)[0]
        logger.debug(f"Reading message of length: {message_length}")
        
        # 读取消息内容
        message_data = sys.stdin.buffer.read(message_length)
        message = json.loads(message_data.decode('utf-8'))
        
        logger.debug(f"Received message: {message}")
        return message
        
    except Exception as e:
        logger.error(f"Error reading message: {e}")
        return None


def send_message(message: Dict[str, Any]) -> None:
    """
    向 stdout 发送 Chrome Native Messaging 格式的消息
    """
    try:
        message_json = json.dumps(message, ensure_ascii=False)
        message_bytes = message_json.encode('utf-8')
        
        # 写入消息长度（4字节，小端序）
        sys.stdout.buffer.write(struct.pack('<I', len(message_bytes)))
        # 写入消息内容
        sys.stdout.buffer.write(message_bytes)
        sys.stdout.buffer.flush()
        
        logger.debug(f"Sent message: {message}")
        
    except Exception as e:
        logger.error(f"Error sending message: {e}")


def send_success(data: Any = None, message: str = "操作成功") -> None:
    """发送成功响应"""
    response = {
        "success": True,
        "message": message,
        "data": data
    }
    send_message(response)


def send_error(message: str, code: str = "ERROR") -> None:
    """发送错误响应"""
    response = {
        "success": False,
        "error": {
            "code": code,
            "message": message
        }
    }
    send_message(response)


class NativeMessagingHost:
    """
    Native Messaging Host 主类
    """
    
    def __init__(self):
        self.handlers: Dict[str, Callable] = {}
        self.running = False
    
    def register_handler(self, action: str, handler: Callable) -> None:
        """注册消息处理函数"""
        self.handlers[action] = handler
        logger.info(f"Registered handler for action: {action}")
    
    def handle_message(self, message: Dict[str, Any]) -> None:
        """处理收到的消息"""
        action = message.get('action')
        
        if not action:
            send_error("缺少 action 参数", "MISSING_ACTION")
            return
        
        handler = self.handlers.get(action)
        if not handler:
            send_error(f"未知的 action: {action}", "UNKNOWN_ACTION")
            return
        
        try:
            # 调用处理函数
            result = handler(message)
            if result is not None:
                send_success(result)
        except Exception as e:
            logger.error(f"Handler error for action '{action}': {e}")
            send_error(str(e), "HANDLER_ERROR")
    
    def run(self) -> None:
        """启动消息循环"""
        self.running = True
        logger.info("Native Messaging Host started")
        
        while self.running:
            message = read_message()
            if message is None:
                break
            
            # 在线程中处理消息，避免阻塞
            thread = threading.Thread(target=self.handle_message, args=(message,))
            thread.start()
        
        logger.info("Native Messaging Host stopped")
    
    def stop(self) -> None:
        """停止消息循环"""
        self.running = False


if __name__ == "__main__":
    # 测试模式
    host = NativeMessagingHost()
    
    def ping_handler(msg):
        return {"status": "ok", "version": "1.0.0"}
    
    host.register_handler("ping", ping_handler)
    host.run()
