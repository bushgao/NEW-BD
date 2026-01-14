"""
测试 WeChatPYAPI 能否在当前环境运行
"""
import sys
import os

# 添加专业版路径
api_path = r'f:\NEW BD\native-host\WeChatPYAPI-main\专业版\Python接口'
sys.path.insert(0, api_path)

print("=" * 60)
print("测试 WeChatPYAPI")
print("=" * 60)
print(f"Python 版本: {sys.version}")
print(f"API 路径: {api_path}")

try:
    print("\n尝试导入 WeChatPYAPI...")
    from WeChatPYAPI import WeChatPYApi
    print("✓ 导入成功！")
    
    print("\n查看帮助信息...")
    help(WeChatPYApi)
    
except ImportError as e:
    print(f"✗ 导入失败: {e}")
except Exception as e:
    print(f"✗ 错误: {e}")
