/**
 * 用户交互相关 API 统一入口
 * 包含：收藏、评论点赞
 *
 * 路由：
 * - GET /api/interactions?type=favorites&userId=xxx - 获取用户收藏列表
 * - POST /api/interactions?type=favorites - 添加收藏
 * - DELETE /api/interactions?type=favorites&userId=xxx&catId=xxx - 删除收藏
 * - GET /api/interactions?type=likes&userId=xxx - 获取用户点赞列表
 * - POST /api/interactions?type=likes - 添加点赞
 * - DELETE /api/interactions?type=likes&userId=xxx&commentId=xxx - 删除点赞
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { type } = req.query;

  try {
    // ==================== 收藏相关 ====================
    if (type === 'favorites') {
      if (req.method === 'GET') {
        return handleGetFavorites(req, res);
      }
      if (req.method === 'POST') {
        return handleAddFavorite(req, res);
      }
      if (req.method === 'DELETE') {
        return handleRemoveFavorite(req, res);
      }
    }

    // ==================== 点赞相关 ====================
    if (type === 'likes') {
      if (req.method === 'GET') {
        return handleGetLikes(req, res);
      }
      if (req.method === 'POST') {
        return handleAddLike(req, res);
      }
      if (req.method === 'DELETE') {
        return handleRemoveLike(req, res);
      }
    }

    return res.status(400).json({ error: '无效的操作类型' });

  } catch (error) {
    console.error('Interactions API Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
}

// ==================== 收藏：获取列表 ====================
async function handleGetFavorites(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: '缺少用户ID' });
  }

  if (isDemoMode || !supabase) {
    return res.status(200).json({ data: [] });
  }

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
        is_vaccinated,
        is_sterilized,
        is_dewormed,
        is_stray,
        comment_count,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取收藏列表失败:', error);
    return res.status(500).json({ error: '获取收藏列表失败' });
  }

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
        is_vaccinated: catData.is_vaccinated,
        is_sterilized: catData.is_sterilized,
        is_dewormed: catData.is_dewormed,
        is_stray: catData.is_stray,
        commentCount: catData.comment_count,
        created_at: catData.created_at,
      } : null,
    };
  }) || [];

  return res.status(200).json({ data: result });
}

// ==================== 收藏：添加 ====================
async function handleAddFavorite(req: VercelRequest, res: VercelResponse) {
  const { userId, catId } = req.body;

  if (!userId || !catId) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  if (isDemoMode || !supabase) {
    return res.status(201).json({
      data: {
        id: 'demo_' + Date.now(),
        userId,
        catId,
        createdAt: new Date().toISOString(),
      }
    });
  }

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('cat_id', catId)
    .single();

  if (existing) {
    return res.status(400).json({ error: '已经收藏过了' });
  }

  const { data: newFavorite, error } = await supabase
    .from('favorites')
    .insert([{ user_id: userId, cat_id: catId }])
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

// ==================== 收藏：删除 ====================
async function handleRemoveFavorite(req: VercelRequest, res: VercelResponse) {
  const { userId, catId } = req.query;

  if (!userId || !catId || typeof userId !== 'string' || typeof catId !== 'string') {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  if (isDemoMode || !supabase) {
    return res.status(200).json({ message: '删除成功' });
  }

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

// ==================== 点赞：获取列表 ====================
async function handleGetLikes(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: '缺少用户ID' });
  }

  if (isDemoMode || !supabase) {
    return res.status(200).json({ data: [] });
  }

  const { data: likes, error } = await supabase
    .from('comment_likes')
    .select(`
      id,
      comment_id,
      created_at,
      comments (
        id,
        cat_id,
        user_id,
        parent_id,
        nickname,
        avatar_url,
        content,
        is_ai_reply,
        like_count,
        created_at,
        cats (
          id,
          name
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取点赞列表失败:', error);
    return res.status(500).json({ error: '获取点赞列表失败' });
  }

  const result = likes?.map(like => {
    const commentData = Array.isArray(like.comments) ? like.comments[0] : like.comments;
    const catData = commentData?.cats ? (Array.isArray(commentData.cats) ? commentData.cats[0] : commentData.cats) : null;

    return {
      id: like.id,
      commentId: like.comment_id,
      createdAt: like.created_at,
      comment: commentData ? {
        id: commentData.id,
        catId: commentData.cat_id,
        userId: commentData.user_id,
        parentId: commentData.parent_id,
        nickname: commentData.nickname,
        avatarUrl: commentData.avatar_url,
        content: commentData.content,
        isAiReply: commentData.is_ai_reply,
        likeCount: commentData.like_count,
        createdAt: commentData.created_at,
        catName: catData?.name || null,
      } : null,
    };
  }) || [];

  return res.status(200).json({ data: result });
}

// ==================== 点赞：添加 ====================
async function handleAddLike(req: VercelRequest, res: VercelResponse) {
  const { userId, commentId } = req.body;

  if (!userId || !commentId) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  if (isDemoMode || !supabase) {
    return res.status(201).json({
      data: {
        id: 'demo_' + Date.now(),
        userId,
        commentId,
        createdAt: new Date().toISOString(),
      }
    });
  }

  const { data: existing } = await supabase
    .from('comment_likes')
    .select('id')
    .eq('user_id', userId)
    .eq('comment_id', commentId)
    .single();

  if (existing) {
    return res.status(400).json({ error: '已经点赞过了' });
  }

  const { data: newLike, error } = await supabase
    .from('comment_likes')
    .insert([{ user_id: userId, comment_id: commentId }])
    .select()
    .single();

  if (error) {
    console.error('添加点赞失败:', error);
    return res.status(500).json({ error: '添加点赞失败' });
  }

  // 更新评论的点赞数
  await supabase.rpc('increment_comment_likes', { comment_id: commentId });

  return res.status(201).json({
    data: {
      id: newLike.id,
      userId: newLike.user_id,
      commentId: newLike.comment_id,
      createdAt: newLike.created_at,
    }
  });
}

// ==================== 点赞：删除 ====================
async function handleRemoveLike(req: VercelRequest, res: VercelResponse) {
  const { userId, commentId } = req.query;

  if (!userId || !commentId || typeof userId !== 'string' || typeof commentId !== 'string') {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  if (isDemoMode || !supabase) {
    return res.status(200).json({ message: '删除成功' });
  }

  const { error } = await supabase
    .from('comment_likes')
    .delete()
    .eq('user_id', userId)
    .eq('comment_id', commentId);

  if (error) {
    console.error('删除点赞失败:', error);
    return res.status(500).json({ error: '删除点赞失败' });
  }

  // 更新评论的点赞数
  await supabase.rpc('decrement_comment_likes', { comment_id: commentId });

  return res.status(200).json({ message: '删除成功' });
}
