-- 消息通知表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  related_id UUID,
  related_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 启用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
