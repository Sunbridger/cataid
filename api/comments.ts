/**
 * 评论相关 API
 * 路由：GET/POST /api/comments
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 演示模式数据
let MOCK_COMMENTS = [
  {
    id: 'comment-1',
    cat_id: '1',
    parent_id: null,
    nickname: '爱猫人士',
    avatar_url: null,
    content: '这只小橘太可爱了！',
    is_ai_reply: false,
    like_count: 5,
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'comment-2',
    cat_id: '1',
    parent_id: 'comment-1',
    nickname: '小橘的小助手',
    avatar_url: null,
    content: '喵~ 谢谢你的喜欢！小橘也很想见到你呢～',
    is_ai_reply: true,
    like_count: 3,
    created_at: new Date(Date.now() - 3500000).toISOString()
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// 将前端 camelCase 转换为数据库 snake_case
function toSnakeCase(comment: NewCommentInput) {
  return {
    cat_id: comment.catId,
    user_id: comment.userId || null,
    parent_id: comment.parentId || null,
    nickname: comment.nickname,
    avatar_url: comment.avatarUrl || null,
    content: comment.content,
    is_ai_reply: comment.isAiReply || false
  };
}

// 将数据库 snake_case 转换为前端 camelCase
function toCamelCase(data: any) {
  if (!data) return data;

  const convert = (item: any) => ({
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
  });

  return Array.isArray(data) ? data.map(convert) : convert(data);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    // GET /api/comments?catId=xxx - 获取猫咪的所有评论
    if (req.method === 'GET') {
      const { catId } = req.query;
      if (!catId || typeof catId !== 'string') {
        return res.status(400).json({ error: '缺少 catId 参数' });
      }
      const data = await getCommentsByCatId(catId);
      return res.status(200).json({ data: toCamelCase(data) });
    }

    // POST /api/comments - 提交评论 或 点赞
    if (req.method === 'POST') {
      // 检查是否是点赞操作
      const action = req.query.action || req.body.action;
      if (action === 'like') {
        const commentId = (req.query.id as string) || req.body.id;
        if (!commentId) return res.status(400).json({ error: '缺少评论 ID' });

        await handleLike(commentId);
        return res.status(200).json({ success: true });
      }

      const data = await submitComment(req.body);
      return res.status(201).json({ data: toCamelCase(data) });
    }

    return res.status(405).json({ error: '方法不允许' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
}

async function getCommentsByCatId(catId: string) {
  if (isDemoMode || !supabase) {
    return MOCK_COMMENTS
      .filter(c => c.cat_id === catId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('cat_id', catId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

interface NewCommentInput {
  catId: string;
  userId?: string | null;
  parentId?: string | null;
  nickname: string;
  avatarUrl?: string | null;
  content: string;
  isAiReply?: boolean;
}

async function submitComment(comment: NewCommentInput) {
  if (isDemoMode || !supabase) {
    const newComment = {
      id: `comment-${Date.now()}`,
      ...toSnakeCase(comment),
      like_count: 0,
      created_at: new Date().toISOString()
    };
    MOCK_COMMENTS.push(newComment);
    return newComment;
  }

  const { data, error } = await supabase
    .from('comments')
    .insert([{ ...toSnakeCase(comment), like_count: 0 }])
    .select()
    .single();

  if (error) throw error;

  // 创建通知
  try {
    // 如果是回复评论,通知被回复的用户
    if (comment.parentId && !comment.isAiReply) {
      const { data: parentComment } = await supabase
        .from('comments')
        .select('user_id, nickname')
        .eq('id', comment.parentId)
        .single();

      if (parentComment?.user_id && parentComment.user_id !== comment.userId) {
        console.log(`[API] Creating reply notification for user ${parentComment.user_id}`);
        await supabase
          .from('notifications')
          .insert([{
            user_id: parentComment.user_id,
            type: 'comment_reply',
            title: '收到新回复',
            content: `${comment.nickname} 回复了你的评论: ${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}`,
            related_id: data.id,
            related_type: 'comment',
          }]);
      }
    }
    // 如果是新评论(非AI回复),通知猫咪的所有关注者
    else if (!comment.isAiReply && comment.userId) {
      // 获取猫咪信息
      const { data: catData } = await supabase
        .from('cats')
        .select('name')
        .eq('id', comment.catId)
        .single();

      if (catData) {
        console.log(`[API] Creating comment notification for cat ${comment.catId}`);
        // 这里可以扩展为通知所有收藏该猫咪的用户
        // 暂时只记录日志
      }
    }
  } catch (err) {
    console.error('[API] Error creating comment notification:', err);
  }

  return data;
}

async function handleLike(id: string) {
  if (isDemoMode || !supabase) {
    // 演示模式：更新 Mock
    const comment = MOCK_COMMENTS.find(c => c.id === id);
    if (comment) comment.like_count++;
    return;
  }

  // 尝试使用 RPC
  const { error } = await supabase.rpc('increment_like_count', { comment_id: id });

  if (error) {
    // 回退：先查后更
    const { data: dbComment, error: getError } = await supabase
      .from('comments')
      .select('like_count')
      .eq('id', id)
      .single();

    if (getError) throw getError;

    const { error: updateError } = await supabase
      .from('comments')
      .update({ like_count: (dbComment?.like_count || 0) + 1 })
      .eq('id', id);

    if (updateError) throw updateError;
  }
}
