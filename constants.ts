/**
 * 前端常量配置
 * 注意：Supabase 配置已移至服务端，前端不再直接连接数据库
 */

// API 基础路径（Vercel 部署时使用相对路径）
export const API_BASE_URL = '';

export const CAT_CATEGORIES = [
  '活泼好动',
  '高冷安静',
  '老年猫',
  '幼猫',
  '需特殊照顾',
  '不离不弃组合'
];

export const CAT_STATUSES = ['可领养', '已领养', '待定'] as const;