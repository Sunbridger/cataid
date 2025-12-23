/**
 * 用户评论 API
 * 路由：GET /api/users/[id]/comments
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isDemoMode = !supabaseUrl || !supabaseServiceKey;

const supabase = !isDemoMode
  ? createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  : null;

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
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: '缺少用户ID' });
    }

    if (isDemoMode || !supabase) {
      // 演示模式返回空数据
      return res.status(200).json({ data: [] });
    }

    // 获取用户的评论
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 转换为 camelCase
    const comments = data?.map(item => ({
      id: item.id,
      catId: item.cat_id,
      userId: item.user_id,
      parentId: item.parent_id,
      nickname: item.nickname,
      avatarUrl: item.avatar_url,
      content: item.content,
      isAiReply: item.is_ai_reply,
      likeCount: item.like_count,
      createdAt: item.created_at
    })) || [];

    return res.status(200).json({ data: comments });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
}
