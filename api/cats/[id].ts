/**
 * 单只猫咪相关 API
 * 路由：GET/PUT /api/cats/[id]
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 演示模式数据
const MOCK_CATS = [
  {
    id: '1',
    name: '小橘 (Ginger)',
    age: 2,
    gender: 'Female',
    breed: '橘猫',
    description: '小橘是一只精力充沛的小老虎，喜欢追逐激光笔，也喜欢在阳光下打盹。',
    image_url: 'https://picsum.photos/id/237/600/600',
    tags: ['活泼好动', '话唠'],
    status: '可领养',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: '黑夜 (Midnight)',
    age: 5,
    gender: 'Male',
    breed: '孟买猫',
    description: '黑夜里的神秘影子，其实只是一只想要温暖大腿的粘人黑猫。',
    image_url: 'https://picsum.photos/id/40/600/600',
    tags: ['高冷安静', '老年猫'],
    status: '可领养',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    name: '雪球 (Snowball)',
    age: 1,
    gender: 'Male',
    breed: '波斯混血',
    description: '雪球就是一团长了眼睛的云朵。',
    image_url: 'https://picsum.photos/id/219/600/600',
    tags: ['幼猫', '需要伺候'],
    status: '已领养',
    created_at: new Date().toISOString()
  }
];

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

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: '无效的猫咪 ID' });
  }

  try {
    // GET /api/cats/[id] - 获取单只猫咪
    if (req.method === 'GET') {
      const data = await getCatById(id);
      if (!data) {
        return res.status(404).json({ error: '猫咪不存在' });
      }
      // CDN 缓存 30 秒，过期后 60 秒内可返回旧数据同时后台刷新
      res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
      return res.status(200).json({ data });
    }

    // PUT /api/cats/[id] - 更新猫咪状态
    if (req.method === 'PUT') {
      const { status } = req.body;
      await updateCatStatus(id, status);
      return res.status(200).json({ success: true });
    }

    // DELETE /api/cats/[id] - 删除猫咪
    if (req.method === 'DELETE') {
      await deleteCat(id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: '方法不允许' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
}

async function getCatById(id: string) {
  if (isDemoMode || !supabase) {
    return MOCK_CATS.find(c => c.id === id) || null;
  }

  const { data, error } = await supabase
    .from('cats')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

async function updateCatStatus(id: string, status: string) {
  if (isDemoMode || !supabase) {
    console.log(`[Demo Mode] 更新猫咪 ${id} 状态为 ${status}`);
    return;
  }

  const { error } = await supabase
    .from('cats')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

async function deleteCat(id: string) {
  if (isDemoMode || !supabase) {
    console.log(`[Demo Mode] 删除猫咪 ${id}`);
    const index = MOCK_CATS.findIndex(c => c.id === id);
    if (index > -1) {
      MOCK_CATS.splice(index, 1);
    }
    return;
  }

  const { error } = await supabase
    .from('cats')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
