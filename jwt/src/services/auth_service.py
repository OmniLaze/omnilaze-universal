"""
认证服务模块
处理用户认证相关的业务逻辑
"""
from typing import Dict, Any
from ..storage import storage
from ..utils import (
    generate_verification_code, get_code_expiry_time, is_code_expired,
    validate_phone_number, validate_verification_code, validate_required_fields,
    send_sms
)

class AuthService:
    """认证服务类"""
    
    def __init__(self):
        self.storage = storage
    
    def send_verification_code(self, phone_number: str) -> Dict[str, Any]:
        """发送验证码"""
        # 验证手机号格式
        if not validate_phone_number(phone_number):
            return {"success": False, "message": "请输入正确的11位手机号码"}
        
        # 生成验证码
        code = generate_verification_code()
        expires_at = get_code_expiry_time()
        
        # 存储验证码
        store_result = self.storage.store_verification_code(phone_number, code, expires_at)
        if not store_result.get("success"):
            return {"success": False, "message": "验证码存储失败"}
        
        # 发送短信
        sms_result = send_sms(phone_number, code)
        
        print(f"📱 验证码发送请求: {phone_number} -> {code}")
        if sms_result["success"]:
            print(f"✅ 验证码发送成功: {phone_number}")
        else:
            print(f"❌ 验证码发送失败: {sms_result['message']}")
        
        return sms_result
    
    def verify_code(self, phone_number: str, input_code: str) -> Dict[str, Any]:
        """验证验证码"""
        # 获取存储的验证码
        code_record = self.storage.get_verification_code(phone_number)
        
        if not code_record:
            return {"success": False, "message": "验证码不存在或已使用"}
        
        if code_record.get('used'):
            return {"success": False, "message": "验证码不存在或已使用"}
        
        # 检查是否过期
        if is_code_expired(code_record['expires_at']):
            return {"success": False, "message": "验证码已过期"}
        
        # 验证验证码
        if code_record['code'] != input_code:
            return {"success": False, "message": "验证码错误"}
        
        # 标记为已使用
        self.storage.mark_verification_code_used(phone_number)
        return {"success": True, "message": "验证码验证成功"}
    
    def login_with_phone(self, phone_number: str, verification_code: str) -> Dict[str, Any]:
        """手机号登录"""
        print(f"🔐 开始登录验证: {phone_number}")
        
        # 验证输入格式
        is_valid, error_msg = validate_required_fields(
            手机号=phone_number, 
            验证码=verification_code
        )
        if not is_valid:
            return {"success": False, "message": error_msg}
        
        if not validate_phone_number(phone_number):
            return {"success": False, "message": "请输入正确的11位手机号码"}
        
        if not validate_verification_code(verification_code):
            return {"success": False, "message": "请输入6位数字验证码"}
        
        # 验证验证码
        verify_result = self.verify_code(phone_number, verification_code)
        if not verify_result["success"]:
            print(f"❌ 验证码验证失败: {verify_result['message']}")
            return verify_result
        
        print(f"✅ 验证码验证成功: {phone_number}")
        
        # 检查用户是否存在
        user_data = self.storage.get_user(phone_number)
        is_new_user = user_data is None
        
        if is_new_user:
            # 新用户，等待邀请码验证
            user_id = None
            user_sequence = None
            print(f"🆕 检测到新用户: {phone_number}")
        else:
            user_id = user_data['id']
            user_sequence = user_data.get('user_sequence', 0)
            print(f"👤 老用户登录: {phone_number} (ID: {user_id}, 序号: {user_sequence})")
        
        result = {
            "success": True,
            "message": "验证成功" if not is_new_user else "新用户验证成功，请输入邀请码",
            "user_id": user_id,
            "phone_number": phone_number,
            "is_new_user": is_new_user
        }
        
        # 添加用户序号（如果是老用户）
        if not is_new_user and user_sequence:
            result["user_sequence"] = user_sequence
        
        print(f"📤 返回结果: {result}")
        return result
    
    def verify_invite_code_and_create_user(self, phone_number: str, invite_code: str) -> Dict[str, Any]:
        """验证邀请码并创建新用户"""
        print(f"🔑 验证邀请码: {phone_number} -> {invite_code}")
        
        # 验证输入格式
        is_valid, error_msg = validate_required_fields(
            手机号=phone_number, 
            邀请码=invite_code
        )
        if not is_valid:
            return {"success": False, "message": error_msg}
        
        if not validate_phone_number(phone_number):
            return {"success": False, "message": "请输入正确的11位手机号码"}
        
        # 验证邀请码
        if not self.storage.verify_invite_code(invite_code):
            print(f"❌ 邀请码无效: {invite_code}")
            return {"success": False, "message": "邀请码无效"}
        
        # 创建新用户
        return self.storage.create_user(phone_number, invite_code)

# 全局认证服务实例
auth_service = AuthService()