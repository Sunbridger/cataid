/**
 * 用户认证 API
 * 处理注册和登录
 *
 * 路由：POST /api/auth
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// 从环境变量获取配置
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// 简单的密码哈希（生产环境应使用 bcrypt）
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'cat_adoption_salt').digest('hex');
}

// 生成随机头像
function generateAvatar(nickname: string): string {
  const colors = ['f97316', 'ec4899', '8b5cf6', '06b6d4', '10b981', '3b82f6'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=${color}&color=fff&rounded=true&bold=true&size=128`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许' });
  }

  try {
    const { action, phone, email, password, nickname } = req.body;

    if (!action || !['register', 'login'].includes(action)) {
      return res.status(400).json({ error: '无效的操作' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: '密码至少需要6位' });
    }

    if (!phone && !email) {
      return res.status(400).json({ error: '请提供手机号或邮箱' });
    }

    // 演示模式
    if (isDemoMode || !supabase) {
      console.log('[Demo Mode] 认证操作:', action);
      const mockUser = {
        id: 'demo_' + Date.now(),
        phone: phone || null,
        email: email || null,
        nickname: nickname || '用户' + Math.floor(Math.random() * 10000),
        avatarUrl: generateAvatar(nickname || '用户'),
        status: 'active',
        role: 'user',
        favoriteCount: 0,
        commentCount: 0,
        adoptionCount: 0,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      return res.status(200).json({ data: mockUser, message: action === 'register' ? '注册成功' : '登录成功' });
    }

    const passwordHash = hashPassword(password);

    // 注册
    if (action === 'register') {
      if (!nickname || nickname.trim().length === 0) {
        return res.status(400).json({ error: '请输入昵称' });
      }

      // 检查是否已存在
      let existingUser = null;
      if (phone) {
        const { data } = await supabase.from('users').select('id').eq('phone', phone).single();
        existingUser = data;
      } else if (email) {
        const { data } = await supabase.from('users').select('id').eq('email', email).single();
        existingUser = data;
      }

      if (existingUser) {
        return res.status(400).json({ error: phone ? '该手机号已注册' : '该邮箱已注册' });
      }

      // 创建用户
      const avatarUrl = generateAvatar(nickname);
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{
          phone: phone || null,
          email: email || null,
          nickname: nickname.trim(),
          avatar_url: avatarUrl,
          password_hash: passwordHash,
          status: 'active',
          role: 'user',
        }])
        .select()
        .single();

      if (insertError) {
        console.error('注册失败:', insertError);
        return res.status(500).json({ error: '注册失败，请重试' });
      }

      // 转换字段名
      const user = {
        id: newUser.id,
        phone: newUser.phone,
        email: newUser.email,
        nickname: newUser.nickname,
        avatarUrl: newUser.avatar_url,
        bio: newUser.bio,
        gender: newUser.gender,
        status: newUser.status,
        role: newUser.role,
        favoriteCount: newUser.favorite_count || 0,
        commentCount: newUser.comment_count || 0,
        adoptionCount: newUser.adoption_count || 0,
        createdAt: newUser.created_at,
        lastLoginAt: newUser.last_login_at,
      };

      return res.status(201).json({ data: user, message: '注册成功' });
    }

    // 登录
    if (action === 'login') {
      let userData = null;

      if (phone) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('phone', phone)
          .eq('password_hash', passwordHash)
          .single();
        if (error || !data) {
          return res.status(401).json({ error: '手机号或密码错误' });
        }
        userData = data;
      } else if (email) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('password_hash', passwordHash)
          .single();
        if (error || !data) {
          return res.status(401).json({ error: '邮箱或密码错误' });
        }
        userData = data;
      }

      if (!userData) {
        return res.status(401).json({ error: '账号或密码错误' });
      }

      // 更新最后登录时间
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userData.id);

      // 转换字段名
      const user = {
        id: userData.id,
        phone: userData.phone,
        email: userData.email,
        nickname: userData.nickname,
        avatarUrl: userData.avatar_url,
        bio: userData.bio,
        gender: userData.gender,
        status: userData.status,
        role: userData.role,
        favoriteCount: userData.favorite_count || 0,
        commentCount: userData.comment_count || 0,
        adoptionCount: userData.adoption_count || 0,
        createdAt: userData.created_at,
        lastLoginAt: new Date().toISOString(),
      };

      return res.status(200).json({ data: user, message: '登录成功' });
    }

  } catch (error) {
    console.error('Auth API Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
}
