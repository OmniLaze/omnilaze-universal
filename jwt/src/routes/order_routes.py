"""
订单相关API路由
"""
from flask import Blueprint, request, jsonify
from ..services import order_service

# 创建订单蓝图
order_bp = Blueprint('order', __name__)

@order_bp.route('/create-order', methods=['POST'])
def api_create_order():
    """创建订单API"""
    print(f"📋 收到创建订单请求")
    
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        phone_number = data.get('phone_number')
        form_data = data.get('form_data', {})
        
        result = order_service.create_order(user_id, phone_number, form_data)
        
        status_code = 200 if result["success"] else 400
        return jsonify(result), status_code
        
    except Exception as e:
        print(f"❌ 创建订单API错误: {str(e)}")
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500

@order_bp.route('/submit-order', methods=['POST'])
def api_submit_order():
    """提交订单API"""
    print(f"📤 收到提交订单请求")
    
    try:
        data = request.get_json()
        order_id = data.get('order_id')
        
        print(f"📤 提交订单: {order_id}")
        
        result = order_service.submit_order(order_id)
        
        status_code = 200 if result["success"] else 400
        return jsonify(result), status_code
        
    except Exception as e:
        print(f"❌ 提交订单API错误: {str(e)}")
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500

@order_bp.route('/order-feedback', methods=['POST'])
def api_order_feedback():
    """订单反馈API"""
    print(f"⭐ 收到订单反馈请求")
    
    try:
        data = request.get_json()
        order_id = data.get('order_id')
        rating = data.get('rating')
        feedback = data.get('feedback', '')
        
        print(f"⭐ 订单反馈: {order_id} - 评分: {rating}")
        
        result = order_service.update_order_feedback(order_id, rating, feedback)
        
        status_code = 200 if result["success"] else 400
        return jsonify(result), status_code
        
    except Exception as e:
        print(f"❌ 订单反馈API错误: {str(e)}")
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500

@order_bp.route('/orders/<user_id>', methods=['GET'])
def api_get_user_orders(user_id):
    """获取用户订单列表API"""
    try:
        result = order_service.get_user_orders(user_id)
        
        status_code = 200 if result["success"] else 400
        return jsonify(result), status_code
        
    except Exception as e:
        print(f"❌ 获取订单API错误: {str(e)}")
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500