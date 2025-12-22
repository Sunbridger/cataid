-- 添加新字段到 cats 表：是否流浪、是否绝育、是否驱虫、是否接种疫苗
ALTER TABLE cats
ADD COLUMN IF NOT EXISTS is_stray BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_sterilized BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_dewormed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_vaccinated BOOLEAN DEFAULT FALSE;

-- 更新现有所有数据默认为 false (如果之前没有默认值，这一步是保险起见，虽然上面 default false 已经处理了新数据)
-- UPDATE cats SET is_stray = false WHERE is_stray IS NULL;
-- UPDATE cats SET is_sterilized = false WHERE is_sterilized IS NULL;
-- UPDATE cats SET is_dewormed = false WHERE is_dewormed IS NULL;
-- UPDATE cats SET is_vaccinated = false WHERE is_vaccinated IS NULL;
