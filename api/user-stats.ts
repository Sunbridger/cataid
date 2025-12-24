/**
 * 用户统计数据 API
 * 获取用户的收藏、评论、申请数量
 *
 * 路由：GET /api/user-stats?userId=xxx
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// 从环境变量获取服务端密钥
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 判断是否为演示模式
const isDemoMode = !supabaseUrl || !supabaseServiceKey;

// 创建服务端 Supabase 客户端
const supabase = !isDemoMode
  ? createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  : null;

// 设置 CORS 头
function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: '方法不允许' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: '缺少用户ID' });
    }

    // 演示模式
    if (isDemoMode || !supabase) {
      console.log('[Demo Mode] 返回模拟统计数据');
      return res.status(200).json({
        data: {
          favoriteCount: Math.floor(Math.random() * 10),
          commentCount: Math.floor(Math.random() * 20),
          adoptionCount: Math.floor(Math.random() * 5),
        }
      });
    }

    // 并行查询三个统计数据
    const [favoritesResult, commentsResult, applicationsResult] = await Promise.all([
      // 收藏数（假设有 favorites 表）
      supabase
        .from('favorites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),

      // 评论数
      supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),

      // 申请数
      supabase
        .from('adoption_applications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ]);

    const stats = {
      favoriteCount: favoritesResult.count || 0,
      commentCount: commentsResult.count || 0,
      adoptionCount: applicationsResult.count || 0,
    };

    // 可选：更新用户表中的统计字段（缓存）
    await supabase
      .from('users')
      .update({
        favorite_count: stats.favoriteCount,
        comment_count: stats.commentCount,
        adoption_count: stats.adoptionCount,
      })
      .eq('id', userId);

    return res.status(200).json({ data: stats });

  } catch (error) {
    console.error('User Stats API Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
}
