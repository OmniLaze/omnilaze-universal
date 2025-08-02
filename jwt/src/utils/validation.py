"""
输入验证工具函数
"""
import re
from typing import Dict, Any, List

def validate_phone_number(phone_number: str) -> bool:
    """验证手机号格式"""
    if not phone_number:
        return False
    return len(phone_number) == 11 and phone_number.isdigit()

def validate_verification_code(code: str) -> bool:
    """验证验证码格式"""
    if not code:
        return False
    return len(code) == 6 and code.isdigit()

def validate_budget(budget: str) -> tuple[bool, float]:
    """验证预算金额
    
    Returns:
        tuple: (is_valid, amount)
    """
    try:
        amount = float(budget)
        return amount >= 0, amount  # 允许免单订单的0金额
    except (ValueError, TypeError):
        return False, 0.0

def validate_required_fields(**fields) -> tuple[bool, str]:
    """验证必填字段
    
    Returns:
        tuple: (is_valid, error_message)
    """
    for field_name, field_value in fields.items():
        if not field_value:
            return False, f"{field_name}不能为空"
    return True, ""

def validate_request_data(data: Dict[str, Any], required_fields: List[str]) -> tuple[bool, str]:
    """验证请求数据
    
    Args:
        data: 请求数据字典
        required_fields: 必填字段列表
    
    Returns:
        tuple: (is_valid, error_message)
    """
    if not data:
        return False, "请求数据不能为空"
    
    for field in required_fields:
        if field not in data or data[field] is None or data[field] == "":
            return False, f"缺少必填字段: {field}"
    
    return True, ""