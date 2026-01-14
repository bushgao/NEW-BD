"""
测试 WeChatPYAPI HTTP 接口
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8989"

def test_api():
    print("=" * 60)
    print("测试 WeChatPYAPI HTTP 接口")
    print("=" * 60)
    print(f"API 地址: {BASE_URL}")
    
    # 测试 1: 获取登录信息
    print("\n[测试 1] 获取登录信息...")
    try:
        resp = requests.get(f"{BASE_URL}/api/getLoginInfo", timeout=5)
        print(f"  状态码: {resp.status_code}")
        print(f"  响应: {resp.text[:500]}")
    except Exception as e:
        print(f"  错误: {e}")
    
    # 测试 2: 获取个人信息
    print("\n[测试 2] 获取个人信息...")
    try:
        resp = requests.get(f"{BASE_URL}/api/getSelfInfo", timeout=5)
        print(f"  状态码: {resp.status_code}")
        data = resp.json() if resp.status_code == 200 else {}
        print(f"  响应: {json.dumps(data, ensure_ascii=False, indent=2)[:500]}")
    except Exception as e:
        print(f"  错误: {e}")
    
    # 测试 3: 获取联系人列表
    print("\n[测试 3] 获取联系人列表...")
    try:
        resp = requests.get(f"{BASE_URL}/api/getContactList", timeout=10)
        print(f"  状态码: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list):
                print(f"  联系人数量: {len(data)}")
            else:
                print(f"  响应: {str(data)[:300]}")
    except Exception as e:
        print(f"  错误: {e}")
    
    print("\n" + "=" * 60)
    print("测试完成！")
    print("=" * 60)

if __name__ == "__main__":
    test_api()
