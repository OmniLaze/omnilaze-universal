"""
生产模式Supabase存储实现
"""
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from .base import BaseStorage
from ..config import db_config

class ProductionStorage(BaseStorage):
    """生产模式Supabase存储"""
    
    def __init__(self):
        self.supabase = db_config.get_client()
        if not self.supabase:
            raise RuntimeError("Supabase客户端未初始化")
        print("✅ 生产模式存储已初始化")
    
    def store_verification_code(self, phone_number: str, code: str, expires_at: str) -> Dict[str, Any]:
        """存储验证码"""
        try:
            result = self.supabase.table('verification_codes').upsert({
                'phone_number': phone_number,
                'code': code,
                'expires_at': expires_at,
                'used': False
            }).execute()
            return {"success": True}
        except Exception as e:
            return {"success": False, "message": str(e)}
    
    def get_verification_code(self, phone_number: str) -> Optional[Dict[str, Any]]:
        """获取验证码"""
        try:
            result = self.supabase.table('verification_codes').select('*').eq(
                'phone_number', phone_number
            ).eq('used', False).order('created_at', desc=True).limit(1).execute()
            
            return result.data[0] if result.data else None
        except Exception:
            return None
    
    def mark_verification_code_used(self, phone_number: str) -> bool:
        """标记验证码为已使用"""
        try:
            code_record = self.get_verification_code(phone_number)
            if not code_record:
                return False
            
            self.supabase.table('verification_codes').update(
                {'used': True}
            ).eq('id', code_record['id']).execute()
            return True
        except Exception:
            return False
    
    def create_user(self, phone_number: str, invite_code: str) -> Dict[str, Any]:
        """创建用户"""
        try:
            # 创建新用户
            new_user = self.supabase.table('users').insert({
                'phone_number': phone_number,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'invite_code': invite_code
            }).execute()
            
            # 标记邀请码为已使用
            self.supabase.table('invite_codes').update({
                'used': True, 
                'used_by': phone_number
            }).eq('code', invite_code).execute()
            
            return {
                "success": True,
                "message": "新用户注册成功",
                "user_id": new_user.data[0]['id'],
                "phone_number": phone_number
            }
        except Exception as e:
            return {"success": False, "message": f"用户创建失败: {str(e)}"}
    
    def get_user(self, phone_number: str) -> Optional[Dict[str, Any]]:
        """获取用户信息"""
        try:
            result = self.supabase.table('users').select('*').eq(
                'phone_number', phone_number
            ).execute()
            return result.data[0] if result.data else None
        except Exception:
            return None
    
    def verify_invite_code(self, invite_code: str) -> bool:
        """验证邀请码"""
        try:
            result = self.supabase.table('invite_codes').select('*').eq(
                'code', invite_code
            ).eq('used', False).execute()
            return bool(result.data)
        except Exception:
            return False
    
    def create_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建订单"""
        try:
            # 获取用户的下一个序号
            user_id = order_data['user_id']
            result = self.supabase.from_('orders').select('user_sequence_number').eq(
                'user_id', user_id
            ).order('user_sequence_number', desc=True).limit(1).execute()
            
            if result.data:
                user_sequence_number = result.data[0]['user_sequence_number'] + 1
            else:
                user_sequence_number = 1
            
            order_data['user_sequence_number'] = user_sequence_number
            
            result = self.supabase.table('orders').insert(order_data).execute()
            order_id = result.data[0]['id']
            actual_order_number = result.data[0]['order_number']
            
            print(f"✅ 生产模式 - 订单创建成功: {actual_order_number} (用户序号: {user_sequence_number})")
            return {
                "success": True,
                "message": "订单创建成功",
                "order_id": order_id,
                "order_number": actual_order_number,
                "user_sequence_number": user_sequence_number
            }
        except Exception as e:
            print(f"❌ 订单创建失败: {str(e)}")
            return {"success": False, "message": f"订单创建失败: {str(e)}"}
    
    def update_order(self, order_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """更新订单"""
        try:
            result = self.supabase.table('orders').update(update_data).eq('id', order_id).execute()
            
            if not result.data:
                return {"success": False, "message": "订单不存在"}
            
            return {"success": True, "message": "订单更新成功"}
        except Exception as e:
            return {"success": False, "message": f"订单更新失败: {str(e)}"}
    
    def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        """获取订单"""
        try:
            result = self.supabase.table('orders').select('*').eq('id', order_id).execute()
            return result.data[0] if result.data else None
        except Exception:
            return None
    
    def get_user_orders(self, user_id: str) -> List[Dict[str, Any]]:
        """获取用户订单列表"""
        try:
            result = self.supabase.table('orders').select('*').eq(
                'user_id', user_id
            ).eq('is_deleted', False).order('created_at', desc=True).execute()
            return result.data
        except Exception:
            return []
    
    def get_user_invite_stats(self, user_id: str) -> Dict[str, Any]:
        """获取用户邀请统计"""
        # TODO: 实现Supabase查询逻辑
        return {"success": False, "message": "生产模式暂未实现"}
    
    def get_invite_progress(self, user_id: str) -> Dict[str, Any]:
        """获取邀请进度"""
        # TODO: 实现Supabase查询逻辑
        return {"success": False, "message": "生产模式暂未实现"}
    
    def claim_free_drink(self, user_id: str) -> Dict[str, Any]:
        """领取免单"""
        # TODO: 实现Supabase更新逻辑
        return {"success": False, "message": "生产模式暂未实现"}
    
    def get_free_drinks_remaining(self) -> int:
        """获取剩余免单数量"""
        # TODO: 实现Supabase查询逻辑
        return 0