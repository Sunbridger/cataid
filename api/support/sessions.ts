
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 和 OPTIONS 处理
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!supabase) {
    return res.status(500).json({ error: '服务端 Supabase 未配置' });
  }

  try {
    // GET: 获取会话列表
    if (req.method === 'GET') {
      const { userId, role } = req.query;

      let query = supabase
        .from('support_sessions')
        .select('*')
        .order('last_message_at', { ascending: false });

      // 如果不是管理员，只能看自己的会话
      // 注意：role 参数由前端传递，存在安全隐患，生产环境应校验 Token
      if (role !== 'admin' && userId) {
        query = query.eq('user_id', userId);
      } else if (!userId && role !== 'admin') {
        return res.status(400).json({ error: '缺少 userId' });
      }

      const { data, error } = await query;

      if (error) throw error;
      return res.status(200).json({ data });
    }

    // POST: 创建或获取现有会话
    if (req.method === 'POST') {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: '缺少 userId' });
      }

      // 1. 检查是否存在活跃会话
      const { data: existingSession, error: fetchError } = await supabase
        .from('support_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is 'Row not found'
        throw fetchError;
      }

      if (existingSession) {
        return res.status(200).json({ data: existingSession, isNew: false });
      }

      // 2. 创建新会话
      const { data: newSession, error: createError } = await supabase
        .from('support_sessions')
        .insert([{
          user_id: userId,
          status: 'active',
          unread_count: 0
        }])
        .select()
        .single();

      if (createError) throw createError;

      return res.status(201).json({ data: newSession, isNew: true });
    }

    // PATCH: 更新会话 (标记已读)
    if (req.method === 'PATCH') {
      const { sessionId, action } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: '缺少 sessionId' });
      }

      if (action === 'read') {
        const { error } = await supabase
          .from('support_sessions')
          .update({ unread_count: 0 })
          .eq('id', sessionId);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (error) {
    console.error('Support Sessions API Error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
