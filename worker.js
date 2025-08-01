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
        default:
          if (url.pathname.startsWith('/orders/')) {
            const userId = url.pathname.split('/')[2];
            response = await handleGetUserOrders(userId, env);
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

    // 获取用户的下一个序号
    const userSequenceQuery = `
      SELECT COALESCE(MAX(user_sequence_number), 0) + 1 as next_sequence
      FROM orders 
      WHERE user_id = ?
    `;
    const sequenceResult = await env.DB.prepare(userSequenceQuery).bind(userId).first();
    const userSequenceNumber = sequenceResult?.next_sequence || 1;

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
    
    return new Response(JSON.stringify({
      success: true,
      user_invite_code: userResult.user_invite_code,
      current_uses: currentUses,
      max_uses: maxUses,
      remaining_uses: maxUses - currentUses,
      eligible_for_free_drink: isEligibleForFreeDrink,
      free_drink_claimed: hasClaimedFreeDrink,
      free_drinks_remaining: 100 // 简化版本，暂时硬编码
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

      // 获取用户的下一个序号
      const userSequenceQuery = `
        SELECT COALESCE(MAX(user_sequence_number), 0) + 1 as next_sequence
        FROM orders 
        WHERE user_id = ?
      `;
      const sequenceResult = await env.DB.prepare(userSequenceQuery).bind(userId).first();
      const userSequenceNumber = sequenceResult?.next_sequence || 1;

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

      return new Response(JSON.stringify({
        success: true,
        message: '免单领取成功！',
        free_order_id: freeOrderId,
        free_drinks_remaining: 99 // 简化版本，暂时硬编码
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
    // TODO: 从数据库获取实际的免单剩余数量
    // 目前返回硬编码值
    const freeDrinksRemaining = 100;
    
    return new Response(JSON.stringify({
      success: true,
      free_drinks_remaining: freeDrinksRemaining,
      message: `还有 ${freeDrinksRemaining} 个免单名额`
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get free drinks remaining error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '获取免单剩余数量失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}