import requests
import random
import string
import time
import json
import uuid
from datetime import datetime, timedelta, timezone
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# 更详细的CORS配置，支持开发环境
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:8081", "http://localhost:3000", "http://localhost:19006"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SPUG_URL = os.getenv("SPUG_URL")

# 开发模式 - 如果没有配置真实的Supabase，使用模拟模式
DEVELOPMENT_MODE = not SUPABASE_URL or SUPABASE_URL == "your_supabase_project_url" or not SUPABASE_KEY or "example" in SUPABASE_URL.lower()

# 强制开发模式用于测试（可以通过环境变量覆盖）
if os.getenv("FORCE_DEV_MODE", "false").lower() == "true":
    DEVELOPMENT_MODE = True
    print("🔧 强制开发模式已启用")

if DEVELOPMENT_MODE:
    print("⚠️  开发模式：未配置真实的Supabase，将使用模拟数据")
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def generate_verification_code():
    if DEVELOPMENT_MODE:
        # 开发模式：始终返回固定验证码
        return '100000'
    else:
        # 生产模式：生成随机验证码
        return ''.join(random.choices(string.digits, k=6))

# 开发模式的内存存储
dev_verification_codes = {}
dev_users = {}
dev_invite_codes = {'1234': True, 'WELCOME': True, 'LANDE': True, 'OMNILAZE': True, 'ADVX2025': True}  # 有效的邀请码
# 开发模式订单存储
dev_orders = {}
# 开发模式用户序号计数器
dev_user_sequence_counter = 0

def store_verification_code(phone_number, code):
    if DEVELOPMENT_MODE:
        # 开发模式：存储到内存
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        dev_verification_codes[phone_number] = {
            'code': code,
            'expires_at': expires_at,
            'used': False,
            'created_at': datetime.now(timezone.utc)
        }
        return {"success": True}
    else:
        # 生产模式：存储到Supabase
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        
        result = supabase.table('verification_codes').upsert({
            'phone_number': phone_number,
            'code': code,
            'expires_at': expires_at.isoformat(),
            'used': False
        }).execute()
        
        return result

def send_verification_code(phone_number):
    code = generate_verification_code()
    
    store_result = store_verification_code(phone_number, code)
    
    if DEVELOPMENT_MODE:
        # 开发模式：不发送真实短信，在控制台显示验证码
        print(f"🔧 开发模式 - 固定验证码: {phone_number} -> {code} (开发测试请使用: 100000)")
        return {"success": True, "message": "验证码发送成功（开发模式，请使用验证码: 100000）", "dev_code": code}
    else:
        # 生产模式：真实发送短信
        body = {'name': '验证码', 'code': code, 'targets': phone_number}
        response = requests.post(SPUG_URL, json=body)
        
        if response.status_code == 200:
            return {"success": True, "message": "验证码发送成功"}
        else:
            return {"success": False, "message": "验证码发送失败"}

def verify_code(phone_number, input_code):
    if DEVELOPMENT_MODE:
        # 开发模式：从内存验证
        if phone_number not in dev_verification_codes:
            return {"success": False, "message": "验证码不存在或已使用"}
        
        code_record = dev_verification_codes[phone_number]
        
        if code_record['used']:
            return {"success": False, "message": "验证码不存在或已使用"}
        
        # 检查是否过期
        if datetime.now(timezone.utc) > code_record['expires_at']:
            return {"success": False, "message": "验证码已过期"}
        
        # 验证验证码
        if code_record['code'] != input_code:
            return {"success": False, "message": "验证码错误"}
        
        # 标记为已使用
        code_record['used'] = True
        return {"success": True, "message": "验证码验证成功"}
    else:
        # 生产模式：从Supabase验证
        result = supabase.table('verification_codes').select('*').eq('phone_number', phone_number).eq('used', False).order('created_at', desc=True).limit(1).execute()
        
        if not result.data:
            return {"success": False, "message": "验证码不存在或已使用"}
        
        code_record = result.data[0]
        expires_at_str = code_record['expires_at']
        if expires_at_str.endswith('+00:00'):
            expires_at_str = expires_at_str.replace('+00:00', 'Z')
        expires_at = datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
        
        if datetime.now(timezone.utc) > expires_at:
            return {"success": False, "message": "验证码已过期"}
        
        if code_record['code'] != input_code:
            return {"success": False, "message": "验证码错误"}
        
        # 标记验证码为已使用
        supabase.table('verification_codes').update({'used': True}).eq('id', code_record['id']).execute()
        
        return {"success": True, "message": "验证码验证成功"}

def login_with_phone(phone_number, verification_code):
    print(f"🔐 开始登录验证: {phone_number}")
    verify_result = verify_code(phone_number, verification_code)
    
    if not verify_result["success"]:
        print(f"❌ 验证码验证失败: {verify_result['message']}")
        return verify_result
    
    print(f"✅ 验证码验证成功: {phone_number}")
    is_new_user = False
    
    if DEVELOPMENT_MODE:
        # 开发模式：使用内存存储用户
        print(f"📝 当前用户列表: {list(dev_users.keys())}")
        if phone_number not in dev_users:
            # 新用户，但暂不创建，等待邀请码验证
            is_new_user = True
            user_id = f"dev_user_{len(dev_users) + 1}"
            print(f"🆕 检测到新用户: {phone_number}")
        else:
            user_data = dev_users[phone_number]
            user_id = user_data['id']
            user_sequence = user_data.get('user_sequence', 0)
            print(f"👤 老用户登录: {phone_number} (ID: {user_id}, 序号: {user_sequence})")
        
        print(f"✅ 开发模式 - 用户验证成功: {phone_number} (新用户: {is_new_user})")
    else:
        # 生产模式：使用Supabase
        user_result = supabase.table('users').select('*').eq('phone_number', phone_number).execute()
        
        if not user_result.data:
            # 新用户，但暂不创建，等待邀请码验证
            is_new_user = True
            user_id = f"temp_user_{phone_number}"  # 临时ID
            print(f"🆕 检测到新用户: {phone_number}")
        else:
            user_id = user_result.data[0]['id']
            print(f"👤 老用户登录: {phone_number} (ID: {user_id})")
    
    result = {
        "success": True,
        "message": "验证成功" if not is_new_user else "新用户验证成功，请输入邀请码",
        "user_id": user_id if not is_new_user else None,
        "phone_number": phone_number,
        "is_new_user": is_new_user
    }
    
    # 如果是老用户，添加用户序号
    if not is_new_user and DEVELOPMENT_MODE:
        result["user_sequence"] = user_sequence
    elif not is_new_user and not DEVELOPMENT_MODE:
        # 生产模式：从数据库获取用户序号
        # TODO: 这里需要在生产模式实现
        pass
    
    print(f"📤 返回结果: {result}")
    return result

# Flask API路由

@app.route('/send-verification-code', methods=['POST'])
def api_send_verification_code():
    """发送验证码API"""
    print(f"📱 收到发送验证码请求 - Origin: {request.headers.get('Origin', 'Unknown')}")
    try:
        data = request.get_json()
        phone_number = data.get('phone_number')
        
        print(f"📱 手机号: {phone_number}")
        
        if not phone_number:
            return jsonify({"success": False, "message": "手机号不能为空"}), 400
        
        # 验证手机号格式
        if len(phone_number) != 11 or not phone_number.isdigit():
            return jsonify({"success": False, "message": "请输入正确的11位手机号码"}), 400
        
        result = send_verification_code(phone_number)
        
        if result["success"]:
            print(f"✅ 验证码发送成功: {phone_number}")
            return jsonify(result), 200
        else:
            print(f"❌ 验证码发送失败: {result['message']}")
            return jsonify(result), 500
            
    except Exception as e:
        print(f"❌ 服务器错误: {str(e)}")
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500

@app.route('/login-with-phone', methods=['POST'])
def api_login_with_phone():
    """验证码登录API"""
    try:
        data = request.get_json()
        phone_number = data.get('phone_number')
        verification_code = data.get('verification_code')
        
        if not phone_number or not verification_code:
            return jsonify({"success": False, "message": "手机号和验证码不能为空"}), 400
        
        # 验证手机号格式
        if len(phone_number) != 11 or not phone_number.isdigit():
            return jsonify({"success": False, "message": "请输入正确的11位手机号码"}), 400
        
        # 验证验证码格式
        if len(verification_code) != 6 or not verification_code.isdigit():
            return jsonify({"success": False, "message": "请输入6位数字验证码"}), 400
        
        result = login_with_phone(phone_number, verification_code)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500

def verify_invite_code_and_create_user(phone_number, invite_code):
    """验证邀请码并创建新用户"""
    print(f"🔑 验证邀请码: {phone_number} -> {invite_code}")
    
    if DEVELOPMENT_MODE:
        # 开发模式：检查内存中的邀请码
        print(f"📝 可用邀请码: {list(dev_invite_codes.keys())}")
        if invite_code not in dev_invite_codes:
            print(f"❌ 邀请码无效: {invite_code}")
            return {"success": False, "message": "邀请码无效"}
        
        # 创建新用户，分配用户序号
        global dev_user_sequence_counter
        dev_user_sequence_counter += 1
        user_sequence = dev_user_sequence_counter
        user_id = f"dev_user_{user_sequence}"
        
        dev_users[phone_number] = {
            'id': user_id,
            'phone_number': phone_number,
            'user_sequence': user_sequence,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'invite_code': invite_code
        }
        
        print(f"✅ 开发模式 - 新用户创建成功: {phone_number} (ID: {user_id}, 序号: {user_sequence})")
        return {
            "success": True,
            "message": "新用户注册成功",
            "user_id": user_id,
            "phone_number": phone_number,
            "user_sequence": user_sequence
        }
    else:
        # 生产模式：从Supabase验证邀请码
        invite_result = supabase.table('invite_codes').select('*').eq('code', invite_code).eq('used', False).execute()
        
        if not invite_result.data:
            return {"success": False, "message": "邀请码无效或已使用"}
        
        try:
            # 创建新用户
            new_user = supabase.table('users').insert({
                'phone_number': phone_number,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'invite_code': invite_code
            }).execute()
            
            # 标记邀请码为已使用
            supabase.table('invite_codes').update({'used': True, 'used_by': phone_number}).eq('code', invite_code).execute()
            
            return {
                "success": True,
                "message": "新用户注册成功",
                "user_id": new_user.data[0]['id'],
                "phone_number": phone_number
            }
        except Exception as e:
            return {"success": False, "message": f"用户创建失败: {str(e)}"}

def generate_order_number():
    """生成订单号"""
    today = datetime.now().strftime('%Y%m%d')
    if DEVELOPMENT_MODE:
        # 开发模式：简单计数
        daily_count = len([o for o in dev_orders.values() if o['order_date'] == datetime.now().date().isoformat()]) + 1
    else:
        # 生产模式：使用数据库函数
        return None  # 让数据库触发器自动生成
    
    return f"ORD{today}{daily_count:03d}"

def create_order(user_id, phone_number, form_data):
    """创建订单"""
    print(f"📋 创建订单: 用户 {user_id}")
    
    order_number = generate_order_number()
    current_time = datetime.now(timezone.utc)
    
    # 获取用户的下一个序号
    if DEVELOPMENT_MODE:
        # 开发模式：计算该用户的订单序号
        user_orders = [o for o in dev_orders.values() if o['user_id'] == user_id]
        user_sequence_number = len(user_orders) + 1
    else:
        # 生产模式：从数据库查询最大序号
        try:
            result = supabase.from_('orders').select('user_sequence_number').eq('user_id', user_id).order('user_sequence_number', desc=True).limit(1).execute()
            if result.data:
                user_sequence_number = result.data[0]['user_sequence_number'] + 1
            else:
                user_sequence_number = 1
        except:
            user_sequence_number = 1
    
    order_data = {
        'order_number': order_number,
        'user_id': user_id,
        'phone_number': phone_number,
        'status': 'draft',
        'order_date': current_time.date().isoformat(),
        'created_at': current_time.isoformat(),
        'delivery_address': form_data.get('address', ''),
        'dietary_restrictions': json.dumps(form_data.get('allergies', []), ensure_ascii=False),
        'food_preferences': json.dumps(form_data.get('preferences', []), ensure_ascii=False),
        'budget_amount': float(form_data.get('budget', 0)),
        'budget_currency': 'CNY',
        'user_sequence_number': user_sequence_number,
        'is_deleted': False
    }
    
    if DEVELOPMENT_MODE:
        # 开发模式：存储到内存
        order_id = str(uuid.uuid4())
        order_data['id'] = order_id
        dev_orders[order_id] = order_data
        
        print(f"✅ 开发模式 - 订单创建成功: {order_number} (用户序号: {user_sequence_number})")
        return {
            "success": True,
            "message": "订单创建成功",
            "order_id": order_id,
            "order_number": order_number,
            "user_sequence_number": user_sequence_number
        }
    else:
        # 生产模式：存储到Supabase
        try:
            result = supabase.table('orders').insert(order_data).execute()
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

def submit_order(order_id):
    """提交订单"""
    print(f"📤 提交订单: {order_id}")
    
    if DEVELOPMENT_MODE:
        # 开发模式
        if order_id not in dev_orders:
            return {"success": False, "message": "订单不存在"}
        
        dev_orders[order_id]['status'] = 'submitted'
        dev_orders[order_id]['submitted_at'] = datetime.now(timezone.utc).isoformat()
        dev_orders[order_id]['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        print(f"✅ 开发模式 - 订单提交成功: {dev_orders[order_id]['order_number']}")
        return {
            "success": True,
            "message": "订单提交成功",
            "order_number": dev_orders[order_id]['order_number']
        }
    else:
        # 生产模式
        try:
            result = supabase.table('orders').update({
                'status': 'submitted',
                'submitted_at': datetime.now(timezone.utc).isoformat()
            }).eq('id', order_id).execute()
            
            if not result.data:
                return {"success": False, "message": "订单不存在"}
            
            print(f"✅ 生产模式 - 订单提交成功: {result.data[0]['order_number']}")
            return {
                "success": True,
                "message": "订单提交成功",
                "order_number": result.data[0]['order_number']
            }
        except Exception as e:
            print(f"❌ 订单提交失败: {str(e)}")
            return {"success": False, "message": f"订单提交失败: {str(e)}"}

def update_order_feedback(order_id, rating, feedback):
    """更新订单反馈"""
    print(f"⭐ 更新订单反馈: {order_id} - 评分: {rating}")
    
    if rating < 1 or rating > 5:
        return {"success": False, "message": "评分必须在1-5之间"}
    
    feedback_data = {
        'user_rating': rating,
        'user_feedback': feedback,
        'feedback_submitted_at': datetime.now(timezone.utc).isoformat()
    }
    
    if DEVELOPMENT_MODE:
        # 开发模式
        if order_id not in dev_orders:
            return {"success": False, "message": "订单不存在"}
        
        dev_orders[order_id].update(feedback_data)
        dev_orders[order_id]['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        print(f"✅ 开发模式 - 反馈更新成功")
        return {"success": True, "message": "反馈提交成功"}
    else:
        # 生产模式
        try:
            result = supabase.table('orders').update(feedback_data).eq('id', order_id).execute()
            
            if not result.data:
                return {"success": False, "message": "订单不存在"}
            
            print(f"✅ 生产模式 - 反馈更新成功")
            return {"success": True, "message": "反馈提交成功"}
        except Exception as e:
            print(f"❌ 反馈更新失败: {str(e)}")
            return {"success": False, "message": f"反馈提交失败: {str(e)}"}

@app.route('/create-order', methods=['POST'])
def api_create_order():
    """创建订单API"""
    print(f"📋 收到创建订单请求")
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        phone_number = data.get('phone_number')
        form_data = data.get('form_data', {})
        
        print(f"📋 订单数据: 用户{user_id}, 地址{form_data.get('address', '')[:20]}...")
        
        if not user_id or not phone_number:
            return jsonify({"success": False, "message": "用户信息不能为空"}), 400
        
        if not form_data.get('address'):
            return jsonify({"success": False, "message": "配送地址不能为空"}), 400
        
        # 预算验证：允许免单订单的0金额，但不允许负数
        budget = form_data.get('budget', 0)
        try:
            budget_amount = float(budget)
            if budget_amount < 0:
                return jsonify({"success": False, "message": "预算金额无效"}), 400
        except (ValueError, TypeError):
            return jsonify({"success": False, "message": "预算金额无效"}), 400
        
        result = create_order(user_id, phone_number, form_data)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        print(f"❌ 创建订单API错误: {str(e)}")
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500

@app.route('/submit-order', methods=['POST'])
def api_submit_order():
    """提交订单API"""
    print(f"📤 收到提交订单请求")
    try:
        data = request.get_json()
        order_id = data.get('order_id')
        
        print(f"📤 提交订单: {order_id}")
        
        if not order_id:
            return jsonify({"success": False, "message": "订单ID不能为空"}), 400
        
        result = submit_order(order_id)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        print(f"❌ 提交订单API错误: {str(e)}")
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500

@app.route('/order-feedback', methods=['POST'])
def api_order_feedback():
    """订单反馈API"""
    print(f"⭐ 收到订单反馈请求")
    try:
        data = request.get_json()
        order_id = data.get('order_id')
        rating = data.get('rating')
        feedback = data.get('feedback', '')
        
        print(f"⭐ 订单反馈: {order_id} - 评分: {rating}")
        
        if not order_id:
            return jsonify({"success": False, "message": "订单ID不能为空"}), 400
        
        if not rating or not isinstance(rating, int):
            return jsonify({"success": False, "message": "评分不能为空且必须为整数"}), 400
        
        result = update_order_feedback(order_id, rating, feedback)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        print(f"❌ 订单反馈API错误: {str(e)}")
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500

@app.route('/orders/<user_id>', methods=['GET'])
def api_get_user_orders(user_id):
    """获取用户订单列表API"""
    print(f"📋 获取用户订单: {user_id}")
    try:
        if DEVELOPMENT_MODE:
            # 开发模式：从内存获取
            user_orders = [order for order in dev_orders.values() 
                          if order['user_id'] == user_id and not order.get('is_deleted', False)]
            user_orders.sort(key=lambda x: x['created_at'], reverse=True)
        else:
            # 生产模式：从Supabase获取
            result = supabase.table('orders').select('*').eq('user_id', user_id).eq('is_deleted', False).order('created_at', desc=True).execute()
            user_orders = result.data
        
        print(f"📋 找到 {len(user_orders)} 个订单")
        return jsonify({
            "success": True,
            "orders": user_orders,
            "count": len(user_orders)
        }), 200
        
    except Exception as e:
        print(f"❌ 获取订单API错误: {str(e)}")
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500

@app.route('/verify-invite-code', methods=['POST'])
def api_verify_invite_code():
    """验证邀请码并创建新用户API"""
    try:
        data = request.get_json()
        phone_number = data.get('phone_number')
        invite_code = data.get('invite_code')
        
        if not phone_number or not invite_code:
            return jsonify({"success": False, "message": "手机号和邀请码不能为空"}), 400
        
        # 验证手机号格式
        if len(phone_number) != 11 or not phone_number.isdigit():
            return jsonify({"success": False, "message": "请输入正确的11位手机号码"}), 400
        
        result = verify_invite_code_and_create_user(phone_number, invite_code)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({"success": False, "message": f"服务器错误: {str(e)}"}), 500

# ===== 免单相关API =====

# 开发模式的免单数据存储
dev_user_invite_stats = {}  # 用户邀请统计
dev_invite_progress = {}    # 邀请进度记录
dev_free_drinks_remaining = 100  # 全局免单剩余数量

@app.route('/get-user-invite-stats', methods=['GET'])
def api_get_user_invite_stats():
    """获取用户邀请统计API"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"success": False, "message": "用户ID不能为空"}), 400
        
        if DEVELOPMENT_MODE:
            # 开发模式：模拟邀请统计数据
            if user_id not in dev_user_invite_stats:
                # 模拟用户已邀请2人，可以获得免单
                dev_user_invite_stats[user_id] = {
                    'user_invite_code': f'USR{user_id[-6:]}',
                    'current_uses': 2,
                    'max_uses': 2,
                    'remaining_uses': 0,
                    'eligible_for_free_drink': True,
                    'free_drink_claimed': False
                }
            
            stats = dev_user_invite_stats[user_id]
            stats['free_drinks_remaining'] = dev_free_drinks_remaining
            
            return jsonify({
                "success": True,
                **stats
            }), 200
        else:
            # 生产模式：从Supabase查询
            # TODO: 实现Supabase查询逻辑
            return jsonify({"success": False, "message": "生产模式暂未实现"}), 501
            
    except Exception as e:
        print(f"❌ 获取邀请统计错误: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/get-invite-progress', methods=['GET'])
def api_get_invite_progress():
    """获取用户邀请进度API"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"success": False, "message": "用户ID不能为空"}), 400
        
        if DEVELOPMENT_MODE:
            # 开发模式：模拟邀请进度数据
            if user_id not in dev_invite_progress:
                # 模拟3个邀请记录
                dev_invite_progress[user_id] = {
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
            
            progress = dev_invite_progress[user_id]
            return jsonify({
                "success": True,
                **progress
            }), 200
        else:
            # 生产模式：从Supabase查询
            # TODO: 实现Supabase查询逻辑
            return jsonify({"success": False, "message": "生产模式暂未实现"}), 501
            
    except Exception as e:
        print(f"❌ 获取邀请进度错误: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/claim-free-drink', methods=['POST'])
def api_claim_free_drink():
    """领取免单奶茶API"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({"success": False, "message": "用户ID不能为空"}), 400
        
        if DEVELOPMENT_MODE:
            global dev_free_drinks_remaining
            
            # 检查用户是否有资格领取免单
            if user_id not in dev_user_invite_stats:
                return jsonify({"success": False, "message": "用户邀请信息不存在"}), 400
            
            user_stats = dev_user_invite_stats[user_id]
            
            if user_stats.get('free_drink_claimed', False):
                return jsonify({"success": False, "message": "您已经领取过免单奶茶"}), 400
            
            if not user_stats.get('eligible_for_free_drink', False):
                return jsonify({"success": False, "message": "邀请人数不足，无法领取免单"}), 400
            
            if dev_free_drinks_remaining <= 0:
                return jsonify({"success": False, "message": "免单名额已用完"}), 400
            
            # 领取免单
            user_stats['free_drink_claimed'] = True
            dev_free_drinks_remaining -= 1
            
            print(f"🎉 用户 {user_id} 成功领取免单，剩余名额: {dev_free_drinks_remaining}")
            
            return jsonify({
                "success": True,
                "message": "免单领取成功！",
                "free_drinks_remaining": dev_free_drinks_remaining
            }), 200
        else:
            # 生产模式：更新Supabase
            # TODO: 实现Supabase更新逻辑
            return jsonify({"success": False, "message": "生产模式暂未实现"}), 501
            
    except Exception as e:
        print(f"❌ 领取免单错误: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/free-drinks-remaining', methods=['GET'])
def api_free_drinks_remaining():
    """获取免单剩余数量API"""
    try:
        if DEVELOPMENT_MODE:
            global dev_free_drinks_remaining
            return jsonify({
                "success": True,
                "free_drinks_remaining": dev_free_drinks_remaining,
                "message": f"还有 {dev_free_drinks_remaining} 个免单名额"
            }), 200
        else:
            # 生产模式：从Supabase查询
            # TODO: 实现Supabase查询逻辑
            return jsonify({"success": False, "message": "生产模式暂未实现"}), 501
            
    except Exception as e:
        print(f"❌ 获取免单剩余数量错误: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查API"""
    return jsonify({
        "status": "healthy", 
        "message": "API服务正常运行",
        "cors_origins": ["http://localhost:8081", "http://localhost:3000", "http://localhost:19006"],
        "development_mode": DEVELOPMENT_MODE,
        "free_drinks_remaining": dev_free_drinks_remaining if DEVELOPMENT_MODE else "unknown"
    }), 200

if __name__ == '__main__':
    print("=== 手机验证码登录API服务 ===")
    print(f"🔧 开发模式: {DEVELOPMENT_MODE}")
    print("🌐 CORS已配置，支持以下源：")
    print("   - http://localhost:8081 (Expo开发服务器)")
    print("   - http://localhost:3000 (React开发服务器)")
    print("   - http://localhost:19006 (Expo Web)")
    print("📡 API服务启动中...")
    print("🔗 测试连接: http://localhost:5001/health")
    app.run(host='0.0.0.0', port=5001, debug=True)  # 改为5001端口