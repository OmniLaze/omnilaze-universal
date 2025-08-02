"""
邀请和免单服务模块
处理用户邀请和免单相关的业务逻辑
"""
from typing import Dict, Any
from ..storage import storage

class InviteService:
    """邀请服务类"""
    
    def __init__(self):
        self.storage = storage
    
    def get_user_invite_stats(self, user_id: str) -> Dict[str, Any]:
        """获取用户邀请统计"""
        if not user_id:
            return {"success": False, "message": "用户ID不能为空"}
        
        try:
            stats = self.storage.get_user_invite_stats(user_id)
            return {
                "success": True,
                **stats
            }
        except Exception as e:
            print(f"❌ 获取邀请统计错误: {e}")
            return {"success": False, "message": str(e)}
    
    def get_invite_progress(self, user_id: str) -> Dict[str, Any]:
        """获取用户邀请进度"""
        if not user_id:
            return {"success": False, "message": "用户ID不能为空"}
        
        try:
            progress = self.storage.get_invite_progress(user_id)
            return {
                "success": True,
                **progress
            }
        except Exception as e:
            print(f"❌ 获取邀请进度错误: {e}")
            return {"success": False, "message": str(e)}
    
    def claim_free_drink(self, user_id: str) -> Dict[str, Any]:
        """领取免单奶茶"""
        if not user_id:
            return {"success": False, "message": "用户ID不能为空"}
        
        try:
            result = self.storage.claim_free_drink(user_id)
            if result["success"]:
                print(f"🎉 用户 {user_id} 成功领取免单")
            else:
                print(f"❌ 用户 {user_id} 领取免单失败: {result['message']}")
            return result
        except Exception as e:
            print(f"❌ 领取免单错误: {e}")
            return {"success": False, "message": str(e)}
    
    def get_free_drinks_remaining(self) -> Dict[str, Any]:
        """获取免单剩余数量"""
        try:
            remaining = self.storage.get_free_drinks_remaining()
            return {
                "success": True,
                "free_drinks_remaining": remaining,
                "message": f"还有 {remaining} 个免单名额"
            }
        except Exception as e:
            print(f"❌ 获取免单剩余数量错误: {e}")
            return {"success": False, "message": str(e)}

# 全局邀请服务实例
invite_service = InviteService()