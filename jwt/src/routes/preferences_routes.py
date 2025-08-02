"""
用户偏好相关API路由
"""
from flask import Blueprint, request, jsonify
from ..services.preferences_service import preferences_service
from ..utils import validate_request_data

preferences_bp = Blueprint('preferences', __name__)

@preferences_bp.route('/preferences/<user_id>', methods=['GET'])
def get_user_preferences(user_id):
    """获取用户偏好设置"""
    print(f"🔍 获取用户偏好: {user_id}")
    
    try:
        result = preferences_service.get_user_preferences(user_id)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        print(f"❌ 获取用户偏好异常: {str(e)}")
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500

@preferences_bp.route('/preferences', methods=['POST'])
def save_user_preferences():
    """保存用户偏好设置"""
    try:
        data = request.get_json()
        
        # 验证请求数据
        is_valid, error_msg = validate_request_data(
            data,
            required_fields=['user_id', 'form_data']
        )
        if not is_valid:
            return jsonify({"success": False, "message": error_msg}), 400
        
        user_id = data['user_id']
        form_data = data['form_data']
        
        print(f"💾 保存用户偏好请求: {user_id}")
        
        result = preferences_service.save_user_preferences(user_id, form_data)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"❌ 保存用户偏好异常: {str(e)}")
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500

@preferences_bp.route('/preferences/<user_id>', methods=['PUT'])
def update_user_preferences(user_id):
    """更新用户偏好设置"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"success": False, "message": "请求体不能为空"}), 400
        
        print(f"🔄 更新用户偏好请求: {user_id}")
        
        result = preferences_service.update_user_preferences(user_id, data)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"❌ 更新用户偏好异常: {str(e)}")
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500

@preferences_bp.route('/preferences/<user_id>', methods=['DELETE'])
def delete_user_preferences(user_id):
    """删除用户偏好设置"""
    print(f"🗑️  删除用户偏好请求: {user_id}")
    
    try:
        result = preferences_service.delete_user_preferences(user_id)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        print(f"❌ 删除用户偏好异常: {str(e)}")
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500

@preferences_bp.route('/preferences/<user_id>/complete', methods=['GET'])
def check_preferences_completeness(user_id):
    """检查用户偏好是否完整（用于判断是否可以快速下单）"""
    print(f"✅ 检查偏好完整性: {user_id}")
    
    try:
        # 获取用户偏好
        preferences_result = preferences_service.get_user_preferences(user_id)
        
        if not preferences_result["success"]:
            return jsonify({
                "success": True,
                "has_preferences": False,
                "is_complete": False,
                "can_quick_order": False,
                "message": "用户暂无保存的偏好设置"
            }), 200
        
        preferences = preferences_result.get("preferences")
        has_preferences = preferences_result.get("has_preferences", False)
        
        # 检查偏好完整性
        is_complete = preferences_service.has_complete_preferences(preferences)
        
        return jsonify({
            "success": True,
            "has_preferences": has_preferences,
            "is_complete": is_complete,
            "can_quick_order": is_complete,
            "preferences": preferences if has_preferences else None
        }), 200
        
    except Exception as e:
        print(f"❌ 检查偏好完整性异常: {str(e)}")
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500

@preferences_bp.route('/preferences/<user_id>/form-data', methods=['GET'])
def get_preferences_as_form_data(user_id):
    """获取用户偏好并转换为表单数据格式"""
    print(f"📋 获取偏好表单数据: {user_id}")
    
    try:
        # 获取用户偏好
        preferences_result = preferences_service.get_user_preferences(user_id)
        
        if not preferences_result["success"] or not preferences_result.get("has_preferences"):
            return jsonify({
                "success": True,
                "has_preferences": False,
                "form_data": {}
            }), 200
        
        preferences = preferences_result["preferences"]
        
        # 转换为表单数据格式
        form_data = preferences_service.prepare_form_data_from_preferences(preferences)
        
        return jsonify({
            "success": True,
            "has_preferences": True,
            "form_data": form_data,
            "can_quick_order": preferences_service.has_complete_preferences(preferences)
        }), 200
        
    except Exception as e:
        print(f"❌ 获取偏好表单数据异常: {str(e)}")
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500