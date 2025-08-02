"""
路由模块导出
"""
from .auth_routes import auth_bp
from .order_routes import order_bp
from .invite_routes import invite_bp
from .common_routes import common_bp

__all__ = ['auth_bp', 'order_bp', 'invite_bp', 'common_bp']