"""
重构后的Flask应用主文件
采用模块化架构，功能清晰分离
"""
from flask import Flask
from flask_cors import CORS
from src import config, auth_bp, order_bp, invite_bp, common_bp

def create_app():
    """应用工厂函数"""
    app = Flask(__name__)
    
    # 配置CORS
    CORS(app, resources={
        r"/*": {
            "origins": config.CORS_ORIGINS,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    # 注册蓝图
    app.register_blueprint(auth_bp)
    app.register_blueprint(order_bp)
    app.register_blueprint(invite_bp)
    app.register_blueprint(common_bp)
    
    return app

def main():
    """主函数"""
    app = create_app()
    
    print("=== 手机验证码登录API服务 (重构版) ===")
    print(f"🔧 开发模式: {config.is_development_mode}")
    print("🌐 CORS已配置，支持以下源：")
    for origin in config.CORS_ORIGINS:
        print(f"   - {origin}")
    print("📡 API服务启动中...")
    print(f"🔗 测试连接: http://localhost:{config.API_PORT}/health")
    print("📋 API路由:")
    print("   认证相关:")
    print("     POST /send-verification-code")
    print("     POST /login-with-phone") 
    print("     POST /verify-invite-code")
    print("   订单相关:")
    print("     POST /create-order")
    print("     POST /submit-order")
    print("     POST /order-feedback")
    print("     GET  /orders/<user_id>")
    print("   邀请相关:")
    print("     GET  /get-user-invite-stats")
    print("     GET  /get-invite-progress")
    print("     POST /claim-free-drink")
    print("     GET  /free-drinks-remaining")
    print("   通用:")
    print("     GET  /health")
    
    app.run(
        host=config.API_HOST, 
        port=config.API_PORT, 
        debug=True
    )

if __name__ == '__main__':
    main()