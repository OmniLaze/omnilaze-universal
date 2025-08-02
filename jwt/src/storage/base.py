"""
存储抽象基类
定义统一的存储接口
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List

class BaseStorage(ABC):
    """存储抽象基类"""
    
    @abstractmethod
    def store_verification_code(self, phone_number: str, code: str, expires_at: str) -> Dict[str, Any]:
        """存储验证码"""
        pass
    
    @abstractmethod
    def get_verification_code(self, phone_number: str) -> Optional[Dict[str, Any]]:
        """获取验证码"""
        pass
    
    @abstractmethod
    def mark_verification_code_used(self, phone_number: str) -> bool:
        """标记验证码为已使用"""
        pass
    
    @abstractmethod
    def create_user(self, phone_number: str, invite_code: str) -> Dict[str, Any]:
        """创建用户"""
        pass
    
    @abstractmethod
    def get_user(self, phone_number: str) -> Optional[Dict[str, Any]]:
        """获取用户信息"""
        pass
    
    @abstractmethod
    def verify_invite_code(self, invite_code: str) -> bool:
        """验证邀请码"""
        pass
    
    @abstractmethod
    def create_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建订单"""
        pass
    
    @abstractmethod
    def update_order(self, order_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """更新订单"""
        pass
    
    @abstractmethod
    def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        """获取订单"""
        pass
    
    @abstractmethod
    def get_user_orders(self, user_id: str) -> List[Dict[str, Any]]:
        """获取用户订单列表"""
        pass
    
    @abstractmethod
    def get_user_invite_stats(self, user_id: str) -> Dict[str, Any]:
        """获取用户邀请统计"""
        pass
    
    @abstractmethod
    def get_invite_progress(self, user_id: str) -> Dict[str, Any]:
        """获取邀请进度"""
        pass
    
    @abstractmethod
    def claim_free_drink(self, user_id: str) -> Dict[str, Any]:
        """领取免单"""
        pass
    
    @abstractmethod
    def get_free_drinks_remaining(self) -> int:
        """获取剩余免单数量"""
        pass