"""
存储工厂模块
根据配置返回相应的存储实现
"""
from .base import BaseStorage
from .dev_storage import DevStorage
from .production_storage import ProductionStorage
from ..config import config

class StorageFactory:
    """存储工厂类"""
    
    @staticmethod
    def create_storage() -> BaseStorage:
        """根据配置创建存储实例"""
        if config.is_development_mode:
            return DevStorage()
        else:
            return ProductionStorage()

# 全局存储实例
storage = StorageFactory.create_storage()