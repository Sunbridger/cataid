/**
 * 评论点赞 API
 * 路由：POST /api/comments/[id]/like
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许' });
  }

  try {
    // 从路径中提取评论 ID
    // URL 格式: /api/comments/[id]/like
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: '缺少评论 ID' });
    }

    if (isDemoMode || !supabase) {
      // 演示模式：直接返回成功
      return res.status(200).json({ success: true });
    }

    // 增加点赞数
    const { data, error } = await supabase
      .rpc('increment_like_count', { comment_id: id });

    if (error) {
      // 如果没有 RPC 函数，使用传统方式
      const { data: comment, error: getError } = await supabase
        .from('comments')
        .select('like_count')
        .eq('id', id)
        .single();

      if (getError) throw getError;

      const { error: updateError } = await supabase
        .from('comments')
        .update({ like_count: (comment?.like_count || 0) + 1 })
        .eq('id', id);

      if (updateError) throw updateError;
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
}
