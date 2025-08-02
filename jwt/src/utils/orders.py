"""
订单相关工具函数
"""
import uuid
import random
from datetime import datetime
from typing import Dict, Any

def generate_order_number() -> str:
    """生成订单号"""
    today = datetime.now().strftime('%Y%m%d')
    # 对于开发模式，这里可以简化
    # 生产模式会由数据库触发器自动生成更复杂的订单号
    return f"ORD{today}{random_suffix()}"

def random_suffix() -> str:
    """生成随机后缀"""
    return f"{random.randint(1, 999):03d}"

def generate_order_id() -> str:
    """生成订单ID"""
    return str(uuid.uuid4())

def prepare_order_data(user_id: str, phone_number: str, form_data: Dict[str, Any]) -> Dict[str, Any]:
    """准备订单数据"""
    current_time = datetime.now()
    
    return {
        'order_number': generate_order_number(),
        'user_id': user_id,
        'phone_number': phone_number,
        'status': 'draft',
        'order_date': current_time.date().isoformat(),
        'created_at': current_time.isoformat(),
        'delivery_address': form_data.get('address', ''),
        'dietary_restrictions': str(form_data.get('allergies', [])),
        'food_preferences': str(form_data.get('preferences', [])),
        'budget_amount': float(form_data.get('budget', 0)),
        'budget_currency': 'CNY',
        'is_deleted': False
    }