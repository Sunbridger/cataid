/**
 * 评论点赞相关 API
 * 处理用户点赞评论的操作
 *
 * 路由：
 * - GET /api/comment-likes?userId=xxx - 获取用户点赞列表
 * - POST /api/comment-likes - 添加点赞
 * - DELETE /api/comment-likes?userId=xxx&commentId=xxx - 删除点赞
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
    // GET - 获取用户点赞列表
    if (req.method === 'GET') {
      const { userId } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: '缺少用户ID' });
      }

      if (isDemoMode || !supabase) {
        console.log('[Demo Mode] 返回模拟点赞列表');
        return res.status(200).json({ data: [] });
      }

      // 获取点赞列表，并关联评论和猫咪信息
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

      // 转换数据格式
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

    // POST - 添加点赞
    if (req.method === 'POST') {
      const { userId, commentId } = req.body;

      if (!userId || !commentId) {
        return res.status(400).json({ error: '缺少必要参数' });
      }

      if (isDemoMode || !supabase) {
        console.log('[Demo Mode] 模拟添加点赞');
        return res.status(201).json({
          data: {
            id: 'demo_' + Date.now(),
            userId,
            commentId,
            createdAt: new Date().toISOString(),
          }
        });
      }

      // 检查是否已点赞
      const { data: existing } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('user_id', userId)
        .eq('comment_id', commentId)
        .single();

      if (existing) {
        return res.status(400).json({ error: '已经点赞过了' });
      }

      // 添加点赞
      const { data: newLike, error } = await supabase
        .from('comment_likes')
        .insert([{
          user_id: userId,
          comment_id: commentId,
        }])
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

    // DELETE - 删除点赞
    if (req.method === 'DELETE') {
      const { userId, commentId } = req.query;

      if (!userId || !commentId || typeof userId !== 'string' || typeof commentId !== 'string') {
        return res.status(400).json({ error: '缺少必要参数' });
      }

      if (isDemoMode || !supabase) {
        console.log('[Demo Mode] 模拟删除点赞');
        return res.status(200).json({ message: '删除成功' });
      }

      // 删除点赞
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

    return res.status(405).json({ error: '方法不允许' });

  } catch (error) {
    console.error('Comment Likes API Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
}
