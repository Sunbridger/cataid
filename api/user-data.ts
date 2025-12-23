/**
 * 用户数据统一接口
 * 路由：GET /api/user-data
 * 参数：userId, type ('comments' | 'applications')
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
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const { userId, type } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }

  if (isDemoMode || !supabase) {
    return res.status(200).json({ data: [] });
  }

  try {
    if (type === 'comments') {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

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
    }

    if (type === 'applications') {
      const { data, error } = await supabase
        .from('adoption_applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const applications = data?.map(item => ({
        id: item.id,
        catId: item.cat_id,
        userId: item.user_id,
        catName: item.cat_name,
        catImage: item.cat_image,
        applicantName: item.applicant_name,
        contactInfo: item.contact_info,
        reason: item.reason,
        status: item.status,
        createdAt: item.created_at
      })) || [];

      return res.status(200).json({ data: applications });
    }

    return res.status(400).json({ error: 'Invalid type parameter' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
}
