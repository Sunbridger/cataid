-- 开启 RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 策略：允许用户查看自己的通知
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- 策略：允许用户更新自己的通知（标记已读）
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- 确保 Service Role 可以完全控制（默认是 bypass，这里无需额外策略，但为了确保 Realtime 正常工作）
-- Realtime 监听时会检查 SELECT 权限
