
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 和 基础 Header
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!supabase) {
    return res.status(500).json({ error: '服务端 Supabase 未配置' });
  }

  // 通过 type 参数区分资源类型: 'sessions' | 'messages'
  const { type } = req.query;

  try {
    // ==========================================
    // 处理 Sessions 相关请求
    // ==========================================
    if (type === 'sessions') {

      // GET: 获取会话列表
      if (req.method === 'GET') {
        const { userId, role, limit } = req.query;

        let query = supabase
          .from('support_sessions')
          .select('*')
          .order('last_message_at', { ascending: false });

        // 权限/筛选逻辑
        if (role !== 'admin' && userId) {
          query = query.eq('user_id', userId);
        } else if (!userId && role !== 'admin') {
          return res.status(400).json({ error: '缺少 userId' });
        }

        // 支持 limit
        if (limit) {
          query = query.limit(parseInt(limit as string));
        }

        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json({ data });
      }

      // POST: 创建或获取活跃会话
      if (req.method === 'POST') {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: '缺少 userId' });

        // 1. 检查是否存在活跃会话
        const { data: existingSession, error: fetchError } = await supabase
          .from('support_sessions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
        if (existingSession) {
          return res.status(200).json({ data: existingSession, isNew: false });
        }

        // 2. 创建新会话
        const { data: newSession, error: createError } = await supabase
          .from('support_sessions')
          .insert([{ user_id: userId, status: 'active', unread_count: 0 }])
          .select().single();

        if (createError) throw createError;
        return res.status(201).json({ data: newSession, isNew: true });
      }

      // PATCH: 更新会话 (如标记已读)
      if (req.method === 'PATCH') {
        const { sessionId, action } = req.body;
        if (!sessionId) return res.status(400).json({ error: '缺少 sessionId' });

        if (action === 'read') {
          const { error } = await supabase
            .from('support_sessions')
            .update({ unread_count: 0 })
            .eq('id', sessionId);

          if (error) throw error;
          return res.status(200).json({ success: true });
        }
      }
    }

    // ==========================================
    // 处理 Messages 相关请求
    // ==========================================
    if (type === 'messages') {

      // GET: 获取消息历史
      if (req.method === 'GET') {
        const { sessionId, limit = '50' } = req.query;
        if (!sessionId) return res.status(400).json({ error: '缺少 sessionId' });

        const { data, error } = await supabase
          .from('support_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })
          .limit(parseInt(limit as string));

        if (error) throw error;
        return res.status(200).json({ data });
      }

      // POST: 发送消息
      if (req.method === 'POST') {
        const { sessionId, senderId, content, msgType = 'text' } = req.body;
        if (!sessionId || !senderId || !content) {
          return res.status(400).json({ error: '缺少必要参数' });
        }

        const { data, error } = await supabase
          .from('support_messages')
          .insert([{
            session_id: sessionId,
            sender_id: senderId,
            content,
            msg_type: msgType,
            is_read: false
          }])
          .select()
          .single();

        if (error) throw error;
        return res.status(201).json({ data });
      }
    }

    return res.status(400).json({ error: '无效请求: 缺少或错误的 type 参数' });

  } catch (error) {
    console.error('Support API Error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
