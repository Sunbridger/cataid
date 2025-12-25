-- 诊断评论回复通知问题

-- 1. 查看最近的评论记录
SELECT
  id,
  cat_id,
  user_id,
  parent_id,
  nickname,
  content,
  is_ai_reply,
  created_at
FROM comments
ORDER BY created_at DESC
LIMIT 10;

-- 2. 查看最近的通知记录
SELECT
  id,
  user_id,
  type,
  title,
  content,
  is_read,
  related_id,
  related_type,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;

-- 3. 查找"七彩"用户的信息
SELECT
  id,
  nickname,
  phone,
  email
FROM users
WHERE nickname LIKE '%七彩%';

-- 4. 查找"小憩"用户的信息
SELECT
  id,
  nickname,
  phone,
  email
FROM users
WHERE nickname LIKE '%小憩%';

-- 5. 检查评论回复关系
SELECT
  c1.id as reply_id,
  c1.nickname as reply_by,
  c1.user_id as reply_user_id,
  c1.content as reply_content,
  c1.parent_id,
  c2.id as parent_id,
  c2.nickname as parent_by,
  c2.user_id as parent_user_id,
  c2.content as parent_content
FROM comments c1
LEFT JOIN comments c2 ON c1.parent_id = c2.id
WHERE c1.parent_id IS NOT NULL
ORDER BY c1.created_at DESC
LIMIT 10;

-- 6. 检查通知是否创建
SELECT
  n.id,
  n.user_id,
  u.nickname as notify_to,
  n.type,
  n.title,
  n.content,
  n.created_at
FROM notifications n
LEFT JOIN users u ON n.user_id = u.id
WHERE n.type = 'comment_reply'
ORDER BY n.created_at DESC
LIMIT 10;

-- 7. 检查 RLS 状态
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'notifications';

-- 8. 检查 Realtime 发布状态
SELECT
  pubname,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE tablename = 'notifications';
