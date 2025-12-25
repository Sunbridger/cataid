-- 检查猫咪表结构和数据
-- 1. 查看 cats 表的字段
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cats'
ORDER BY ordinal_position;

-- 2. 查看现有猫咪数据的 user_id 情况
SELECT
  id,
  name,
  user_id,
  created_at
FROM cats
ORDER BY created_at DESC
LIMIT 10;

-- 3. 如果 user_id 字段不存在，需要添加
-- ALTER TABLE cats ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- 4. 如果字段存在但数据为空，需要更新现有数据
-- 可以将所有猫咪关联到第一个用户（临时方案）
-- UPDATE cats
-- SET user_id = (SELECT id FROM users LIMIT 1)
-- WHERE user_id IS NULL;
