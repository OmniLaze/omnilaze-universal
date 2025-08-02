"""
服务模块导出
"""
from .auth_service import auth_service
from .order_service import order_service
from .invite_service import invite_service
from .preferences_service import preferences_service

__all__ = ['auth_service', 'order_service', 'invite_service', 'preferences_service']