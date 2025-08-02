-- 用户偏好设置表
CREATE TABLE IF NOT EXISTS user_preferences (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL UNIQUE,
    default_address TEXT NOT NULL DEFAULT '',
    default_food_type TEXT DEFAULT '[]', -- JSON数组存储食物类型
    default_allergies TEXT DEFAULT '[]', -- JSON数组存储过敏信息
    default_preferences TEXT DEFAULT '[]', -- JSON数组存储口味偏好
    default_budget TEXT DEFAULT '',
    other_allergy_text TEXT DEFAULT '',
    other_preference_text TEXT DEFAULT '',
    address_suggestion TEXT DEFAULT '', -- JSON存储地址建议
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 创建更新时间触发器
CREATE TRIGGER IF NOT EXISTS update_user_preferences_updated_at
AFTER UPDATE ON user_preferences
BEGIN
    UPDATE user_preferences SET updated_at = datetime('now') WHERE id = NEW.id;
END;