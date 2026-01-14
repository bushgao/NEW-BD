"""
测试 WeChatPYAPI HTTP 接口 - 尝试多个路径
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8989"

def test_api():
    print("=" * 60)
    print("测试 WeChatPYAPI HTTP 接口 - 探索 API")
    print("=" * 60)
    
    # 尝试不同的 API 路径格式
    paths_to_try = [
        "/",
        "/api",
        "/api/",
        "/getSelfInfo",
        "/get_self_info",
        "/GetSelfInfo",
        "/self_info",
        "/info",
        "/getContactList",
        "/get_contact_list",
        "/contacts",
        "/sendText",
        "/send_text",
        "/help",
        "/docs",
        "/status",
    ]
    
    for path in paths_to_try:
        try:
            url = f"{BASE_URL}{path}"
            resp = requests.get(url, timeout=3)
            if resp.status_code != 404:
                print(f"\n✓ {path}")
                print(f"  状态码: {resp.status_code}")
                text = resp.text[:200] if len(resp.text) > 200 else resp.text
                print(f"  响应: {text}")
        except Exception as e:
            pass
    
    # 尝试 POST 请求
    print("\n尝试 POST 请求...")
    post_paths = [
        "/getSelfInfo",
        "/get_self_info",
        "/sendText",
        "/query",
    ]
    for path in post_paths:
        try:
            url = f"{BASE_URL}{path}"
            resp = requests.post(url, json={}, timeout=3)
            if resp.status_code != 404:
                print(f"\n✓ POST {path}")
                print(f"  状态码: {resp.status_code}")
                print(f"  响应: {resp.text[:200]}")
        except Exception as e:
            pass
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    test_api()
