-- ===========================================
-- 猫猫领养平台 - Supabase 数据库初始化脚本
-- ===========================================
-- 在 Supabase Dashboard -> SQL Editor 中执行此脚本
-- https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql

-- 1. 创建猫咪表
CREATE TABLE IF NOT EXISTS cats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  age INTEGER NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female')),
  breed VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_stray BOOLEAN DEFAULT FALSE,
  is_sterilized BOOLEAN DEFAULT FALSE,
  is_dewormed BOOLEAN DEFAULT FALSE,
  is_vaccinated BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT '可领养' CHECK (status IN ('可领养', '已领养', '待定')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建领养申请表
CREATE TABLE IF NOT EXISTS adoption_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cat_id UUID REFERENCES cats(id) ON DELETE CASCADE,
  cat_name VARCHAR(100) NOT NULL,
  cat_image TEXT,
  applicant_name VARCHAR(100) NOT NULL,
  contact_info VARCHAR(100) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_cats_status ON cats(status);
CREATE INDEX IF NOT EXISTS idx_cats_created_at ON cats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_status ON adoption_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_cat_id ON adoption_applications(cat_id);

-- 4. 插入一些示例数据
INSERT INTO cats (name, age, gender, breed, description, image_url, tags, status, is_stray, is_sterilized, is_dewormed, is_vaccinated) VALUES
  ('小橘', 2, 'Female', '橘猫', '小橘是一只精力充沛的小老虎，喜欢追逐激光笔，也喜欢在阳光下打盹。她话很多，会经常跟你喵喵叫，分享她的一天。', 'https://picsum.photos/id/237/600/600', ARRAY['活泼好动', '话唠'], '可领养', true, true, true, true),
  ('黑夜', 5, 'Male', '孟买猫', '黑夜里的神秘影子……等等，其实只是一只想要温暖大腿的粘人黑猫。一开始可能有点害羞，但一旦信任你，呼噜声就像柴油引擎一样响。', 'https://picsum.photos/id/40/600/600', ARRAY['高冷安静', '粘人'], '可领养', false, true, true, true),
  ('雪球', 1, 'Male', '波斯混血', '雪球就是一团长了眼睛的云朵。他需要每天梳毛和膜拜。作为回报，他会提供柔软的头槌和踩奶服务。', 'https://picsum.photos/id/219/600/600', ARRAY['幼猫', '需要伺候'], '可领养', false, false, true, true),
  ('咪咪', 3, 'Female', '英短蓝猫', '咪咪是一只优雅的英短蓝猫，喜欢安静地趴在窗台上看风景。她性格温顺，非常适合公寓生活。', 'https://picsum.photos/id/244/600/600', ARRAY['高冷安静', '适合公寓'], '可领养', false, true, true, true),
  ('虎斑', 4, 'Male', '美短虎斑', '虎斑是一只活泼好动的美短虎斑，喜欢玩逗猫棒和纸团。他非常聪明，能学会开门和叫妈妈。', 'https://picsum.photos/id/169/600/600', ARRAY['活泼好动', '聪明'], '可领养', false, true, true, true);

-- 5. 显示创建结果
SELECT 'cats 表创建成功，已插入 ' || COUNT(*) || ' 条数据' AS result FROM cats;
