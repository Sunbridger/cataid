-- 修复通知表的 RLS 策略
-- 问题：原策略使用 auth.uid()，但我们没有使用 Supabase Auth
-- 解决：禁用 RLS 或使用更宽松的策略

-- 方案1: 完全禁用 RLS（推荐，因为我们在 API 层做权限控制）
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 方案2: 如果需要保留 RLS，使用宽松策略（允许所有读取，仅 Service Role 可写入）
-- DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
-- DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
--
-- -- 允许所有人读取（Realtime 需要）
-- CREATE POLICY "Allow read access for realtime"
-- ON notifications FOR SELECT
-- USING (true);
--
-- -- 只允许 Service Role 写入（通过 API）
-- CREATE POLICY "Service role can insert"
-- ON notifications FOR INSERT
-- WITH CHECK (true);
--
-- CREATE POLICY "Service role can update"
-- ON notifications FOR UPDATE
-- USING (true);

-- 确保 Realtime 已启用
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
