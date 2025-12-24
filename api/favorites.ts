/**
 * 收藏相关 API
 * 处理用户收藏猫咪的操作
 *
 * 路由：
 * - GET /api/favorites?userId=xxx - 获取用户收藏列表
 * - POST /api/favorites - 添加收藏
 * - DELETE /api/favorites?userId=xxx&catId=xxx - 删除收藏
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    // GET - 获取用户收藏列表
    if (req.method === 'GET') {
      const { userId } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: '缺少用户ID' });
      }

      if (isDemoMode || !supabase) {
        console.log('[Demo Mode] 返回模拟收藏列表');
        return res.status(200).json({ data: [] });
      }

      // 获取收藏列表，并关联猫咪信息
      const { data: favorites, error } = await supabase
        .from('favorites')
        .select(`
          id,
          cat_id,
          created_at,
          cats (
            id,
            name,
            age,
            gender,
            breed,
            description,
            image_url,
            tags,
            status,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取收藏列表失败:', error);
        return res.status(500).json({ error: '获取收藏列表失败' });
      }

      // 转换数据格式
      const result = favorites?.map(fav => {
        const catData = Array.isArray(fav.cats) ? fav.cats[0] : fav.cats;
        return {
          id: fav.id,
          catId: fav.cat_id,
          createdAt: fav.created_at,
          cat: catData ? {
            id: catData.id,
            name: catData.name,
            age: catData.age,
            gender: catData.gender,
            breed: catData.breed,
            description: catData.description,
            image_url: catData.image_url,
            tags: catData.tags,
            status: catData.status,
            created_at: catData.created_at,
          } : null,
        };
      }) || [];

      return res.status(200).json({ data: result });
    }

    // POST - 添加收藏
    if (req.method === 'POST') {
      const { userId, catId } = req.body;

      if (!userId || !catId) {
        return res.status(400).json({ error: '缺少必要参数' });
      }

      if (isDemoMode || !supabase) {
        console.log('[Demo Mode] 模拟添加收藏');
        return res.status(201).json({
          data: {
            id: 'demo_' + Date.now(),
            userId,
            catId,
            createdAt: new Date().toISOString(),
          }
        });
      }

      // 检查是否已收藏
      const { data: existing } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('cat_id', catId)
        .single();

      if (existing) {
        return res.status(400).json({ error: '已经收藏过了' });
      }

      // 添加收藏
      const { data: newFavorite, error } = await supabase
        .from('favorites')
        .insert([{
          user_id: userId,
          cat_id: catId,
        }])
        .select()
        .single();

      if (error) {
        console.error('添加收藏失败:', error);
        return res.status(500).json({ error: '添加收藏失败' });
      }

      return res.status(201).json({
        data: {
          id: newFavorite.id,
          userId: newFavorite.user_id,
          catId: newFavorite.cat_id,
          createdAt: newFavorite.created_at,
        }
      });
    }

    // DELETE - 删除收藏
    if (req.method === 'DELETE') {
      const { userId, catId } = req.query;

      if (!userId || !catId || typeof userId !== 'string' || typeof catId !== 'string') {
        return res.status(400).json({ error: '缺少必要参数' });
      }

      if (isDemoMode || !supabase) {
        console.log('[Demo Mode] 模拟删除收藏');
        return res.status(200).json({ message: '删除成功' });
      }

      // 删除收藏
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('cat_id', catId);

      if (error) {
        console.error('删除收藏失败:', error);
        return res.status(500).json({ error: '删除收藏失败' });
      }

      return res.status(200).json({ message: '删除成功' });
    }

    return res.status(405).json({ error: '方法不允许' });

  } catch (error) {
    console.error('Favorites API Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
}
