-- 客服系统数据库初始化脚本 (修正版)

-- 1. 创建枚举类型
DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('active', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('text', 'image', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. 创建会话表 support_sessions
CREATE TABLE IF NOT EXISTS support_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- 移除外键约束，因为 public.users 的 ID 类型可能不统一，且避免跨 schema 引用问题
    admin_id UUID,
    status session_status DEFAULT 'active',
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    unread_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建消息表 support_messages
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES support_sessions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    msg_type message_type DEFAULT 'text',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 索引
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON support_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON support_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_last_message_at ON support_sessions(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON support_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON support_messages(created_at);

-- 5. RLS 策略 (为 Demo 环境放宽限制)
-- 注意：在生产环境中，必须配合 Supabase Auth 使用严格的 RLS
ALTER TABLE support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- 允许匿名访问 (为了前端 Realtime 能收到推送)
CREATE POLICY "Allow public read sessions" ON support_sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read messages" ON support_messages FOR SELECT TO anon, authenticated USING (true);

-- 写入操作仍然建议通过 Service Role (后端 API) 进行，但如果前端直接写，也需要开放
CREATE POLICY "Allow public insert sessions" ON support_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public insert messages" ON support_messages FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow public update sessions" ON support_sessions FOR UPDATE TO anon, authenticated USING (true);


-- 6. 创建触发器函数：自动更新会话的 last_message
CREATE OR REPLACE FUNCTION update_session_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE support_sessions
    SET
        last_message = NEW.content,
        last_message_at = NEW.created_at,
        updated_at = NOW(),
        unread_count = unread_count + 1 -- 简单累加，实际逻辑应判断发送者
    WHERE id = NEW.session_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 绑定触发器
DROP TRIGGER IF EXISTS trigger_update_last_message ON support_messages;
CREATE TRIGGER trigger_update_last_message
AFTER INSERT ON support_messages
FOR EACH ROW
EXECUTE FUNCTION update_session_last_message();

-- 8. 开启 Realtime
-- 尝试添加表到 publication，如果已存在则忽略
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE support_sessions;
EXCEPTION
  WHEN duplicate_object THEN NULL; -- 忽略已添加错误
  WHEN undefined_object THEN NULL; -- 忽略 publication 不存在错误
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
