"""
邀请和免单相关API路由
"""
from flask import Blueprint, request, jsonify
from ..services import invite_service

# 创建邀请蓝图
invite_bp = Blueprint('invite', __name__)

@invite_bp.route('/get-user-invite-stats', methods=['GET'])
def api_get_user_invite_stats():
    """获取用户邀请统计API"""
    try:
        user_id = request.args.get('user_id')
        result = invite_service.get_user_invite_stats(user_id)
        
        status_code = 200 if result["success"] else 400
        return jsonify(result), status_code
        
    except Exception as e:
        print(f"❌ 获取邀请统计错误: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@invite_bp.route('/get-invite-progress', methods=['GET'])
def api_get_invite_progress():
    """获取用户邀请进度API"""
    try:
        user_id = request.args.get('user_id')
        result = invite_service.get_invite_progress(user_id)
        
        status_code = 200 if result["success"] else 400
        return jsonify(result), status_code
        
    except Exception as e:
        print(f"❌ 获取邀请进度错误: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@invite_bp.route('/claim-free-drink', methods=['POST'])
def api_claim_free_drink():
    """领取免单奶茶API"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        result = invite_service.claim_free_drink(user_id)
        
        status_code = 200 if result["success"] else 400
        return jsonify(result), status_code
        
    except Exception as e:
        print(f"❌ 领取免单错误: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@invite_bp.route('/free-drinks-remaining', methods=['GET'])
def api_free_drinks_remaining():
    """获取免单剩余数量API"""
    try:
        result = invite_service.get_free_drinks_remaining()
        
        status_code = 200 if result["success"] else 400
        return jsonify(result), status_code
        
    except Exception as e:
        print(f"❌ 获取免单剩余数量错误: {e}")
        return jsonify({"success": False, "message": str(e)}), 500