/**
 * API服务层 - 处理与后端验证码系统和地址搜索的通信
 * 
 * 功能模块：
 * 1. 手机验证码发送和验证
 * 2. 邀请码验证和用户创建  
 * 3. 高德地图地址搜索（核心功能）
 * 
 * 地址搜索优化策略：
 * - 至少4个汉字才开始搜索
 * - 500ms防抖延迟减少API调用
 * - 5分钟智能缓存机制
 * - 最多返回8个建议
 * - API失败时不显示模拟数据
 */

import { ENV_CONFIG } from '../config/env';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  user_id?: string;
  phone_number?: string;
  is_new_user?: boolean;
}

export interface InviteCodeResponse {
  success: boolean;
  message: string;
  user_id?: string;
  phone_number?: string;
  user_invite_code?: string;
}

export interface UserInviteStatsResponse {
  success: boolean;
  user_invite_code?: string;
  current_uses?: number;
  max_uses?: number;
  remaining_uses?: number;
  message?: string;
  // 免单相关
  eligible_for_free_drink?: boolean;
  free_drink_claimed?: boolean;
  free_drinks_remaining?: number; // 全局免单剩余数量
}

export interface InviteProgressResponse {
  success: boolean;
  invitations?: Array<{
    phone_number: string;
    invited_at: string;
    masked_phone: string;
  }>;
  total_invitations?: number;
  message?: string;
}
export interface OrderData {
  address: string;
  allergies: string[];
  preferences: string[];
  budget: string;
  foodType: string[];
  // 免单相关
  isFreeOrder?: boolean;
  freeOrderType?: 'invite_reward'; // 免单类型：邀请奖励
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  order_id?: string;
  order_number?: string;
  user_sequence_number?: number;
}

export interface SubmitOrderResponse {
  success: boolean;
  message: string;
  order_number?: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
}

export interface OrdersResponse {
  success: boolean;
  orders: any[];
  count: number;
}

// API 基础 URL 配置
const getApiBaseUrl = () => {
  // 生产环境：优先使用自定义域名
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'https://api.omnilaze.co';
  }
  
  // 开发环境：检查本地服务器或使用线上地址
  const localUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  
  // 如果设置了生产 URL 作为开发环境的备选，使用它
  if (localUrl.startsWith('https://') && (localUrl.includes('workers.dev') || localUrl.includes('omnilaze.co'))) {
    return localUrl;
  }
  
  return localUrl;
};

const API_BASE_URL = getApiBaseUrl();


/**
 * 发送手机验证码
 */
export async function sendVerificationCode(phoneNumber: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/send-verification-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: phoneNumber
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '发送验证码失败');
    }

    return data;
  } catch (error) {
    // 发送验证码失败时静默处理
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}

/**
 * 验证手机验证码并登录/注册
 */
export async function verifyCodeAndLogin(phoneNumber: string, code: string): Promise<VerificationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/login-with-phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        verification_code: code
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '验证码验证失败');
    }

    return data;
  } catch (error) {
    // 验证码验证失败时静默处理
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}

/**
 * 验证邀请码并创建新用户
 */
export async function verifyInviteCodeAndCreateUser(phoneNumber: string, inviteCode: string): Promise<InviteCodeResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/verify-invite-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        invite_code: inviteCode
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '邀请码验证失败');
    }

    return data;
  } catch (error) {
    // 邀请码验证失败时静默处理
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}

/**

 * 搜索地址建议 - 集成高德地图API
 * 优化策略：
 * 1. 最少输入4个汉字才开始搜索
 * 2. 防抖延迟500ms减少API调用
 * 3. 缓存搜索结果，相同关键词不重复调用
 * 4. 最多返回8个建议减少界面复杂度
 */

// 缓存搜索结果
const searchCache = new Map<string, { results: AddressSuggestion[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

export async function searchAddresses(query: string): Promise<AddressSearchResponse> {
  try {
    // 输入验证：至少4个汉字
    const trimmedQuery = query.trim();
    const chineseCharCount = (trimmedQuery.match(/[\u4e00-\u9fff]/g) || []).length;
    
    if (!trimmedQuery || chineseCharCount < 4) {
      return {
        success: true,
        message: '请至少输入4个汉字',
        predictions: []
      };
    }

    const keywords = trimmedQuery;

    // 检查缓存
    const cached = searchCache.get(keywords);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return {
        success: true,
        message: '搜索成功（缓存）',
        predictions: cached.results
      };
    }

    // 调用高德地图API
    // 使用配置的API Key
    const AMAP_KEY = ENV_CONFIG.AMAP_KEY;

    if (!AMAP_KEY) {
      // 高德地图API Key未配置，使用模拟数据
      return getFallbackResults(keywords);
    }

    const response = await fetch(`https://restapi.amap.com/v3/assistant/inputtips?key=${AMAP_KEY}&keywords=${encodeURIComponent(keywords)}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // 检查高德API返回状态
    if (data.status !== '1') {
      // 高德API返回错误，使用模拟数据
      return getFallbackResults(keywords);
    }

    // 转换高德API数据格式为我们的格式
    const suggestions: AddressSuggestion[] = (data.tips || [])
      .slice(0, 8) // 最多8个建议
      .map((tip: any, index: number) => ({
        place_id: tip.id || `${keywords}_${index}`,
        description: formatAddress(tip),
        structured_formatting: {
          main_text: tip.name || keywords,
          secondary_text: formatSecondaryText(tip)
        }
      }));

    // 缓存结果
    searchCache.set(keywords, {
      results: suggestions,
      timestamp: Date.now()
    });

    // 清理过期缓存（简单的内存管理）
    if (searchCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of searchCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          searchCache.delete(key);
        }
      }
    }

    return {
      success: true,
      message: '搜索成功',
      predictions: suggestions
    };

  } catch (error) {
    // 地址搜索失败时静默处理

    // 降级处理：返回模拟数据
    return getFallbackResults(query.trim());
  }
}

/**
 * 格式化地址显示
 */
function formatAddress(tip: any): string {
  const parts = [];

  if (tip.name) parts.push(tip.name);
  if (tip.address && tip.address !== tip.name) parts.push(tip.address);
  if (tip.district) parts.push(tip.district);

  return parts.join(', ') || tip.name || '未知地址';
}

/**
 * 格式化次要文本
 */
function formatSecondaryText(tip: any): string {
  const parts = [];

  if (tip.address && tip.address !== tip.name) parts.push(tip.address);
  if (tip.district) parts.push(tip.district);

  return parts.join(', ') || '详细地址';
}

/**
 * 降级处理：API失败时的模拟数据
 */
function getFallbackResults(keywords: string): AddressSearchResponse {
  // 不再提供模拟的"街道、大道"数据，直接返回空结果
  return {
    success: true,
    message: '搜索服务暂时不可用，请稍后重试',
    predictions: []
  };
}

/**
 * 创建订单
 */
export async function createOrder(userId: string, phoneNumber: string, formData: OrderData): Promise<CreateOrderResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        phone_number: phoneNumber,
        form_data: formData
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '创建订单失败');
    }

    return data;
  } catch (error) {
    // 创建订单失败时静默处理
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}

/**
 * 提交订单
 */
export async function submitOrder(orderId: string): Promise<SubmitOrderResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/submit-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: orderId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '提交订单失败');
    }

    return data;
  } catch (error) {
    // 提交订单失败时静默处理
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}

/**
 * 提交订单反馈
 */
export async function submitOrderFeedback(orderId: string, rating: number, feedback: string): Promise<FeedbackResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/order-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: orderId,
        rating: rating,
        feedback: feedback
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '提交反馈失败');
    }

    return data;
  } catch (error) {
    // 提交反馈失败时静默处理
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}

/**
 * 获取用户订单列表
 */
export async function getUserOrders(userId: string): Promise<OrdersResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '获取订单列表失败');
    }

    return data;
  } catch (error) {
    // 获取订单列表失败时静默处理
    return {
      success: false,
      orders: [],
      count: 0
    };
  }

}

/**
 * 获取用户邀请统计信息
 */
export async function getUserInviteStats(userId: string): Promise<UserInviteStatsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/get-user-invite-stats?user_id=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '获取邀请统计失败');
    }

    return data;
  } catch (error) {
    // 获取邀请统计失败时静默处理
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}

/**
 * 获取用户邀请进度
 */
export async function getInviteProgress(userId: string): Promise<InviteProgressResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/get-invite-progress?user_id=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '获取邀请进度失败');
    }

    return data;
  } catch (error) {
    // 获取邀请进度失败时静默处理
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}

/**
 * 免单相关接口
 */

export interface FreeDrinkResponse {
  success: boolean;
  message: string;
  free_drinks_remaining?: number;
}

/**
 * 领取免单奶茶资格
 */
export async function claimFreeDrink(userId: string): Promise<FreeDrinkResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/claim-free-drink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '领取免单失败');
    }

    return data;
  } catch (error) {
    // 领取免单失败时静默处理
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}

/**
 * 获取免单剩余数量
 */
export async function getFreeDrinksRemaining(): Promise<FreeDrinkResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/free-drinks-remaining`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '获取免单信息失败');
    }

    return data;
  } catch (error) {
    // 获取免单信息失败时静默处理
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}