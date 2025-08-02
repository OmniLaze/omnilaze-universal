"""
用户偏好服务模块
处理用户偏好相关的业务逻辑
"""
from typing import Dict, Any, Optional
from ..storage import storage
from ..utils import validate_required_fields

class PreferencesService:
    """用户偏好服务类"""
    
    def __init__(self):
        self.storage = storage
    
    def get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """获取用户偏好设置"""
        if not user_id:
            return {"success": False, "message": "用户ID不能为空"}
        
        try:
            preferences = self.storage.get_user_preferences(user_id)
            
            if preferences:
                print(f"✅ 获取用户偏好成功: {user_id}")
                return {
                    "success": True,
                    "preferences": preferences,
                    "has_preferences": True
                }
            else:
                print(f"ℹ️  用户无保存偏好: {user_id}")
                return {
                    "success": True,
                    "preferences": None,
                    "has_preferences": False,
                    "message": "用户暂无保存的偏好设置"
                }
        except Exception as e:
            print(f"❌ 获取用户偏好失败: {str(e)}")
            return {"success": False, "message": f"获取偏好设置失败: {str(e)}"}
    
    def save_user_preferences(self, user_id: str, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """保存用户偏好设置"""
        print(f"💾 保存用户偏好: {user_id}")
        
        # 验证必填字段
        is_valid, error_msg = validate_required_fields(
            用户ID=user_id,
            配送地址=form_data.get('address')
        )
        if not is_valid:
            return {"success": False, "message": error_msg}
        
        try:
            # 构建偏好数据结构
            preferences = {
                'default_address': form_data.get('address', ''),
                'default_food_type': form_data.get('selectedFoodType', []),
                'default_allergies': form_data.get('selectedAllergies', []),
                'default_preferences': form_data.get('selectedPreferences', []),
                'default_budget': form_data.get('budget', ''),
                'other_allergy_text': form_data.get('otherAllergyText', ''),
                'other_preference_text': form_data.get('otherPreferenceText', ''),
                'address_suggestion': form_data.get('selectedAddressSuggestion', None)
            }
            
            # 过滤空值
            preferences = {k: v for k, v in preferences.items() if v is not None}
            
            return self.storage.save_user_preferences(user_id, preferences)
            
        except Exception as e:
            print(f"❌ 保存用户偏好失败: {str(e)}")
            return {"success": False, "message": f"保存偏好设置失败: {str(e)}"}
    
    def update_user_preferences(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """更新用户偏好设置"""
        print(f"🔄 更新用户偏好: {user_id}")
        
        if not user_id:
            return {"success": False, "message": "用户ID不能为空"}
        
        try:
            # 过滤空值
            filtered_updates = {k: v for k, v in updates.items() if v is not None}
            
            if not filtered_updates:
                return {"success": False, "message": "没有有效的更新数据"}
            
            return self.storage.update_user_preferences(user_id, filtered_updates)
            
        except Exception as e:
            print(f"❌ 更新用户偏好失败: {str(e)}")
            return {"success": False, "message": f"更新偏好设置失败: {str(e)}"}
    
    def delete_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """删除用户偏好设置"""
        print(f"🗑️  删除用户偏好: {user_id}")
        
        if not user_id:
            return {"success": False, "message": "用户ID不能为空"}
        
        try:
            return self.storage.delete_user_preferences(user_id)
            
        except Exception as e:
            print(f"❌ 删除用户偏好失败: {str(e)}")
            return {"success": False, "message": f"删除偏好设置失败: {str(e)}"}
    
    def prepare_form_data_from_preferences(self, preferences: Dict[str, Any]) -> Dict[str, Any]:
        """将偏好数据转换为表单数据格式"""
        try:
            return {
                'address': preferences.get('default_address', ''),
                'selectedFoodType': preferences.get('default_food_type', []),
                'selectedAllergies': preferences.get('default_allergies', []),
                'selectedPreferences': preferences.get('default_preferences', []),
                'budget': preferences.get('default_budget', ''),
                'otherAllergyText': preferences.get('other_allergy_text', ''),
                'otherPreferenceText': preferences.get('other_preference_text', ''),
                'selectedAddressSuggestion': preferences.get('address_suggestion', None)
            }
        except Exception as e:
            print(f"❌ 转换偏好数据失败: {str(e)}")
            return {}
    
    def has_complete_preferences(self, preferences: Optional[Dict[str, Any]]) -> bool:
        """检查偏好设置是否完整（用于判断是否可以快速下单）"""
        if not preferences:
            return False
        
        required_fields = [
            'default_address',
            'default_food_type',
            'default_budget'
        ]
        
        for field in required_fields:
            value = preferences.get(field)
            if not value:  # 空字符串、空列表、None都认为是不完整
                return False
            
            # 特殊检查：food_type和budget不能为空
            if field == 'default_food_type' and (not isinstance(value, list) or len(value) == 0):
                return False
            if field == 'default_budget' and (not isinstance(value, str) or value.strip() == ''):
                return False
        
        return True

# 全局偏好服务实例
preferences_service = PreferencesService()