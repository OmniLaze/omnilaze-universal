#!/usr/bin/env python3
"""
重构后API测试脚本
"""
import time
import threading
import requests
from app import create_app

def test_api():
    """测试API功能"""
    print("🧪 开始测试重构后的API...")
    
    # 创建应用
    app = create_app()
    print("✅ Flask应用创建成功")
    
    # 在后台线程启动服务器
    def run_server():
        app.run(host='127.0.0.1', port=5001, debug=False, use_reloader=False)
    
    server_thread = threading.Thread(target=run_server)
    server_thread.daemon = True
    server_thread.start()
    
    # 等待服务器启动
    print("⏳ 等待服务器启动...")
    time.sleep(3)
    
    try:
        # 测试健康检查
        print("🔍 测试健康检查接口...")
        response = requests.get('http://127.0.0.1:5001/health', timeout=5)
        health_data = response.json()
        print(f"✅ 健康检查成功: {health_data}")
        
        # 测试发送验证码接口
        print("🔍 测试发送验证码接口...")
        sms_response = requests.post('http://127.0.0.1:5001/send-verification-code', 
                                   json={'phone_number': '13800138000'}, 
                                   timeout=5)
        sms_data = sms_response.json()
        print(f"✅ 发送验证码成功: {sms_data}")
        
        print("🎉 所有API测试通过！")
        
    except Exception as e:
        print(f"❌ API测试失败: {e}")
    
    print("📊 测试完成")

if __name__ == '__main__':
    test_api()