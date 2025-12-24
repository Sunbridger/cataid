-- 在 Supabase SQL Editor 中运行此 SQL 语句来创建一个新的管理员用户
-- 请将 'your_hashed_password_here' 替换为您实际密码的哈希值（如果您手动管理密码）
-- 或者先在前端注册一个普通用户，然后使用下面的 UPDATE 语句将其提升为管理员

-- 方法 1: 直接插入一个新的管理员用户 (需要您自己生成密码哈希)
INSERT INTO users (
  phone,
  nickname,
  password_hash,
  role,
  avatar_url,
  bio,
  status
)
VALUES (
  '19999999999',           -- 账号/手机号
  '超级管理员',             -- 昵称
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',   -- 密码: 123456 (SHA-256)
  'admin',                 -- 关键：设置为 admin 角色
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
  '系统管理员账号',
  'active'
);

-- 方法 2 (推荐): 将已有的普通用户提升为管理员
-- 1. 先在 App 中注册一个普通账号
-- 2. 将下面的 '13800000000' 替换为您注册时的手机号，然后执行：
/*
UPDATE users
SET role = 'admin'
WHERE phone = '13800000000';
*/
