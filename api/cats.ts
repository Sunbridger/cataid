/**
 * 猫咪数据相关 API
 * 部署在 Vercel，使用 Service Role Key 访问 Supabase
 *
 * 路由：GET/POST /api/cats
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// 从环境变量获取服务端密钥（仅在服务端可见）
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
    description: '小橘是一只精力充沛的小老虎，喜欢追逐激光笔，也喜欢在阳光下打盹。她话很多，会经常跟你喵喵叫，分享她的一天。',
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
    description: '黑夜里的神秘影子……等等，其实只是一只想要温暖大腿的粘人黑猫。一开始可能有点害羞，但一旦信任你，呼噜声就像柴油引擎一样响。',
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
    description: '雪球就是一团长了眼睛的云朵。他需要每天梳毛和膜拜。作为回报，他会提供柔软的头槌和踩奶服务。',
    image_url: 'https://picsum.photos/id/219/600/600',
    tags: ['幼猫', '需要伺候'],
    status: '已领养',
    created_at: new Date().toISOString()
  }
];

// 判断是否为演示模式
const isDemoMode = !supabaseUrl || !supabaseServiceKey;

// 创建服务端 Supabase 客户端（带 Service Role Key）
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS
  setCorsHeaders(res);

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    // GET /api/cats - 获取所有猫咪
    if (req.method === 'GET') {
      const data = await getAllCats();
      // CDN 缓存 3 秒，过期后 10 秒内可返回旧数据同时后台刷新
      res.setHeader('Cache-Control', 's-maxage=3, stale-while-revalidate=10');
      return res.status(200).json({ data });
    }

    // POST /api/cats - 创建猫咪
    if (req.method === 'POST') {
      const data = await createCat(req.body);
      return res.status(201).json({ data });
    }

    return res.status(405).json({ error: '方法不允许' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
}

// ===== 数据库操作函数 =====

async function getAllCats() {
  if (isDemoMode || !supabase) {
    console.log('[Demo Mode] 返回模拟数据');
    // 演示模式下添加随机评论数
    return MOCK_CATS.map(cat => ({
      ...cat,
      commentCount: Math.floor(Math.random() * 50)
    }));
  }

  // 获取所有猫咪
  const { data: cats, error } = await supabase
    .from('cats')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // 获取每只猫的评论数
  const { data: commentCounts, error: countError } = await supabase
    .from('comments')
    .select('cat_id');

  if (countError) {
    console.error('获取评论数失败:', countError);
    return cats?.map(cat => ({ ...cat, commentCount: 0 })) || [];
  }

  // 统计每只猫的评论数
  const countMap = new Map<string, number>();
  if (commentCounts && commentCounts.length > 0) {
    commentCounts.forEach((c: { cat_id: string | null }) => {
      if (c.cat_id) {
        const catIdStr = String(c.cat_id);
        countMap.set(catIdStr, (countMap.get(catIdStr) || 0) + 1);
      }
    });
    console.log('[Debug] 评论数统计:', Object.fromEntries(countMap));
  }

  // 合并评论数到猫咪数据，并进行字段映射
  return cats?.map(cat => ({
    ...cat,
    userId: cat.user_id, // 将数据库的 user_id 映射为前端使用的 userId
    commentCount: countMap.get(String(cat.id)) || 0
  })) || [];
}

interface CreateCatInput {
  user_id?: string;
  name: string;
  age: number;
  gender: string;
  breed: string;
  description: string;
  tags: string[];
  image_url?: string;
  is_sterilized?: boolean;
  is_dewormed?: boolean;
  is_vaccinated?: boolean;
  is_stray?: boolean;
}

async function createCat(cat: CreateCatInput) {
  if (isDemoMode || !supabase) {
    console.log('[Demo Mode] 无法创建猫咪:', cat);
    return { ...cat, id: `mock-${Date.now()}`, created_at: new Date().toISOString(), status: '可领养' };
  }

  const imageUrl = cat.image_url || `https://picsum.photos/seed/${cat.name}/600/600`;

  const { data, error } = await supabase
    .from('cats')
    .insert([{
      user_id: cat.user_id || null,
      name: cat.name,
      age: cat.age,
      gender: cat.gender,
      breed: cat.breed,
      description: cat.description,
      image_url: imageUrl,
      tags: cat.tags,
      status: '可领养',
      is_sterilized: cat.is_sterilized ?? false,
      is_dewormed: cat.is_dewormed ?? false,
      is_vaccinated: cat.is_vaccinated ?? false,
      is_stray: cat.is_stray ?? false
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

