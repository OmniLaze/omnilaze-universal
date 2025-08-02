"""
数据库连接配置模块
"""
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = None

from .settings import config

class DatabaseConfig:
    """数据库配置类"""
    
    def __init__(self):
        self.supabase_client = None
        self._initialize_database()
    
    def _initialize_database(self):
        """初始化数据库连接"""
        if not config.is_development_mode and SUPABASE_AVAILABLE:
            try:
                self.supabase_client: Client = create_client(
                    config.SUPABASE_URL, 
                    config.SUPABASE_KEY
                )
                print("✅ Supabase连接已建立")
            except Exception as e:
                print(f"❌ Supabase连接失败: {e}")
                self.supabase_client = None
        else:
            if not SUPABASE_AVAILABLE:
                print("⚠️  Supabase模块未安装，将使用开发模式")
            else:
                print("⚠️  开发模式：未配置真实的Supabase，将使用模拟数据")
            self.supabase_client = None
    
    def get_client(self):
        """获取Supabase客户端"""
        return self.supabase_client
    
    def is_connected(self):
        """检查是否已连接数据库"""
        return self.supabase_client is not None

# 全局数据库配置实例
db_config = DatabaseConfig()