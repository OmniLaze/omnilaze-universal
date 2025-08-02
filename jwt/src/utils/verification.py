"""
验证码相关工具函数
"""
import random
import string
from datetime import datetime, timedelta, timezone
from ..config import config

def generate_verification_code() -> str:
    """生成验证码"""
    if config.is_development_mode:
        # 开发模式：始终返回固定验证码
        return config.DEV_VERIFICATION_CODE
    else:
        # 生产模式：生成随机验证码
        return ''.join(random.choices(string.digits, k=config.VERIFICATION_CODE_LENGTH))

def get_code_expiry_time() -> str:
    """获取验证码过期时间"""
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=config.VERIFICATION_CODE_EXPIRY_MINUTES
    )
    return expires_at.isoformat()

def is_code_expired(expires_at_str: str) -> bool:
    """检查验证码是否过期"""
    try:
        # 处理时间格式
        if expires_at_str.endswith('+00:00'):
            expires_at_str = expires_at_str.replace('+00:00', 'Z')
        expires_at = datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
        
        return datetime.now(timezone.utc) > expires_at
    except Exception:
        return True  # 解析失败认为已过期