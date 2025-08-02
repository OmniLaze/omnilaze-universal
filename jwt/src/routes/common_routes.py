"""
通用API路由
"""
from flask import Blueprint, jsonify
from ..config import config
from ..storage import storage

# 创建通用蓝图
common_bp = Blueprint('common', __name__)

@common_bp.route('/health', methods=['GET'])
def health_check():
    """健康检查API"""
    return jsonify({
        "status": "healthy", 
        "message": "API服务正常运行",
        "cors_origins": config.CORS_ORIGINS,
        "development_mode": config.is_development_mode,
        "free_drinks_remaining": storage.get_free_drinks_remaining() if config.is_development_mode else "unknown"
    }), 200