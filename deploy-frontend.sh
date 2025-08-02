#!/bin/bash

echo "🎨 开始部署前端到 Cloudflare Pages"

# 检查是否安装了必要的依赖
if ! command -v npm &> /dev/null; then
    echo "❌ 未检测到 npm，请先安装 Node.js"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

# 构建前端项目（生产环境）
echo "🔨 构建前端项目（生产环境）..."
npm run build:production

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ 前端构建完成"

# 检查是否安装了 wrangler（用于 Pages 部署）
if command -v wrangler &> /dev/null; then
    echo "🚀 使用 Wrangler 部署到 Cloudflare Pages..."
    
    # 检查是否已登录
    if ! wrangler whoami &> /dev/null; then
        echo "🔐 请先登录 Cloudflare："
        wrangler login
        if [ $? -ne 0 ]; then
            echo "❌ 登录失败"
            exit 1
        fi
    fi
    
    # 部署到 Pages
    echo "📤 正在部署到 Cloudflare Pages..."
    wrangler pages deploy dist --project-name=omnilaze-universal-frontend --commit-dirty=true
    
    if [ $? -eq 0 ]; then
        echo "🎉 前端部署成功！"
        echo ""
        echo "🌐 你的应用地址："
        echo "https://omnilaze-universal-frontend.pages.dev"
        echo "或者："
        echo "https://order.omnilaze.co (如果已配置自定义域名)"
    else
        echo "❌ Pages 部署失败，请检查错误信息"
        echo "💡 你也可以手动上传 dist/ 目录到 Cloudflare Pages"
    fi
else
    echo "💡 构建完成！请将 dist/ 目录上传到 Cloudflare Pages"
    echo ""
    echo "📁 构建文件位置: ./dist/"
    echo ""
    echo "🌐 Cloudflare Pages 部署步骤："
    echo "1. 登录 Cloudflare Dashboard"
    echo "2. 进入 Pages 页面"  
    echo "3. 创建新项目或更新现有项目"
    echo "4. 上传 dist/ 目录中的所有文件"
    echo "5. 设置构建输出目录为根目录"
fi

echo ""
echo "🔧 环境变量配置："
echo "REACT_APP_API_URL=https://omnilaze-universal-api.stevenxxzg.workers.dev"
echo ""
echo "📱 测试你的应用："
echo "访问部署后的 URL 并测试完整的注册和下单流程"