-- 为 adoption_applications 表添加 reviewed_at 字段
-- 用于记录申请被审核的时间

ALTER TABLE adoption_applications
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN adoption_applications.reviewed_at IS '审核时间（通过或拒绝的时间）';

-- 为已审核的申请设置审核时间（使用创建时间作为默认值）
UPDATE adoption_applications
SET reviewed_at = created_at
WHERE status IN ('approved', 'rejected') AND reviewed_at IS NULL;
