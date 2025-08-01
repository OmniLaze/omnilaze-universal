// 环境变量配置 - Web环境直接配置
export const ENV_CONFIG = {
  // 高德地图API Key - 从环境变量获取
  AMAP_KEY: process.env.REACT_APP_AMAP_KEY || 'f5c712f69f486f3c20627dee943e0a32',
  
  // 后端API URL
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5001', // 修改为5001端口
};