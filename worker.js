// Cloudflare Workers API for OmniLaze Universal
// 替代原来的Flask app.py

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS处理
    const corsHeaders = {
      'Access-Control-Allow-Origin': getAllowedOrigin(request, env),
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    };

    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      let response;
      
      // 路由匹配
      switch (url.pathname) {
        case '/health':
          response = await handleHealth(env);
          break;
        case '/send-verification-code':
          response = await handleSendVerificationCode(request, env);
          break;
        case '/login-with-phone':
          response = await handleLoginWithPhone(request, env);
          break;
        case '/verify-invite-code':
          response = await handleVerifyInviteCode(request, env);
          break;
        case '/create-order':
          response = await handleCreateOrder(request, env);
          break;
        case '/submit-order':
          response = await handleSubmitOrder(request, env);
          break;
        case '/order-feedback':
          response = await handleOrderFeedback(request, env);
          break;
        case '/get-user-invite-stats':
          response = await handleGetUserInviteStats(request, env);
          break;
        case '/get-invite-progress':
          response = await handleGetInviteProgress(request, env);
          break;
        case '/claim-free-drink':
          response = await handleClaimFreeDrink(request, env);
          break;
        case '/free-drinks-remaining':
          response = await handleFreeDrinksRemaining(request, env);
          break;
        case '/preferences':
          response = await handleSaveUserPreferences(request, env);
          break;
        default:
          if (url.pathname.startsWith('/orders/')) {
            const userId = url.pathname.split('/')[2];
            response = await handleGetUserOrders(userId, env);
          } else if (url.pathname.startsWith('/preferences/')) {
            const pathParts = url.pathname.split('/');
            const userId = pathParts[2];
            const action = pathParts[3];
            
            if (request.method === 'GET' && action === 'complete') {
              response = await handleCheckPreferencesCompleteness(userId, env);
            } else if (request.method === 'GET' && action === 'form-data') {
              response = await handleGetPreferencesAsFormData(userId, env);
            } else if (request.method === 'GET' && !action) {
              response = await handleGetUserPreferences(userId, env);
            } else if (request.method === 'PUT' && !action) {
              response = await handleUpdateUserPreferences(request, userId, env);
            } else if (request.method === 'DELETE' && !action) {
              response = await handleDeleteUserPreferences(userId, env);
            } else {
              response = new Response('Not Found', { status: 404 });
            }
          } else {
            response = new Response('Not Found', { status: 404 });
          }
          break;
      }

      // 添加CORS头到响应
      Object.keys(corsHeaders).forEach(key => {
        response.headers.set(key, corsHeaders[key]);
      });

      return response;
    } catch (error) {
      console.error('Worker error:', error);
      const errorResponse = new Response(
        JSON.stringify({ 
          success: false, 
          message: '服务器内部错误' 
        }), 
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        }
      );
      return errorResponse;
    }
  },
};

// 获取允许的CORS源
function getAllowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = JSON.parse(env.ALLOWED_ORIGINS || '["*"]');
  
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    return origin || '*';
  }
  
  return allowedOrigins[0] || '*';
}

// 健康检查端点
async function handleHealth(env) {
  return new Response(JSON.stringify({
    status: 'healthy',
    message: 'Cloudflare Workers API正常运行',
    environment: env.ENVIRONMENT || 'development',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// 生成6位验证码
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 生成用户邀请码（6位字母数字组合）
function generateUserInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 检查邀请码是否唯一并生成新的唯一邀请码
async function generateUniqueInviteCode(env) {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const code = generateUserInviteCode();
    
    // 检查是否与现有邀请码冲突
    const existingCode = await env.DB.prepare(`
      SELECT code FROM invite_codes WHERE code = ?
      UNION
      SELECT user_invite_code as code FROM users WHERE user_invite_code = ?
    `).bind(code, code).first();
    
    if (!existingCode) {
      return code;
    }
    
    attempts++;
  }
  
  throw new Error('无法生成唯一邀请码');
}

// 发送验证码
async function handleSendVerificationCode(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const data = await request.json();
  const phoneNumber = data.phone_number;

  if (!phoneNumber) {
    return new Response(JSON.stringify({
      success: false,
      message: '手机号不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 验证手机号格式
  if (phoneNumber.length !== 11 || !/^\d{11}$/.test(phoneNumber)) {
    return new Response(JSON.stringify({
      success: false,
      message: '请输入正确的11位手机号码'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

  // 存储验证码到KV
  const codeData = {
    code,
    expires_at: expiresAt.toISOString(),
    used: false,
    created_at: new Date().toISOString()
  };

  await env.VERIFICATION_KV.put(
    `verification:${phoneNumber}`, 
    JSON.stringify(codeData),
    { expirationTtl: 600 } // 10分钟TTL
  );

  // 开发模式：返回验证码，生产模式：发送短信
  if (env.ENVIRONMENT === 'development') {
    return new Response(JSON.stringify({
      success: true,
      message: '验证码发送成功（开发模式）',
      dev_code: code
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    // 生产模式：调用短信服务
    try {
      const smsResponse = await fetch(env.SPUG_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '验证码',
          code: code,
          targets: phoneNumber
        })
      });

      if (smsResponse.ok) {
        return new Response(JSON.stringify({
          success: true,
          message: '验证码发送成功'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        throw new Error('SMS service failed');
      }
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: '验证码发送失败'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}

// 验证码登录
async function handleLoginWithPhone(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const data = await request.json();
  const { phone_number: phoneNumber, verification_code: code } = data;

  if (!phoneNumber || !code) {
    return new Response(JSON.stringify({
      success: false,
      message: '手机号和验证码不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 验证格式
  if (phoneNumber.length !== 11 || !/^\d{11}$/.test(phoneNumber)) {
    return new Response(JSON.stringify({
      success: false,
      message: '请输入正确的11位手机号码'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (code.length !== 6 || !/^\d{6}$/.test(code)) {
    return new Response(JSON.stringify({
      success: false,
      message: '请输入6位数字验证码'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 从KV获取验证码
  const codeDataStr = await env.VERIFICATION_KV.get(`verification:${phoneNumber}`);
  if (!codeDataStr) {
    return new Response(JSON.stringify({
      success: false,
      message: '验证码不存在或已使用'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const codeData = JSON.parse(codeDataStr);
  
  // 检查是否已使用
  if (codeData.used) {
    return new Response(JSON.stringify({
      success: false,
      message: '验证码不存在或已使用'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 检查是否过期
  if (new Date() > new Date(codeData.expires_at)) {
    return new Response(JSON.stringify({
      success: false,
      message: '验证码已过期'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 验证验证码
  if (codeData.code !== code) {
    return new Response(JSON.stringify({
      success: false,
      message: '验证码错误'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 标记验证码为已使用
  codeData.used = true;
  await env.VERIFICATION_KV.put(
    `verification:${phoneNumber}`, 
    JSON.stringify(codeData),
    { expirationTtl: 60 } // 1分钟后删除
  );

  // 检查用户是否存在
  const userQuery = `SELECT * FROM users WHERE phone_number = ?`;
  const userResult = await env.DB.prepare(userQuery).bind(phoneNumber).first();

  let isNewUser = !userResult;
  let userId = userResult ? userResult.id : null;
  let userSequence = userResult ? userResult.user_sequence : null;

  const responseData = {
    success: true,
    message: isNewUser ? '新用户验证成功，请输入邀请码' : '验证成功',
    user_id: userId,
    phone_number: phoneNumber,
    is_new_user: isNewUser
  };

  // 为老用户添加序号
  if (!isNewUser && userSequence) {
    responseData.user_sequence = userSequence;
  }

  return new Response(JSON.stringify(responseData), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// 验证邀请码并创建新用户
async function handleVerifyInviteCode(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const data = await request.json();
  const { phone_number: phoneNumber, invite_code: inviteCode } = data;

  if (!phoneNumber || !inviteCode) {
    return new Response(JSON.stringify({
      success: false,
      message: '手机号和邀请码不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 验证邀请码 - 使用新的数据库结构
  const inviteQuery = `SELECT * FROM invite_codes WHERE code = ? AND current_uses < max_uses`;
  const inviteResult = await env.DB.prepare(inviteQuery).bind(inviteCode).first();

  if (!inviteResult) {
    return new Response(JSON.stringify({
      success: false,
      message: '邀请码无效或已达到使用次数限制'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 为新用户生成唯一邀请码
    const userInviteCode = await generateUniqueInviteCode(env);
    
    // 创建新用户（user_sequence会通过触发器自动分配）
    const userId = crypto.randomUUID();
    const createUserQuery = `
      INSERT INTO users (id, phone_number, created_at, invite_code, user_invite_code) 
      VALUES (?, ?, ?, ?, ?)
    `;
    await env.DB.prepare(createUserQuery)
      .bind(userId, phoneNumber, new Date().toISOString(), inviteCode, userInviteCode)
      .run();
    
    // 获取新创建用户的序号
    const getUserQuery = `SELECT user_sequence FROM users WHERE id = ?`;
    const newUser = await env.DB.prepare(getUserQuery).bind(userId).first();
    const userSequence = newUser?.user_sequence;

    // 为新用户创建邀请码记录
    const createUserInviteQuery = `
      INSERT INTO invite_codes (code, invite_type, max_uses, current_uses, owner_user_id, created_by, created_at)
      VALUES (?, 'user', 3, 0, ?, ?, ?)
    `;
    await env.DB.prepare(createUserInviteQuery)
      .bind(userInviteCode, userId, userId, new Date().toISOString())
      .run();

    // 更新邀请码使用次数
    const updateInviteQuery = `
      UPDATE invite_codes 
      SET current_uses = current_uses + 1, used_by = ?, used_at = ? 
      WHERE code = ?
    `;
    await env.DB.prepare(updateInviteQuery)
      .bind(phoneNumber, new Date().toISOString(), inviteCode)
      .run();

    // 创建邀请关系记录
    let inviterUserId = null;
    if (inviteResult.invite_type === 'user' && inviteResult.owner_user_id) {
      inviterUserId = inviteResult.owner_user_id;
    }
    
    if (inviterUserId) {
      const createInvitationQuery = `
        INSERT INTO invitations (inviter_user_id, invitee_user_id, invite_code, invitee_phone, invited_at)
        VALUES (?, ?, ?, ?, ?)
      `;
      await env.DB.prepare(createInvitationQuery)
        .bind(inviterUserId, userId, inviteCode, phoneNumber, new Date().toISOString())
        .run();
    }

    return new Response(JSON.stringify({
      success: true,
      message: '新用户注册成功',
      user_id: userId,
      phone_number: phoneNumber,
      user_invite_code: userInviteCode,
      user_sequence: userSequence
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '用户创建失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 生成订单号
function generateOrderNumber() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD${today}${randomPart}`;
}

// 创建订单
async function handleCreateOrder(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const data = await request.json();
  const { user_id: userId, phone_number: phoneNumber, form_data: formData } = data;

  if (!userId || !phoneNumber) {
    return new Response(JSON.stringify({
      success: false,
      message: '用户信息不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!formData.address) {
    return new Response(JSON.stringify({
      success: false,
      message: '配送地址不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 预算验证：允许免单订单的0金额，但不允许负数或非数字
  if (!formData.budget || isNaN(parseFloat(formData.budget)) || parseFloat(formData.budget) < 0) {
    return new Response(JSON.stringify({
      success: false,
      message: '预算金额无效'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const orderId = crypto.randomUUID();
    const orderNumber = generateOrderNumber();
    const now = new Date().toISOString();

    // 获取用户的注册序号
    const userSequenceQuery = `
      SELECT user_sequence
      FROM users 
      WHERE id = ?
    `;
    const sequenceResult = await env.DB.prepare(userSequenceQuery).bind(userId).first();
    const userSequenceNumber = sequenceResult?.user_sequence || null;

    // 创建包含食物类型的元数据
    const metadata = {
      foodType: formData.foodType || [],
      orderType: (formData.foodType && formData.foodType.includes('drink')) ? 'drink' : 'food'
    };

    const createOrderQuery = `
      INSERT INTO orders (
        id, order_number, user_id, phone_number, status, order_date, 
        created_at, delivery_address, dietary_restrictions, 
        food_preferences, budget_amount, budget_currency, metadata, 
        user_sequence_number, is_deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await env.DB.prepare(createOrderQuery).bind(
      orderId,
      orderNumber,
      userId,
      phoneNumber,
      'draft',
      new Date().toISOString().slice(0, 10),
      now,
      formData.address,
      JSON.stringify(formData.allergies || []),
      JSON.stringify(formData.preferences || []),
      parseFloat(formData.budget),
      'CNY',
      JSON.stringify(metadata),
      userSequenceNumber,
      0
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: '订单创建成功',
      order_id: orderId,
      order_number: orderNumber,
      user_sequence_number: userSequenceNumber
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Create order error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '订单创建失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 提交订单
async function handleSubmitOrder(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const data = await request.json();
  const { order_id: orderId } = data;

  if (!orderId) {
    return new Response(JSON.stringify({
      success: false,
      message: '订单ID不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const updateQuery = `
      UPDATE orders 
      SET status = ?, submitted_at = ?, updated_at = ? 
      WHERE id = ?
    `;
    
    const result = await env.DB.prepare(updateQuery)
      .bind('submitted', new Date().toISOString(), new Date().toISOString(), orderId)
      .run();

    if (result.changes === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: '订单不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取订单号
    const orderQuery = `SELECT order_number FROM orders WHERE id = ?`;
    const orderResult = await env.DB.prepare(orderQuery).bind(orderId).first();

    return new Response(JSON.stringify({
      success: true,
      message: '订单提交成功',
      order_number: orderResult.order_number
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Submit order error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '订单提交失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 订单反馈
async function handleOrderFeedback(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const data = await request.json();
  const { order_id: orderId, rating, feedback } = data;

  if (!orderId) {
    return new Response(JSON.stringify({
      success: false,
      message: '订单ID不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return new Response(JSON.stringify({
      success: false,
      message: '评分必须在1-5之间'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const updateQuery = `
      UPDATE orders 
      SET user_rating = ?, user_feedback = ?, feedback_submitted_at = ?, updated_at = ? 
      WHERE id = ?
    `;
    
    const result = await env.DB.prepare(updateQuery)
      .bind(rating, feedback || '', new Date().toISOString(), new Date().toISOString(), orderId)
      .run();

    if (result.changes === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: '订单不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: '反馈提交成功'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Order feedback error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '反馈提交失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 获取用户订单列表
async function handleGetUserOrders(userId, env) {
  if (!userId) {
    return new Response(JSON.stringify({
      success: false,
      message: '用户ID不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const ordersQuery = `
      SELECT * FROM orders 
      WHERE user_id = ? AND is_deleted = 0 
      ORDER BY user_sequence_number DESC, created_at DESC
    `;
    
    const result = await env.DB.prepare(ordersQuery).bind(userId).all();

    return new Response(JSON.stringify({
      success: true,
      orders: result.results || [],
      count: result.results ? result.results.length : 0
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '获取订单列表失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 获取用户邀请统计信息
async function handleGetUserInviteStats(request, env) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');

  if (!userId) {
    return new Response(JSON.stringify({
      success: false,
      message: '用户ID不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 获取用户的邀请码信息
    const userInviteQuery = `
      SELECT user_invite_code FROM users WHERE id = ?
    `;
    const userResult = await env.DB.prepare(userInviteQuery).bind(userId).first();

    if (!userResult || !userResult.user_invite_code) {
      return new Response(JSON.stringify({
        success: false,
        message: '用户邀请码不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取邀请码使用统计
    const inviteStatsQuery = `
      SELECT current_uses, max_uses FROM invite_codes 
      WHERE code = ? AND invite_type = 'user'
    `;
    const statsResult = await env.DB.prepare(inviteStatsQuery).bind(userResult.user_invite_code).first();

    const currentUses = statsResult?.current_uses || 0;
    const maxUses = statsResult?.max_uses || 2;
    const isEligibleForFreeDrink = currentUses >= maxUses;
    
    // 检查用户是否已经领取过免单
    const freeOrderQuery = `
      SELECT id FROM orders 
      WHERE user_id = ? AND budget_amount = 0 AND metadata LIKE '%"isFreeOrder":true%'
    `;
    const freeOrderResult = await env.DB.prepare(freeOrderQuery).bind(userId).first();
    const hasClaimedFreeDrink = !!freeOrderResult;
    
    // 🔧 获取全局免单剩余数量（实时计算）
    const globalFreeDrinksQuery = `
      SELECT total_quota, used_quota, remaining_quota
      FROM free_drink_config 
      WHERE id = 1
    `;
    const globalFreeDrinksResult = await env.DB.prepare(globalFreeDrinksQuery).first();
    
    // 实时统计实际使用的免单数量
    const actualUsedCountQuery = `
      SELECT COUNT(*) as actual_used_count
      FROM orders 
      WHERE budget_amount = 0 
        AND metadata LIKE '%"isFreeOrder":true%'
        AND is_deleted = 0
    `;
    const actualUsedResult = await env.DB.prepare(actualUsedCountQuery).first();
    const actualUsedCount = actualUsedResult?.actual_used_count || 0;
    
    // 计算全局免单剩余数量
    const globalTotalQuota = globalFreeDrinksResult?.total_quota || 100;
    const globalFreeDrinksRemaining = Math.max(0, globalTotalQuota - actualUsedCount);
    
    return new Response(JSON.stringify({
      success: true,
      user_invite_code: userResult.user_invite_code,
      current_uses: currentUses,
      max_uses: maxUses,
      remaining_uses: maxUses - currentUses,
      eligible_for_free_drink: isEligibleForFreeDrink,
      free_drink_claimed: hasClaimedFreeDrink,
      free_drinks_remaining: globalFreeDrinksRemaining, // 🔧 使用实时计算的全局免单剩余数量
      global_quota_info: {
        total_quota: globalTotalQuota,
        used_quota: actualUsedCount,
        remaining_quota: globalFreeDrinksRemaining
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get user invite stats error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '获取邀请统计失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 获取用户邀请进度（被邀请用户列表）
async function handleGetInviteProgress(request, env) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');

  if (!userId) {
    return new Response(JSON.stringify({
      success: false,
      message: '用户ID不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 获取该用户邀请的所有用户
    const invitationsQuery = `
      SELECT 
        i.invitee_phone,
        i.invited_at,
        u.phone_number as invitee_full_phone
      FROM invitations i
      LEFT JOIN users u ON i.invitee_user_id = u.id
      WHERE i.inviter_user_id = ?
      ORDER BY i.invited_at DESC
    `;
    
    const result = await env.DB.prepare(invitationsQuery).bind(userId).all();
    
    const invitations = (result.results || []).map(row => ({
      phone_number: row.invitee_phone,
      invited_at: row.invited_at,
      // 隐藏手机号中间4位数字
      masked_phone: row.invitee_phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    }));

    return new Response(JSON.stringify({
      success: true,
      invitations: invitations,
      total_invitations: invitations.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get invite progress error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '获取邀请进度失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 领取免单奶茶
async function handleClaimFreeDrink(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const data = await request.json();
  const { user_id: userId } = data;

  if (!userId) {
    return new Response(JSON.stringify({
      success: false,
      message: '用户ID不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 检查用户是否有资格领取免单
    const userQuery = `SELECT user_invite_code, phone_number FROM users WHERE id = ?`;
    const userResult = await env.DB.prepare(userQuery).bind(userId).first();

    if (!userResult || !userResult.user_invite_code) {
      return new Response(JSON.stringify({
        success: false,
        message: '用户不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查邀请统计
    const inviteStatsQuery = `
      SELECT current_uses, max_uses FROM invite_codes 
      WHERE code = ? AND invite_type = 'user'
    `;
    const statsResult = await env.DB.prepare(inviteStatsQuery).bind(userResult.user_invite_code).first();
    
    if (!statsResult || statsResult.current_uses < statsResult.max_uses) {
      return new Response(JSON.stringify({
        success: false,
        message: '邀请人数不足，无法领取免单'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 实现免单领取逻辑
    // 简化版本：在orders表中创建一个特殊的免单订单记录
    try {
      // 检查用户是否已经有免单订单
      const existingFreeOrderQuery = `
        SELECT id FROM orders 
        WHERE user_id = ? AND budget_amount = 0 AND metadata LIKE '%"isFreeOrder":true%'
      `;
      const existingOrder = await env.DB.prepare(existingFreeOrderQuery).bind(userId).first();
      
      if (existingOrder) {
        return new Response(JSON.stringify({
          success: false,
          message: '您已经领取过免单奶茶'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 创建免单订单记录
      const freeOrderId = crypto.randomUUID();
      const orderNumber = `FREE${Date.now()}`;
      const metadata = {
        isFreeOrder: true,
        claimedAt: new Date().toISOString(),
        orderType: 'drink'
      };

      // 获取用户的注册序号
      const userSequenceNumber = userResult.user_sequence || null;

      const createFreeOrderQuery = `
        INSERT INTO orders (
          id, order_number, user_id, phone_number, status, order_date,
          created_at, delivery_address, dietary_restrictions, food_preferences,
          budget_amount, budget_currency, metadata, user_sequence_number, is_deleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await env.DB.prepare(createFreeOrderQuery).bind(
        freeOrderId,
        orderNumber,
        userId,
        userResult.phone_number, // 使用用户的实际手机号
        'completed', // 使用有效的状态值
        new Date().toISOString().slice(0, 10),
        new Date().toISOString(),
        '', // 地址后续填写
        '[]', // 空的过敏信息
        '[]', // 空的偏好信息
        0, // 免单金额为0
        'CNY',
        JSON.stringify(metadata),
        userSequenceNumber,
        0
      ).run();

      // 🔧 实时计算剩余免单数量
      const globalFreeDrinksQuery = `
        SELECT total_quota FROM free_drink_config WHERE id = 1
      `;
      const globalFreeDrinksResult = await env.DB.prepare(globalFreeDrinksQuery).first();
      
      // 实时统计实际使用的免单数量（包括刚创建的这个）
      const actualUsedCountQuery = `
        SELECT COUNT(*) as actual_used_count
        FROM orders 
        WHERE budget_amount = 0 
          AND metadata LIKE '%"isFreeOrder":true%'
          AND is_deleted = 0
      `;
      const actualUsedResult = await env.DB.prepare(actualUsedCountQuery).first();
      const actualUsedCount = actualUsedResult?.actual_used_count || 0;
      
      // 计算全局免单剩余数量
      const globalTotalQuota = globalFreeDrinksResult?.total_quota || 100;
      const freeDrinksRemaining = Math.max(0, globalTotalQuota - actualUsedCount);

      return new Response(JSON.stringify({
        success: true,
        message: '免单领取成功！',
        free_order_id: freeOrderId,
        free_drinks_remaining: freeDrinksRemaining // 🔧 使用实时计算的剩余数量
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (dbError) {
      console.error('Database error in free drink claim:', dbError);
      console.error('Error details:', {
        userId,
        userResult: userResult ? { phone_number: userResult.phone_number, user_invite_code: userResult.user_invite_code } : null,
        dbError: dbError.message || dbError.toString()
      });
      return new Response(JSON.stringify({
        success: false,
        message: '免单领取失败，请稍后重试'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Claim free drink error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '领取免单失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 获取免单剩余数量
async function handleFreeDrinksRemaining(request, env) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // 🔧 从数据库获取实际的免单剩余数量
    // 1. 从 free_drink_config 表获取配置的总配额和已使用配额
    const configQuery = `
      SELECT total_quota, used_quota, remaining_quota 
      FROM free_drink_config 
      WHERE id = 1
    `;
    const configResult = await env.DB.prepare(configQuery).first();
    
    // 2. 如果配置表不存在或没有数据，使用默认值并初始化
    if (!configResult) {
      // 初始化配置
      const initQuery = `
        INSERT OR IGNORE INTO free_drink_config (id, total_quota, used_quota) 
        VALUES (1, 100, 0)
      `;
      await env.DB.prepare(initQuery).run();
      
      return new Response(JSON.stringify({
        success: true,
        free_drinks_remaining: 100,
        total_quota: 100,
        used_quota: 0,
        message: `还有 100 个免单名额`
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. 实时计算已使用的免单数量（从orders表统计）
    const usedCountQuery = `
      SELECT COUNT(*) as actual_used_count
      FROM orders 
      WHERE budget_amount = 0 
        AND metadata LIKE '%"isFreeOrder":true%'
        AND is_deleted = 0
    `;
    const usedResult = await env.DB.prepare(usedCountQuery).first();
    const actualUsedCount = usedResult?.actual_used_count || 0;

    // 4. 如果实际使用数量与配置不一致，更新配置表
    if (actualUsedCount !== configResult.used_quota) {
      const updateConfigQuery = `
        UPDATE free_drink_config 
        SET used_quota = ?, updated_at = datetime('now')
        WHERE id = 1
      `;
      await env.DB.prepare(updateConfigQuery).bind(actualUsedCount).run();
    }

    // 5. 计算剩余数量
    const totalQuota = configResult.total_quota;
    const freeDrinksRemaining = Math.max(0, totalQuota - actualUsedCount);
    
    return new Response(JSON.stringify({
      success: true,
      free_drinks_remaining: freeDrinksRemaining,
      total_quota: totalQuota,
      used_quota: actualUsedCount,
      message: `还有 ${freeDrinksRemaining} 个免单名额`,
      // 额外的调试信息
      config_used_quota: configResult.used_quota,
      actual_used_count: actualUsedCount
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get free drinks remaining error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '获取免单剩余数量失败',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 用户偏好设置处理函数

// 获取用户偏好设置
async function handleGetUserPreferences(userId, env) {
  if (!userId) {
    return new Response(JSON.stringify({
      success: false,
      message: '用户ID不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const query = `SELECT * FROM user_preferences WHERE user_id = ?`;
    const result = await env.DB.prepare(query).bind(userId).first();

    if (result) {
      // 转换JSON字段
      const preferences = {
        ...result,
        default_food_type: JSON.parse(result.default_food_type || '[]'),
        default_allergies: JSON.parse(result.default_allergies || '[]'),
        default_preferences: JSON.parse(result.default_preferences || '[]'),
        address_suggestion: result.address_suggestion ? JSON.parse(result.address_suggestion) : null
      };

      return new Response(JSON.stringify({
        success: true,
        preferences: preferences,
        has_preferences: true
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        success: true,
        preferences: null,
        has_preferences: false,
        message: '用户暂无保存的偏好设置'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Get user preferences error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '获取偏好设置失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 保存用户偏好设置
async function handleSaveUserPreferences(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const data = await request.json();
  const { user_id: userId, form_data: formData } = data;

  if (!userId || !formData) {
    return new Response(JSON.stringify({
      success: false,
      message: '用户ID和表单数据不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!formData.address) {
    return new Response(JSON.stringify({
      success: false,
      message: '配送地址不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const now = new Date().toISOString();
    
    // 构建偏好数据
    const preferences = {
      user_id: userId,
      default_address: formData.address || '',
      default_food_type: JSON.stringify(formData.selectedFoodType || []),
      default_allergies: JSON.stringify(formData.selectedAllergies || []),
      default_preferences: JSON.stringify(formData.selectedPreferences || []),
      default_budget: formData.budget || '',
      other_allergy_text: formData.otherAllergyText || '',
      other_preference_text: formData.otherPreferenceText || '',
      address_suggestion: formData.selectedAddressSuggestion ? JSON.stringify(formData.selectedAddressSuggestion) : '',
      created_at: now,
      updated_at: now
    };

    // 首先检查是否已存在记录
    const existingQuery = `SELECT id FROM user_preferences WHERE user_id = ?`;
    const existing = await env.DB.prepare(existingQuery).bind(userId).first();

    let query;
    let bindValues;
    
    if (existing) {
      // 更新现有记录
      query = `
        UPDATE user_preferences SET 
        default_address = ?, default_food_type = ?, default_allergies = ?, 
        default_preferences = ?, default_budget = ?, other_allergy_text = ?, 
        other_preference_text = ?, address_suggestion = ?, updated_at = ?
        WHERE user_id = ?
      `;
      bindValues = [
        preferences.default_address,
        preferences.default_food_type,
        preferences.default_allergies,
        preferences.default_preferences,
        preferences.default_budget,
        preferences.other_allergy_text,
        preferences.other_preference_text,
        preferences.address_suggestion,
        preferences.updated_at,
        preferences.user_id
      ];
    } else {
      // 插入新记录
      query = `
        INSERT INTO user_preferences (
          user_id, default_address, default_food_type, default_allergies, 
          default_preferences, default_budget, other_allergy_text, 
          other_preference_text, address_suggestion, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      bindValues = [
        preferences.user_id,
        preferences.default_address,
        preferences.default_food_type,
        preferences.default_allergies,
        preferences.default_preferences,
        preferences.default_budget,
        preferences.other_allergy_text,
        preferences.other_preference_text,
        preferences.address_suggestion,
        preferences.created_at,
        preferences.updated_at
      ];
    }

    await env.DB.prepare(query).bind(...bindValues).run();

    return new Response(JSON.stringify({
      success: true,
      message: '偏好设置保存成功',
      preferences: {
        ...preferences,
        default_food_type: JSON.parse(preferences.default_food_type),
        default_allergies: JSON.parse(preferences.default_allergies),
        default_preferences: JSON.parse(preferences.default_preferences),
        address_suggestion: preferences.address_suggestion ? JSON.parse(preferences.address_suggestion) : null
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Save user preferences error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '保存偏好设置失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 更新用户偏好设置
async function handleUpdateUserPreferences(request, userId, env) {
  if (request.method !== 'PUT') {
    return new Response('Method not allowed', { status: 405 });
  }

  const updates = await request.json();

  if (!userId) {
    return new Response(JSON.stringify({
      success: false,
      message: '用户ID不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!updates || Object.keys(updates).length === 0) {
    return new Response(JSON.stringify({
      success: false,
      message: '没有有效的更新数据'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 构建更新SQL
    const updateFields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== null && updates[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        
        // 处理JSON字段
        if (['default_food_type', 'default_allergies', 'default_preferences', 'address_suggestion'].includes(key)) {
          values.push(typeof updates[key] === 'string' ? updates[key] : JSON.stringify(updates[key]));
        } else {
          values.push(updates[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: '没有有效的更新数据'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    updateFields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(userId);

    const query = `UPDATE user_preferences SET ${updateFields.join(', ')} WHERE user_id = ?`;
    const result = await env.DB.prepare(query).bind(...values).run();

    if (result.changes === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: '用户偏好不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取更新后的数据
    const getQuery = `SELECT * FROM user_preferences WHERE user_id = ?`;
    const updatedResult = await env.DB.prepare(getQuery).bind(userId).first();

    const preferences = {
      ...updatedResult,
      default_food_type: JSON.parse(updatedResult.default_food_type || '[]'),
      default_allergies: JSON.parse(updatedResult.default_allergies || '[]'),
      default_preferences: JSON.parse(updatedResult.default_preferences || '[]'),
      address_suggestion: updatedResult.address_suggestion ? JSON.parse(updatedResult.address_suggestion) : null
    };

    return new Response(JSON.stringify({
      success: true,
      message: '偏好设置更新成功',
      preferences: preferences
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Update user preferences error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '更新偏好设置失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 删除用户偏好设置
async function handleDeleteUserPreferences(userId, env) {
  if (!userId) {
    return new Response(JSON.stringify({
      success: false,
      message: '用户ID不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const query = `DELETE FROM user_preferences WHERE user_id = ?`;
    const result = await env.DB.prepare(query).bind(userId).run();

    if (result.changes === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: '用户偏好不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: '偏好设置删除成功'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Delete user preferences error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '删除偏好设置失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 检查偏好完整性
async function handleCheckPreferencesCompleteness(userId, env) {
  if (!userId) {
    return new Response(JSON.stringify({
      success: false,
      message: '用户ID不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const query = `SELECT * FROM user_preferences WHERE user_id = ?`;
    const result = await env.DB.prepare(query).bind(userId).first();

    if (!result) {
      return new Response(JSON.stringify({
        success: true,
        has_preferences: false,
        is_complete: false,
        can_quick_order: false,
        message: '用户暂无保存的偏好设置'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查完整性
    const isComplete = !!(
      result.default_address &&
      result.default_budget &&
      result.default_food_type && JSON.parse(result.default_food_type).length > 0
    );

    const preferences = {
      ...result,
      default_food_type: JSON.parse(result.default_food_type || '[]'),
      default_allergies: JSON.parse(result.default_allergies || '[]'),
      default_preferences: JSON.parse(result.default_preferences || '[]'),
      address_suggestion: result.address_suggestion ? JSON.parse(result.address_suggestion) : null
    };

    return new Response(JSON.stringify({
      success: true,
      has_preferences: true,
      is_complete: isComplete,
      can_quick_order: isComplete,
      preferences: preferences
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Check preferences completeness error:', error);
    return new Response(JSON.stringify({
      success: false,
      has_preferences: false,
      is_complete: false,
      can_quick_order: false,
      message: '检查偏好完整性失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 获取偏好作为表单数据
async function handleGetPreferencesAsFormData(userId, env) {
  if (!userId) {
    return new Response(JSON.stringify({
      success: false,
      message: '用户ID不能为空'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const query = `SELECT * FROM user_preferences WHERE user_id = ?`;
    const result = await env.DB.prepare(query).bind(userId).first();

    if (!result) {
      return new Response(JSON.stringify({
        success: true,
        has_preferences: false,
        form_data: {
          address: '',
          selectedFoodType: [],
          selectedAllergies: [],
          selectedPreferences: [],
          budget: '',
          otherAllergyText: '',
          otherPreferenceText: '',
          selectedAddressSuggestion: null
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 转换为表单数据格式
    const formData = {
      address: result.default_address || '',
      selectedFoodType: JSON.parse(result.default_food_type || '[]'),
      selectedAllergies: JSON.parse(result.default_allergies || '[]'),
      selectedPreferences: JSON.parse(result.default_preferences || '[]'),
      budget: result.default_budget || '',
      otherAllergyText: result.other_allergy_text || '',
      otherPreferenceText: result.other_preference_text || '',
      selectedAddressSuggestion: result.address_suggestion ? JSON.parse(result.address_suggestion) : null
    };

    // 检查完整性
    const canQuickOrder = !!(
      formData.address &&
      formData.budget &&
      formData.selectedFoodType.length > 0
    );

    return new Response(JSON.stringify({
      success: true,
      has_preferences: true,
      form_data: formData,
      can_quick_order: canQuickOrder
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get preferences as form data error:', error);
    return new Response(JSON.stringify({
      success: false,
      has_preferences: false,
      form_data: {
        address: '',
        selectedFoodType: [],
        selectedAllergies: [],
        selectedPreferences: [],
        budget: '',
        otherAllergyText: '',
        otherPreferenceText: '',
        selectedAddressSuggestion: null
      },
      message: '获取偏好表单数据失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}