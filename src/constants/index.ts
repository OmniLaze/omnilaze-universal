export const LAYOUT = {
  QUESTION_LINE_HEIGHT: 32,
  ANSWER_LINE_HEIGHT: 36,
  QUESTION_MARGIN: 53,
  ANSWER_MARGIN: 44,
  CURRENT_QUESTION_MARGIN: 80,
  INPUT_SECTION_HEIGHT: 100,
  BUTTON_HEIGHT: 50,
  AVATAR_SIZE: 32,
  ICON_SIZE: 20,
  BORDER_RADIUS: 12,
} as const;

export const TIMING = {
  TYPING_SPEED: 60,          // 主要问题的打字速度
  TYPING_SPEED_FAST: 40,     // 快速文本的打字速度（成功消息等）
  CURSOR_BLINK: 500,
  ANIMATION_DELAY: 300,
  SCROLL_DELAY: 400,
  EMOTION_DURATION: 150,
  SHAKE_DURATION: 100,
  COMPLETION_DELAY: 3000,
} as const;

export const COLORS = {
  PRIMARY: '#66CC99',
  BACKGROUND: '#F2F2F2',
  WHITE: '#FFFFFF',
  TEXT_PRIMARY: '#444444',
  TEXT_SECONDARY: '#6b7280',
  TEXT_MUTED: '#9ca3af',
  ERROR: '#ef4444',
  ERROR_BACKGROUND: '#FEF2F2',
  BORDER: '#F2F2F2',
  SHADOW: '#000',
} as const;

export const THEME_COLORS = [
  { r: 236, g: 72, b: 153 },   // 地址 - 粉色
  { r: 59, g: 130, b: 246 },   // 手机 - 蓝色  
  { r: 34, g: 197, b: 94 },    // 预算 - 绿色
  { r: 245, g: 101, b: 101 },  // 忌口 - 红色
  { r: 251, g: 146, b: 60 },   // 偏好 - 橙色
] as const;

export const BUDGET_OPTIONS = ['20', '30', '40', '50'] as const;

// 根据食物类型的不同预算选项
export const BUDGET_OPTIONS_FOOD = ['20', '30', '50', '100'] as const;
export const BUDGET_OPTIONS_DRINK = ['10', '15', '20', '30'] as const;

export const STEP_TITLES = [
  "配送地址",
  "忌口说明",
  "口味偏好", 
  "预算设置"
] as const;

export const VALIDATION = {
  MIN_ADDRESS_LENGTH: 5,
  MIN_BUDGET: 10,
  PHONE_REGEX: /^1[3-9]\d{9}$/,
  MAX_PHONE_LENGTH: 11,
  CHARACTERS_PER_LINE: 20,
  ANSWER_CHARACTERS_PER_LINE: 25,
} as const;

export const DEV_CONFIG = {
  // 开发模式：设置为true时跳过JWT认证
  SKIP_AUTH: true,
  // 开发模式下的模拟用户信息
  MOCK_USER: {
    user_id: 'dev_user_123',
    phone_number: '13800138000',
    is_new_user: false,
  },
} as const;