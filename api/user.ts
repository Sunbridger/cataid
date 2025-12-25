/**
 * 用户相关 API 统一入口
 * 包含：认证、用户统计、用户数据
 *
 * 路由：
 * - POST /api/user?action=register - 注册
 * - POST /api/user?action=login - 登录
 * - GET /api/user?action=stats&userId=xxx - 获取用户统计
 * - GET /api/user?action=comments&userId=xxx - 获取用户评论
 * - GET /api/user?action=applications&userId=xxx - 获取用户申请
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { action } = req.query;

  try {
    // ==================== 认证相关 ====================
    if (action === 'register' && req.method === 'POST') {
      return handleRegister(req, res);
    }

    if (action === 'login' && req.method === 'POST') {
      return handleLogin(req, res);
    }

    // ==================== 用户统计 ====================
    if (action === 'stats' && req.method === 'GET') {
      return handleGetStats(req, res);
    }

    // ==================== 用户数据 ====================
    if (action === 'comments' && req.method === 'GET') {
      return handleGetUserComments(req, res);
    }

    if (action === 'applications' && req.method === 'GET') {
      return handleGetUserApplications(req, res);
    }

    if (action === 'update' && req.method === 'POST') {
      return handleUpdateProfile(req, res);
    }

    // ==================== 通知相关 ====================
    if (action === 'notifications' && req.method === 'GET') {
      return handleGetNotifications(req, res);
    }

    if (action === 'unread_count' && req.method === 'GET') {
      return handleGetUnreadCount(req, res);
    }

    if (action === 'mark_read' && req.method === 'POST') {
      return handleMarkRead(req, res);
    }

    if (action === 'mark_all_read' && req.method === 'POST') {
      return handleMarkAllRead(req, res);
    }

    return res.status(400).json({ error: `无效的操作类型: ${action}` });

  } catch (error) {
    console.error('User API Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
}

// ==================== 注册 ====================
async function handleRegister(req: VercelRequest, res: VercelResponse) {
  const { phone, email, password, nickname, deviceId } = req.body;

  if (isDemoMode || !supabase) {
    return res.status(200).json({
      data: {
        id: 'demo_user_' + Date.now(),
        phone, email, deviceId, nickname,
        avatarUrl: null, bio: null, gender: 'unknown',
        status: 'active', role: 'user',
        favoriteCount: 0, commentCount: 0, adoptionCount: 0,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      }
    });
  }

  // 验证必填字段
  if ((!phone && !email && !deviceId) || !password || !nickname) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  // 检查是否已存在
  let existingQuery = supabase.from('users').select('id');
  if (phone) existingQuery = existingQuery.eq('phone', phone);
  else if (email) existingQuery = existingQuery.eq('email', email);
  else if (deviceId) existingQuery = existingQuery.eq('device_id', deviceId);

  const { data: existing } = await existingQuery.single();
  if (existing) {
    return res.status(400).json({ error: '用户已存在' });
  }

  // 密码哈希
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

  // 创建用户
  const { data: newUser, error } = await supabase
    .from('users')
    .insert([{
      phone, email, device_id: deviceId,
      password_hash: passwordHash,
      nickname,
      status: 'active',
      role: 'user',
      last_login_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    console.error('注册失败:', error);
    return res.status(500).json({ error: '注册失败' });
  }

  return res.status(201).json({
    data: {
      id: newUser.id,
      phone: newUser.phone,
      email: newUser.email,
      deviceId: newUser.device_id,
      nickname: newUser.nickname,
      avatarUrl: newUser.avatar_url,
      bio: newUser.bio,
      gender: newUser.gender || 'unknown',
      status: newUser.status,
      role: newUser.role,
      favoriteCount: newUser.favorite_count || 0,
      commentCount: newUser.comment_count || 0,
      adoptionCount: newUser.adoption_count || 0,
      createdAt: newUser.created_at,
      lastLoginAt: newUser.last_login_at,
    }
  });
}

// ==================== 登录 ====================
async function handleLogin(req: VercelRequest, res: VercelResponse) {
  const { phone, email, deviceId, password } = req.body;

  if (isDemoMode || !supabase) {
    return res.status(200).json({
      data: {
        id: 'demo_user_' + Date.now(),
        phone, email, deviceId,
        nickname: '演示用户',
        avatarUrl: null, bio: null, gender: 'unknown',
        status: 'active', role: 'user',
        favoriteCount: 5, commentCount: 10, adoptionCount: 2,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      }
    });
  }

  if ((!phone && !email && !deviceId) || !password) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  // 查询用户
  let query = supabase.from('users').select('*');
  if (phone) query = query.eq('phone', phone);
  else if (email) query = query.eq('email', email);
  else if (deviceId) query = query.eq('device_id', deviceId);

  const { data: userData, error } = await query.single();

  if (error || !userData) {
    return res.status(401).json({ error: '用户不存在' });
  }

  // 验证密码
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  if (userData.password_hash !== passwordHash) {
    return res.status(401).json({ error: '密码错误' });
  }

  // 更新最后登录时间
  await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userData.id);

  return res.status(200).json({
    data: {
      id: userData.id,
      phone: userData.phone,
      email: userData.email,
      deviceId: userData.device_id,
      nickname: userData.nickname,
      avatarUrl: userData.avatar_url,
      bio: userData.bio,
      gender: userData.gender || 'unknown',
      status: userData.status,
      role: userData.role,
      favoriteCount: userData.favorite_count || 0,
      commentCount: userData.comment_count || 0,
      adoptionCount: userData.adoption_count || 0,
      createdAt: userData.created_at,
      lastLoginAt: userData.last_login_at,
    }
  });
}

// ==================== 获取用户统计 ====================
async function handleGetStats(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: '缺少用户ID' });
  }

  if (isDemoMode || !supabase) {
    return res.status(200).json({
      data: {
        favoriteCount: Math.floor(Math.random() * 10),
        commentCount: Math.floor(Math.random() * 20),
        adoptionCount: Math.floor(Math.random() * 5),
        likeCount: Math.floor(Math.random() * 15),
      }
    });
  }

  const [favoritesResult, commentsResult, applicationsResult, likesResult] = await Promise.all([
    supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('adoption_applications').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('comment_likes').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ]);

  const stats = {
    favoriteCount: favoritesResult.count || 0,
    commentCount: commentsResult.count || 0,
    adoptionCount: applicationsResult.count || 0,
    likeCount: likesResult.count || 0,
  };

  await supabase
    .from('users')
    .update({
      favorite_count: stats.favoriteCount,
      comment_count: stats.commentCount,
      adoption_count: stats.adoptionCount,
      like_count: stats.likeCount,
    })
    .eq('id', userId);

  return res.status(200).json({ data: stats });
}

// ==================== 获取用户评论 ====================
async function handleGetUserComments(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: '缺少用户ID' });
  }

  if (isDemoMode || !supabase) {
    return res.status(200).json({ data: [] });
  }

  const { data: comments, error } = await supabase
    .from('comments')
    .select(`
      *,
      cats (
        id,
        name,
        image_url
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取用户评论失败:', error);
    return res.status(500).json({ error: '获取评论失败' });
  }

  const result = comments?.map(comment => {
    const catData = Array.isArray(comment.cats) ? comment.cats[0] : comment.cats;
    return {
      id: comment.id,
      catId: comment.cat_id,
      userId: comment.user_id,
      parentId: comment.parent_id,
      nickname: comment.nickname,
      avatarUrl: comment.avatar_url,
      content: comment.content,
      isAiReply: comment.is_ai_reply,
      likeCount: comment.like_count,
      createdAt: comment.created_at,
      catName: catData?.name || null,
      catImage: catData?.image_url?.split(',')[0] || null,
    };
  }) || [];

  return res.status(200).json({ data: result });
}

// ==================== 获取用户申请 ====================
async function handleGetUserApplications(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: '缺少用户ID' });
  }

  if (isDemoMode || !supabase) {
    return res.status(200).json({ data: [] });
  }

  const { data: applications, error } = await supabase
    .from('adoption_applications')
    .select('*, cats(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取用户申请失败:', error);
    return res.status(500).json({ error: '获取申请失败' });
  }

  const result = applications?.map(app => ({
    id: app.id,
    catId: app.cat_id,
    catName: app.cat_name,
    catImage: app.cat_image,
    userId: app.user_id,
    applicantName: app.applicant_name,
    contactInfo: app.contact_info,
    reason: app.reason,
    status: app.status,
    createdAt: app.created_at,
    reviewedAt: app.reviewed_at,
    cat: (app.cats) ? (() => {
      const catData = Array.isArray(app.cats) ? app.cats[0] : app.cats;
      if (!catData) return null;
      return {
        id: catData.id,
        name: catData.name,
        age: catData.age,
        gender: catData.gender,
        breed: catData.breed,
        description: catData.description,
        image_url: catData.image_url,
        tags: catData.tags || [],
        status: catData.status,
        created_at: catData.created_at,
        is_sterilized: catData.is_sterilized,
        is_dewormed: catData.is_dewormed,
        is_vaccinated: catData.is_vaccinated,
        is_stray: catData.is_stray,
      };
    })() : null
  })) || [];

  return res.status(200).json({ data: result });
}

// ==================== 更新用户信息 ====================
async function handleUpdateProfile(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.query;
  const { nickname, avatarUrl } = req.body;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: '缺少用户ID' });
  }

  if (isDemoMode || !supabase) {
    return res.status(200).json({
      data: {
        id: userId,
        nickname: nickname || '演示用户',
        avatarUrl: avatarUrl || null,
        status: 'active',
        role: 'user',
      }
    });
  }

  const updateData: any = {};
  if (nickname) updateData.nickname = nickname;
  if (avatarUrl) updateData.avatar_url = avatarUrl;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: '没有提供要更新的内容' });
  }

  const { data: updatedUser, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('更新用户信息失败:', error);
    return res.status(500).json({ error: '更新失败' });
  }

  return res.status(200).json({
    data: {
      id: updatedUser.id,
      phone: updatedUser.phone,
      email: updatedUser.email,
      deviceId: updatedUser.device_id,
      nickname: updatedUser.nickname,
      avatarUrl: updatedUser.avatar_url,
      bio: updatedUser.bio,
      gender: updatedUser.gender || 'unknown',
      status: updatedUser.status,
      role: updatedUser.role,
      favoriteCount: updatedUser.favorite_count || 0,
      commentCount: updatedUser.comment_count || 0,
      adoptionCount: updatedUser.adoption_count || 0,
      createdAt: updatedUser.created_at,
      lastLoginAt: updatedUser.last_login_at,
    }
  });
}

// ==================== 获取通知列表 ====================
async function handleGetNotifications(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: '缺少用户ID' });
  }

  if (isDemoMode || !supabase) {
    return res.status(200).json({ data: [] });
  }

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('获取通知列表失败:', error);
    return res.status(500).json({ error: '获取通知列表失败' });
  }

  const result = notifications?.map(n => ({
    id: n.id,
    userId: n.user_id,
    type: n.type,
    title: n.title,
    content: n.content,
    isRead: n.is_read,
    relatedId: n.related_id,
    relatedType: n.related_type,
    createdAt: n.created_at,
  })) || [];

  return res.status(200).json({ data: result });
}

// ==================== 获取未读通知数量 ====================
async function handleGetUnreadCount(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: '缺少用户ID' });
  }

  if (isDemoMode || !supabase) {
    return res.status(200).json({ data: { count: 0 } });
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('获取未读数量失败:', error);
    return res.status(500).json({ error: '获取未读数量失败' });
  }

  return res.status(200).json({ data: { count: count || 0 } });
}

// ==================== 标记单条已读 ====================
async function handleMarkRead(req: VercelRequest, res: VercelResponse) {
  const { notificationId, userId } = req.body;

  if (!notificationId || !userId) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  if (isDemoMode || !supabase) {
    return res.status(200).json({ message: '标记成功' });
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) {
    console.error('标记已读失败:', error);
    return res.status(500).json({ error: '标记已读失败' });
  }

  return res.status(200).json({ message: '标记成功' });
}

// ==================== 标记全部已读 ====================
async function handleMarkAllRead(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: '缺少用户ID' });
  }

  if (isDemoMode || !supabase) {
    return res.status(200).json({ message: '全部标记成功' });
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('标记全部已读失败:', error);
    return res.status(500).json({ error: '标记全部已读失败' });
  }

  return res.status(200).json({ message: '全部标记成功' });
}

// ==================== 创建通知（内部函数，供其他模块调用） ====================
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  content?: string,
  relatedId?: string,
  relatedType?: string
) {
  if (isDemoMode || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      user_id: userId,
      type,
      title,
      content,
      related_id: relatedId,
      related_type: relatedType,
    }])
    .select()
    .single();

  if (error) {
    console.error('创建通知失败:', error);
    return null;
  }

  return data;
}
