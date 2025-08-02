"""
订单服务模块
处理订单相关的业务逻辑
"""
import json
from typing import Dict, Any, List
from datetime import datetime, timezone
from ..storage import storage
from ..utils import prepare_order_data, validate_budget, validate_required_fields

class OrderService:
    """订单服务类"""
    
    def __init__(self):
        self.storage = storage
    
    def create_order(self, user_id: str, phone_number: str, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建订单"""
        print(f"📋 创建订单: 用户 {user_id}")
        print(f"📋 订单数据: 用户{user_id}, 地址{form_data.get('address', '')[:20]}...")
        
        # 验证必填字段
        is_valid, error_msg = validate_required_fields(
            用户ID=user_id,
            手机号=phone_number,
            配送地址=form_data.get('address')
        )
        if not is_valid:
            return {"success": False, "message": error_msg}
        
        # 预算验证：允许免单订单的0金额，但不允许负数
        budget = form_data.get('budget', 0)
        budget_valid, budget_amount = validate_budget(str(budget))
        if not budget_valid:
            return {"success": False, "message": "预算金额无效"}
        
        # 准备订单数据
        order_data = prepare_order_data(user_id, phone_number, form_data)
        
        # 处理复杂字段（过敏和偏好）
        order_data['dietary_restrictions'] = json.dumps(
            form_data.get('allergies', []), 
            ensure_ascii=False
        )
        order_data['food_preferences'] = json.dumps(
            form_data.get('preferences', []), 
            ensure_ascii=False
        )
        
        # 创建订单
        return self.storage.create_order(order_data)
    
    def submit_order(self, order_id: str) -> Dict[str, Any]:
        """提交订单"""
        print(f"📤 提交订单: {order_id}")
        
        if not order_id:
            return {"success": False, "message": "订单ID不能为空"}
        
        # 检查订单是否存在
        order = self.storage.get_order(order_id)
        if not order:
            return {"success": False, "message": "订单不存在"}
        
        # 更新订单状态
        update_data = {
            'status': 'submitted',
            'submitted_at': datetime.now(timezone.utc).isoformat()
        }
        
        update_result = self.storage.update_order(order_id, update_data)
        
        if update_result["success"]:
            print(f"✅ 订单提交成功: {order['order_number']}")
            return {
                "success": True,
                "message": "订单提交成功",
                "order_number": order['order_number']
            }
        else:
            print(f"❌ 订单提交失败: {update_result['message']}")
            return update_result
    
    def update_order_feedback(self, order_id: str, rating: int, feedback: str) -> Dict[str, Any]:
        """更新订单反馈"""
        print(f"⭐ 更新订单反馈: {order_id} - 评分: {rating}")
        
        # 验证必填字段
        if not order_id:
            return {"success": False, "message": "订单ID不能为空"}
        
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return {"success": False, "message": "评分必须在1-5之间"}
        
        # 检查订单是否存在
        order = self.storage.get_order(order_id)
        if not order:
            return {"success": False, "message": "订单不存在"}
        
        # 更新反馈数据
        feedback_data = {
            'user_rating': rating,
            'user_feedback': feedback or '',
            'feedback_submitted_at': datetime.now(timezone.utc).isoformat()
        }
        
        update_result = self.storage.update_order(order_id, feedback_data)
        
        if update_result["success"]:
            print(f"✅ 反馈更新成功")
            return {"success": True, "message": "反馈提交成功"}
        else:
            print(f"❌ 反馈更新失败: {update_result['message']}")
            return update_result
    
    def get_user_orders(self, user_id: str) -> Dict[str, Any]:
        """获取用户订单列表"""
        print(f"📋 获取用户订单: {user_id}")
        
        if not user_id:
            return {"success": False, "message": "用户ID不能为空"}
        
        try:
            user_orders = self.storage.get_user_orders(user_id)
            print(f"📋 找到 {len(user_orders)} 个订单")
            
            return {
                "success": True,
                "orders": user_orders,
                "count": len(user_orders)
            }
        except Exception as e:
            print(f"❌ 获取订单失败: {str(e)}")
            return {"success": False, "message": f"获取订单失败: {str(e)}"}

# 全局订单服务实例
order_service = OrderService()