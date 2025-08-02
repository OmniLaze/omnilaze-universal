#!/bin/bash

# 后端重构部署脚本

echo "=== 后端重构部署 ==="

# 备份原始文件
if [ -f "app.py" ] && [ ! -f "app_original.py" ]; then
    echo "📦 备份原始app.py文件..."
    cp app.py app_original.py
    echo "✅ 原始文件已备份为 app_original.py"
fi

# 替换主文件
echo "🔄 部署重构后的应用..."
cp app_refactored.py app.py

echo "✅ 重构完成！"
echo ""
echo "📋 新的模块化结构:"
echo "   src/"
echo "   ├── config/          # 配置模块"
echo "   │   ├── settings.py  # 环境配置"
echo "   │   └── database.py  # 数据库连接"
echo "   ├── storage/         # 存储抽象层"
echo "   │   ├── base.py      # 存储接口定义"
echo "   │   ├── dev_storage.py      # 开发模式存储"
echo "   │   ├── production_storage.py # 生产模式存储"
echo "   │   └── factory.py   # 存储工厂"
echo "   ├── services/        # 业务逻辑层"
echo "   │   ├── auth_service.py     # 认证服务"
echo "   │   ├── order_service.py    # 订单服务"
echo "   │   └── invite_service.py   # 邀请服务"
echo "   ├── routes/          # API路由"
echo "   │   ├── auth_routes.py      # 认证路由"
echo "   │   ├── order_routes.py     # 订单路由"
echo "   │   ├── invite_routes.py    # 邀请路由"
echo "   │   └── common_routes.py    # 通用路由"
echo "   └── utils/           # 工具函数"
echo "       ├── verification.py     # 验证码工具"
echo "       ├── orders.py          # 订单工具"
echo "       ├── validation.py      # 输入验证"
echo "       └── sms.py             # 短信发送"
echo ""
echo "🚀 启动服务："
echo "   ./start_api.sh  # 或者"
echo "   uv run python app.py"
echo ""
echo "🔗 测试地址："
echo "   http://localhost:5001/health"