-- ================================================
-- 用户表 (users) - 猫猫领养平台用户数据
-- ================================================

-- 1. 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- 账号唯一标识：使用手机号或邮箱，也支持游客模式使用设备ID
  phone VARCHAR(20) UNIQUE,                         -- 手机号（可选）
  email VARCHAR(255) UNIQUE,                        -- 邮箱（可选）
  device_id VARCHAR(100) UNIQUE,                    -- 设备标识（游客模式）

  -- 用户基础信息
  nickname VARCHAR(50) NOT NULL,                    -- 昵称
  avatar_url VARCHAR(500),                          -- 头像URL
  bio TEXT,                                         -- 个人简介
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other', 'unknown')),

  -- 账号安全
  password_hash VARCHAR(255),                       -- 密码哈希（可选，游客无需密码）

  -- 账号状态
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'banned', 'deleted')),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'volunteer')),

  -- 统计数据
  favorite_count INTEGER DEFAULT 0,                 -- 收藏猫咪数
  comment_count INTEGER DEFAULT 0,                  -- 评论数
  adoption_count INTEGER DEFAULT 0,                 -- 领养申请数

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_device_id ON users(device_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- 3. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. 显示创建结果
SELECT 'users 表创建成功' AS result;
