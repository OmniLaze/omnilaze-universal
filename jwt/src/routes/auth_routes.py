"""
认证相关API路由
"""
from flask import Blueprint, request, jsonify
from ..services import auth_service

# 创建认证蓝图
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/send-verification-code', methods=['POST'])
def api_send_verification_code():
    """发送验证码API"""
    print(f"📱 收到发送验证码请求 - Origin: {request.headers.get('Origin', 'Unknown')}")
    
    try:
        data = request.get_json()
        phone_number = data.get('phone_number')
        
        print(f"📱 手机号: {phone_number}")
        
        result = auth_service.send_verification_code(phone_number)
        
        status_code = 200 if result["success"] else 400
        return jsonify(result), status_code
        
    except Exception as e:
        print(f"❌ 服务器错误: {str(e)}")
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500

@auth_bp.route('/login-with-phone', methods=['POST'])
def api_login_with_phone():
    """验证码登录API"""
    try:
        data = request.get_json()
        phone_number = data.get('phone_number')
        verification_code = data.get('verification_code')
        
        result = auth_service.login_with_phone(phone_number, verification_code)
        
        status_code = 200 if result["success"] else 400
        return jsonify(result), status_code
        
    except Exception as e:
        print(f"❌ 登录API错误: {str(e)}")
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500

@auth_bp.route('/verify-invite-code', methods=['POST'])
def api_verify_invite_code():
    """验证邀请码并创建新用户API"""
    try:
        data = request.get_json()
        phone_number = data.get('phone_number')
        invite_code = data.get('invite_code')
        
        result = auth_service.verify_invite_code_and_create_user(phone_number, invite_code)
        
        status_code = 200 if result["success"] else 400
        return jsonify(result), status_code
        
    except Exception as e:
        print(f"❌ 邀请码验证API错误: {str(e)}")
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500