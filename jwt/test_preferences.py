#!/usr/bin/env python3
"""
用户偏好系统后端测试脚本
"""
import sys
import os

# 添加项目路径到sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 测试偏好服务
try:
    from src.services.preferences_service import preferences_service
    from src.storage.dev_storage import DevStorage
    
    print("=== 用户偏好系统后端测试 ===")
    
    # 创建测试用户ID
    test_user_id = "test_user_123"
    
    # 测试表单数据
    test_form_data = {
        'address': '北京市朝阳区三里屯街道',
        'selectedFoodType': ['甜品', '咖啡'],
        'selectedAllergies': ['坚果'],
        'selectedPreferences': ['少糖', '热饮'],
        'budget': '50-80元',
        'otherAllergyText': '',
        'otherPreferenceText': '多加奶泡',
        'selectedAddressSuggestion': None
    }
    
    print(f"📋 测试用户ID: {test_user_id}")
    print(f"📋 测试表单数据: {test_form_data}")
    
    # 1. 测试保存偏好
    print("\n1️⃣ 测试保存用户偏好...")
    save_result = preferences_service.save_user_preferences(test_user_id, test_form_data)
    print(f"保存结果: {save_result}")
    
    # 2. 测试获取偏好
    print("\n2️⃣ 测试获取用户偏好...")
    get_result = preferences_service.get_user_preferences(test_user_id)
    print(f"获取结果: {get_result}")
    
    # 3. 测试偏好完整性检查
    print("\n3️⃣ 测试偏好完整性检查...")
    if get_result["success"] and get_result.get("preferences"):
        preferences = get_result["preferences"]
        is_complete = preferences_service.has_complete_preferences(preferences)
        print(f"偏好完整性: {is_complete}")
        
        # 4. 测试转换为表单数据格式
        print("\n4️⃣ 测试转换为表单数据格式...")
        form_data = preferences_service.prepare_form_data_from_preferences(preferences)
        print(f"表单数据格式: {form_data}")
    
    # 5. 测试更新偏好
    print("\n5️⃣ 测试更新用户偏好...")
    update_data = {
        'default_budget': '80-120元',
        'default_preferences': ['少糖', '热饮', '大杯']
    }
    update_result = preferences_service.update_user_preferences(test_user_id, update_data)
    print(f"更新结果: {update_result}")
    
    # 6. 再次检查更新后的偏好
    print("\n6️⃣ 检查更新后的偏好...")
    updated_get_result = preferences_service.get_user_preferences(test_user_id)
    print(f"更新后偏好: {updated_get_result}")
    
    print("\n✅ 用户偏好系统后端测试完成！")
    
except Exception as e:
    print(f"❌ 测试过程中出现错误: {str(e)}")
    import traceback
    traceback.print_exc()