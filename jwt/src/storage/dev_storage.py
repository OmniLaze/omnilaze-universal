"""
开发模式内存存储实现
"""
import uuid
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List
from .base import BaseStorage
from ..config import config

class DevStorage(BaseStorage):
    """开发模式内存存储"""
    
    def __init__(self):
        # 内存存储
        self.verification_codes = {}
        self.users = {}
        self.orders = {}
        self.user_sequence_counter = 0
        self.user_invite_stats = {}
        self.invite_progress = {}
        self.free_drinks_remaining = 100
        
        # 新增：用户偏好存储
        self.user_preferences = {}
        
        # 预定义的有效邀请码
        self.valid_invite_codes = set(config.DEV_INVITE_CODES)
        
        print("🔧 开发模式存储已初始化")
    
    def store_verification_code(self, phone_number: str, code: str, expires_at: str) -> Dict[str, Any]:
        """存储验证码"""
        self.verification_codes[phone_number] = {
            'code': code,
            'expires_at': expires_at,
            'used': False,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        return {"success": True}
    
    def get_verification_code(self, phone_number: str) -> Optional[Dict[str, Any]]:
        """获取验证码"""
        return self.verification_codes.get(phone_number)
    
    def mark_verification_code_used(self, phone_number: str) -> bool:
        """标记验证码为已使用"""
        if phone_number in self.verification_codes:
            self.verification_codes[phone_number]['used'] = True
            return True
        return False
    
    def create_user(self, phone_number: str, invite_code: str) -> Dict[str, Any]:
        """创建用户"""
        self.user_sequence_counter += 1
        user_sequence = self.user_sequence_counter
        user_id = f"dev_user_{user_sequence}"
        
        user_data = {
            'id': user_id,
            'phone_number': phone_number,
            'user_sequence': user_sequence,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'invite_code': invite_code
        }
        
        self.users[phone_number] = user_data
        
        print(f"✅ 开发模式 - 新用户创建成功: {phone_number} (ID: {user_id}, 序号: {user_sequence})")
        return {
            "success": True,
            "message": "新用户注册成功",
            "user_id": user_id,
            "phone_number": phone_number,
            "user_sequence": user_sequence
        }
    
    def get_user(self, phone_number: str) -> Optional[Dict[str, Any]]:
        """获取用户信息"""
        return self.users.get(phone_number)
    
    def verify_invite_code(self, invite_code: str) -> bool:
        """验证邀请码"""
        return invite_code in self.valid_invite_codes
    
    def create_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建订单"""
        order_id = str(uuid.uuid4())
        order_data['id'] = order_id
        
        # 计算该用户的订单序号
        user_id = order_data['user_id']
        user_orders = [o for o in self.orders.values() if o['user_id'] == user_id]
        order_data['user_sequence_number'] = len(user_orders) + 1
        
        self.orders[order_id] = order_data
        
        print(f"✅ 开发模式 - 订单创建成功: {order_data['order_number']} (用户序号: {order_data['user_sequence_number']})")
        return {
            "success": True,
            "message": "订单创建成功",
            "order_id": order_id,
            "order_number": order_data['order_number'],
            "user_sequence_number": order_data['user_sequence_number']
        }
    
    def update_order(self, order_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """更新订单"""
        if order_id not in self.orders:
            return {"success": False, "message": "订单不存在"}
        
        self.orders[order_id].update(update_data)
        self.orders[order_id]['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        return {"success": True, "message": "订单更新成功"}
    
    def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        """获取订单"""
        return self.orders.get(order_id)
    
    def get_user_orders(self, user_id: str) -> List[Dict[str, Any]]:
        """获取用户订单列表"""
        user_orders = [
            order for order in self.orders.values() 
            if order['user_id'] == user_id and not order.get('is_deleted', False)
        ]
        user_orders.sort(key=lambda x: x['created_at'], reverse=True)
        return user_orders
    
    def get_user_invite_stats(self, user_id: str) -> Dict[str, Any]:
        """获取用户邀请统计"""
        if user_id not in self.user_invite_stats:
            # 模拟用户已邀请2人，可以获得免单
            self.user_invite_stats[user_id] = {
                'user_invite_code': f'USR{user_id[-6:]}',
                'current_uses': 2,
                'max_uses': 2,
                'remaining_uses': 0,
                'eligible_for_free_drink': True,
                'free_drink_claimed': False
            }
        
        stats = self.user_invite_stats[user_id].copy()
        stats['free_drinks_remaining'] = self.free_drinks_remaining
        return stats
    
    def get_invite_progress(self, user_id: str) -> Dict[str, Any]:
        """获取邀请进度"""
        if user_id not in self.invite_progress:
            # 模拟3个邀请记录
            self.invite_progress[user_id] = {
                'invitations': [
                    {
                        'phone_number': '138****0001',
                        'masked_phone': '138****0001',
                        'invited_at': (datetime.now() - timedelta(days=5)).isoformat()
                    },
                    {
                        'phone_number': '139****0002', 
                        'masked_phone': '139****0002',
                        'invited_at': (datetime.now() - timedelta(days=3)).isoformat()
                    },
                    {
                        'phone_number': '182****7609',
                        'masked_phone': '182****7609',
                        'invited_at': datetime.now().isoformat()
                    }
                ],
                'total_invitations': 3
            }
        
        return self.invite_progress[user_id]
    
    def claim_free_drink(self, user_id: str) -> Dict[str, Any]:
        """领取免单"""
        if user_id not in self.user_invite_stats:
            return {"success": False, "message": "用户邀请信息不存在"}
        
        user_stats = self.user_invite_stats[user_id]
        
        if user_stats.get('free_drink_claimed', False):
            return {"success": False, "message": "您已经领取过免单奶茶"}
        
        if not user_stats.get('eligible_for_free_drink', False):
            return {"success": False, "message": "邀请人数不足，无法领取免单"}
        
        if self.free_drinks_remaining <= 0:
            return {"success": False, "message": "免单名额已用完"}
        
        # 领取免单
        user_stats['free_drink_claimed'] = True
        self.free_drinks_remaining -= 1
        
        print(f"🎉 用户 {user_id} 成功领取免单，剩余名额: {self.free_drinks_remaining}")
        
        return {
            "success": True,
            "message": "免单领取成功！",
            "free_drinks_remaining": self.free_drinks_remaining
        }
    
    def get_free_drinks_remaining(self) -> int:
        """获取剩余免单数量"""
        return self.free_drinks_remaining
    
    # 新增：用户偏好相关方法
    def get_user_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """获取用户偏好设置"""
        return self.user_preferences.get(user_id)
    
    def save_user_preferences(self, user_id: str, preferences: Dict[str, Any]) -> Dict[str, Any]:
        """保存用户偏好设置"""
        try:
            preferences['user_id'] = user_id
            preferences['created_at'] = datetime.now(timezone.utc).isoformat()
            preferences['updated_at'] = datetime.now(timezone.utc).isoformat()
            
            self.user_preferences[user_id] = preferences
            
            print(f"✅ 开发模式 - 用户偏好保存成功: {user_id}")
            return {
                "success": True,
                "message": "偏好设置保存成功",
                "preferences": preferences
            }
        except Exception as e:
            print(f"❌ 用户偏好保存失败: {str(e)}")
            return {"success": False, "message": f"偏好设置保存失败: {str(e)}"}
    
    def update_user_preferences(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """更新用户偏好设置"""
        try:
            if user_id not in self.user_preferences:
                # 如果不存在，创建新的偏好设置
                return self.save_user_preferences(user_id, updates)
            
            # 更新现有偏好设置
            self.user_preferences[user_id].update(updates)
            self.user_preferences[user_id]['updated_at'] = datetime.now(timezone.utc).isoformat()
            
            print(f"✅ 开发模式 - 用户偏好更新成功: {user_id}")
            return {
                "success": True,
                "message": "偏好设置更新成功",
                "preferences": self.user_preferences[user_id]
            }
        except Exception as e:
            print(f"❌ 用户偏好更新失败: {str(e)}")
            return {"success": False, "message": f"偏好设置更新失败: {str(e)}"}
    
    def delete_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """删除用户偏好设置"""
        try:
            if user_id in self.user_preferences:
                del self.user_preferences[user_id]
                print(f"✅ 开发模式 - 用户偏好删除成功: {user_id}")
                return {"success": True, "message": "偏好设置删除成功"}
            else:
                return {"success": False, "message": "偏好设置不存在"}
        except Exception as e:
            print(f"❌ 用户偏好删除失败: {str(e)}")
            return {"success": False, "message": f"偏好设置删除失败: {str(e)}"}