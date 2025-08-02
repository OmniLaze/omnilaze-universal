"""
输入验证工具函数
"""
import re

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