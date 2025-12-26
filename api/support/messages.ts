
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    // GET: 获取某会话的消息记录
    if (req.method === 'GET') {
      const { sessionId, limit = '50' } = req.query;

      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: '缺少 sessionId' });
      }

      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true }) // 前端聊天通常按时间正序
        .limit(parseInt(limit as string));

      if (error) throw error;
      return res.status(200).json({ data });
    }

    // POST: 发送消息
    if (req.method === 'POST') {
      const { sessionId, senderId, content, msgType = 'text' } = req.body;

      if (!sessionId || !senderId || !content) {
        return res.status(400).json({ error: '缺少必要参数 (sessionId, senderId, content)' });
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

    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (error) {
    console.error('Support Messages API Error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
