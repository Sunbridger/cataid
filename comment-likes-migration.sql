-- =====================================================
-- 评论点赞功能 - 数据库迁移脚本
-- 创建点赞表和相关触发器
-- =====================================================

-- 1. 创建 comment_likes 表（评论点赞表）
-- =====================================================
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  comment_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 添加外键约束
  CONSTRAINT fk_comment_likes_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_likes_comment FOREIGN KEY (comment_id)
    REFERENCES comments(id) ON DELETE CASCADE,

  -- 确保同一用户不能重复点赞同一条评论
  CONSTRAINT unique_user_comment UNIQUE(user_id, comment_id)
);

-- 为 comment_likes 表创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_created_at ON comment_likes(created_at DESC);

-- 添加表注释
COMMENT ON TABLE comment_likes IS '评论点赞表';
COMMENT ON COLUMN comment_likes.id IS '点赞记录ID';
COMMENT ON COLUMN comment_likes.user_id IS '用户ID';
COMMENT ON COLUMN comment_likes.comment_id IS '评论ID';
COMMENT ON COLUMN comment_likes.created_at IS '点赞时间';

-- =====================================================
-- 2. 为 users 表添加点赞数统计字段
-- =====================================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

COMMENT ON COLUMN users.like_count IS '点赞数量（用户点赞的评论总数）';

-- =====================================================
-- 3. 创建存储过程 - 增加评论点赞数
-- =====================================================
CREATE OR REPLACE FUNCTION increment_comment_likes(comment_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE comments
  SET like_count = like_count + 1
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. 创建存储过程 - 减少评论点赞数
-- =====================================================
CREATE OR REPLACE FUNCTION decrement_comment_likes(comment_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE comments
  SET like_count = GREATEST(like_count - 1, 0)
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. 创建触发器函数 - 自动更新用户点赞数
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 点赞时增加计数
    UPDATE users
    SET like_count = like_count + 1
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 取消点赞时减少计数
    UPDATE users
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_like_count ON comment_likes;
CREATE TRIGGER trigger_update_like_count
AFTER INSERT OR DELETE ON comment_likes
FOR EACH ROW
EXECUTE FUNCTION update_user_like_count();

-- =====================================================
-- 6. 初始化现有用户的点赞数
-- =====================================================
-- 更新所有现有用户的点赞数
UPDATE users u
SET like_count = (
  SELECT COUNT(*)
  FROM comment_likes cl
  WHERE cl.user_id = u.id
);

-- =====================================================
-- 7. 启用行级安全策略（RLS）
-- =====================================================
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- 允许用户查看自己的点赞
CREATE POLICY "Users can view their own likes"
ON comment_likes FOR SELECT
USING (auth.uid() = user_id);

-- 允许用户添加点赞
CREATE POLICY "Users can add likes"
ON comment_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 允许用户删除自己的点赞
CREATE POLICY "Users can delete their own likes"
ON comment_likes FOR DELETE
USING (auth.uid() = user_id);

-- 允许所有人查看评论的点赞数（通过 comments 表）
-- 这个策略已经在 comments 表上设置

-- =====================================================
-- 8. 验证脚本执行结果
-- =====================================================
-- 查看 comment_likes 表结构
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'comment_likes'
ORDER BY ordinal_position;

-- 查看 users 表的点赞字段
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'like_count';

-- 查看触发器
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%like%';

-- 查看存储过程
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%comment_likes%'
  AND routine_schema = 'public';

-- =====================================================
-- 执行完成提示
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ 评论点赞功能数据库迁移完成！';
  RAISE NOTICE '📊 已创建 comment_likes 表';
  RAISE NOTICE '📊 已添加用户点赞数字段';
  RAISE NOTICE '⚡ 已创建自动更新触发器';
  RAISE NOTICE '⚡ 已创建存储过程';
  RAISE NOTICE '🔒 已启用行级安全策略';
END $$;
