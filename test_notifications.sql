-- 测试通知功能
-- 1. 查看当前通知表状态
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;

-- 2. 检查 RLS 状态
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'notifications';

-- 3. 查看当前 RLS 策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'notifications';

-- 4. 检查 Realtime 发布状态
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- 5. 插入测试通知（需要替换 user_id 为实际用户 ID）
-- INSERT INTO notifications (user_id, type, title, content, related_type)
-- VALUES ('your-user-id-here', 'test', '测试通知', '这是一条测试通知', 'test');
