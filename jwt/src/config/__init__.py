"""
配置模块导出
"""
from .settings import config
from .database import db_config

__all__ = ['config', 'db_config']