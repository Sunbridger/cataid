-- 为 cats 表添加 comment_count 字段
-- 用于存储每只猫咪的评论数量

-- 1. 添加字段
ALTER TABLE cats
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

COMMENT ON COLUMN cats.comment_count IS '评论数量';

-- 2. 初始化现有数据的评论数
UPDATE cats
SET comment_count = (
  SELECT COUNT(*)
  FROM comments
  WHERE comments.cat_id = cats.id
);

-- 3. 创建触发器函数 - 自动更新评论数
CREATE OR REPLACE FUNCTION update_cat_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 新增评论时，增加计数
    UPDATE cats
    SET comment_count = comment_count + 1
    WHERE id = NEW.cat_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 删除评论时，减少计数
    UPDATE cats
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.cat_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建触发器
DROP TRIGGER IF EXISTS trigger_update_cat_comment_count ON comments;
CREATE TRIGGER trigger_update_cat_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_cat_comment_count();

-- 5. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_cats_comment_count ON cats(comment_count DESC);
