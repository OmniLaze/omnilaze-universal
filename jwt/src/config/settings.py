"""
应用程序配置模块
负责管理环境变量、配置参数等
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """应用程序配置类"""
    
    # 数据库配置
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    
    # 短信服务配置
    SPUG_URL = os.getenv("SPUG_URL")
    
    # 开发模式配置
    FORCE_DEV_MODE = os.getenv("FORCE_DEV_MODE", "false").lower() == "true"
    
    # CORS配置
    CORS_ORIGINS = [
        "http://localhost:8081",
        "http://localhost:3000", 
        "http://localhost:19006"
    ]
    
    # API配置
    API_HOST = "0.0.0.0"
    API_PORT = 5001
    
    # 验证码配置
    VERIFICATION_CODE_LENGTH = 6
    VERIFICATION_CODE_EXPIRY_MINUTES = 10
    
    # 开发模式配置
    DEV_VERIFICATION_CODE = "100000"
    DEV_INVITE_CODES = ['1234', 'WELCOME', 'LANDE', 'OMNILAZE', 'ADVX2025']
    
    @property
    def is_development_mode(self):
        """判断是否为开发模式"""
        return (
            self.FORCE_DEV_MODE or
            not self.SUPABASE_URL or 
            self.SUPABASE_URL == "your_supabase_project_url" or 
            not self.SUPABASE_KEY or 
            "example" in (self.SUPABASE_URL or "").lower()
        )

# 全局配置实例
config = Config()