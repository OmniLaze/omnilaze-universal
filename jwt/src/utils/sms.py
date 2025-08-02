"""
短信发送工具函数
"""
import requests
from ..config import config

def send_sms(phone_number: str, code: str) -> dict:
    """发送短信验证码
    
    Args:
        phone_number: 手机号
        code: 验证码
    
    Returns:
        dict: 发送结果
    """
    if config.is_development_mode:
        # 开发模式：不发送真实短信，在控制台显示验证码
        print(f"🔧 开发模式 - 固定验证码: {phone_number} -> {code} (开发测试请使用: {config.DEV_VERIFICATION_CODE})")
        return {
            "success": True, 
            "message": f"验证码发送成功（开发模式，请使用验证码: {config.DEV_VERIFICATION_CODE}）", 
            "dev_code": code
        }
    else:
        # 生产模式：真实发送短信
        if not config.SPUG_URL:
            return {"success": False, "message": "短信服务未配置"}
        
        try:
            body = {
                'name': '验证码', 
                'code': code, 
                'targets': phone_number
            }
            response = requests.post(config.SPUG_URL, json=body)
            
            if response.status_code == 200:
                return {"success": True, "message": "验证码发送成功"}
            else:
                return {"success": False, "message": "验证码发送失败"}
        except Exception as e:
            return {"success": False, "message": f"短信发送异常: {str(e)}"}