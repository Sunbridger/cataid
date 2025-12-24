-- =====================================================
-- 猫猫领养平台 - 数据库迁移脚本
-- 用于创建收藏功能和用户统计功能所需的表和字段
-- =====================================================

-- 1. 创建 favorites 表（收藏表）
-- =====================================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  cat_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 添加外键约束
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_cat FOREIGN KEY (cat_id)
    REFERENCES cats(id) ON DELETE CASCADE,

  -- 确保同一用户不能重复收藏同一只猫
  CONSTRAINT unique_user_cat UNIQUE(user_id, cat_id)
);

-- 为 favorites 表创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_cat_id ON favorites(cat_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);

-- 添加表注释
COMMENT ON TABLE favorites IS '用户收藏表';
COMMENT ON COLUMN favorites.id IS '收藏记录ID';
COMMENT ON COLUMN favorites.user_id IS '用户ID';
COMMENT ON COLUMN favorites.cat_id IS '猫咪ID';
COMMENT ON COLUMN favorites.created_at IS '收藏时间';

-- =====================================================
-- 2. 为 users 表添加统计字段
-- =====================================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS adoption_count INTEGER DEFAULT 0;

-- 添加字段注释
COMMENT ON COLUMN users.favorite_count IS '收藏数量';
COMMENT ON COLUMN users.comment_count IS '评论数量';
COMMENT ON COLUMN users.adoption_count IS '申请数量';

-- =====================================================
-- 3. 创建触发器函数 - 自动更新用户收藏数
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 收藏时增加计数
    UPDATE users
    SET favorite_count = favorite_count + 1
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 取消收藏时减少计数
    UPDATE users
    SET favorite_count = GREATEST(favorite_count - 1, 0)
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_favorite_count ON favorites;
CREATE TRIGGER trigger_update_favorite_count
AFTER INSERT OR DELETE ON favorites
FOR EACH ROW
EXECUTE FUNCTION update_user_favorite_count();

-- =====================================================
-- 4. 创建触发器函数 - 自动更新用户评论数
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 发表评论时增加计数（排除AI回复）
    IF NEW.user_id IS NOT NULL AND NEW.is_ai_reply = FALSE THEN
      UPDATE users
      SET comment_count = comment_count + 1
      WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 删除评论时减少计数
    IF OLD.user_id IS NOT NULL AND OLD.is_ai_reply = FALSE THEN
      UPDATE users
      SET comment_count = GREATEST(comment_count - 1, 0)
      WHERE id = OLD.user_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_comment_count ON comments;
CREATE TRIGGER trigger_update_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_user_comment_count();

-- =====================================================
-- 5. 创建触发器函数 - 自动更新用户申请数
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_adoption_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 提交申请时增加计数
    IF NEW.user_id IS NOT NULL THEN
      UPDATE users
      SET adoption_count = adoption_count + 1
      WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 删除申请时减少计数
    IF OLD.user_id IS NOT NULL THEN
      UPDATE users
      SET adoption_count = GREATEST(adoption_count - 1, 0)
      WHERE id = OLD.user_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_adoption_count ON adoption_applications;
CREATE TRIGGER trigger_update_adoption_count
AFTER INSERT OR DELETE ON adoption_applications
FOR EACH ROW
EXECUTE FUNCTION update_user_adoption_count();

-- =====================================================
-- 6. 初始化现有用户的统计数据
-- =====================================================
-- 更新所有现有用户的收藏数
UPDATE users u
SET favorite_count = (
  SELECT COUNT(*)
  FROM favorites f
  WHERE f.user_id = u.id
);

-- 更新所有现有用户的评论数
UPDATE users u
SET comment_count = (
  SELECT COUNT(*)
  FROM comments c
  WHERE c.user_id = u.id AND c.is_ai_reply = FALSE
);

-- 更新所有现有用户的申请数
UPDATE users u
SET adoption_count = (
  SELECT COUNT(*)
  FROM adoption_applications a
  WHERE a.user_id = u.id
);

-- =====================================================
-- 7. 启用行级安全策略（RLS）
-- =====================================================
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- 允许用户查看自己的收藏
CREATE POLICY "Users can view their own favorites"
ON favorites FOR SELECT
USING (auth.uid() = user_id);

-- 允许用户添加收藏
CREATE POLICY "Users can add favorites"
ON favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 允许用户删除自己的收藏
CREATE POLICY "Users can delete their own favorites"
ON favorites FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- 8. 验证脚本执行结果
-- =====================================================
-- 查看 favorites 表结构
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'favorites'
ORDER BY ordinal_position;

-- 查看 users 表的统计字段
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('favorite_count', 'comment_count', 'adoption_count');

-- 查看触发器
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%favorite%'
   OR trigger_name LIKE '%comment%'
   OR trigger_name LIKE '%adoption%';

-- =====================================================
-- 执行完成提示
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ 数据库迁移完成！';
  RAISE NOTICE '📊 已创建 favorites 表';
  RAISE NOTICE '📊 已添加用户统计字段';
  RAISE NOTICE '⚡ 已创建自动更新触发器';
  RAISE NOTICE '🔒 已启用行级安全策略';
END $$;
