// 环境变量配置 - Web环境直接配置
export const ENV_CONFIG = {
  // 高德地图API Key - 从环境变量获取
  AMAP_KEY: process.env.REACT_APP_AMAP_KEY || 'f5c712f69f486f3c20627dee943e0a32',
  
  // 后端API URL
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5001', // 修改为5001端口
};

// 开发环境下的调试信息
if (typeof window !== 'undefined' && (window as any).__DEV__ !== false) {
  console.log('=== 环境变量配置调试 ===');
  console.log('AMAP_KEY状态:', ENV_CONFIG.AMAP_KEY !== 'your_amap_key_here' ? '已配置' : '未配置');
  console.log('API_URL:', ENV_CONFIG.API_URL);
  console.log('========================');
}