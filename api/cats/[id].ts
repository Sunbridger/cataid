/**
 * 单个猫咪详情 API
 * 路由：GET /api/cats/[id]
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: '缺少猫咪ID' });
  }

  try {
    if (req.method === 'GET') {
      return handleGetCat(id, res);
    }

    return res.status(405).json({ error: '方法不允许' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
}

async function handleGetCat(id: string, res: VercelResponse) {
  if (isDemoMode || !supabase) {
    return res.status(200).json({
      data: {
        id,
        name: '演示猫咪',
        age: 2,
        gender: 'Female',
        breed: '中华田园猫',
        description: '这是演示模式下的猫咪数据',
        image_url: 'https://picsum.photos/600/600',
        tags: ['可爱'],
        status: '可领养',
        created_at: new Date().toISOString(),
        is_sterilized: false,
        is_dewormed: false,
        is_vaccinated: false,
        is_stray: false,
        commentCount: 0,
      }
    });
  }

  // 获取猫咪详情
  const { data: cat, error } = await supabase
    .from('cats')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !cat) {
    console.error('获取猫咪详情失败:', error);
    return res.status(404).json({ error: '猫咪不存在' });
  }

  // 获取评论数
  const { count: commentCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('cat_id', id);

  return res.status(200).json({
    data: {
      ...cat,
      userId: cat.user_id, // 添加驼峰命名的 userId
      commentCount: commentCount || 0,
    }
  });
}
