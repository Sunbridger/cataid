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

    if (req.method === 'PUT') {
      return handleUpdateCat(id, req.body, res);
    }

    if (req.method === 'DELETE') {
      return handleDeleteCat(id, res);
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

async function handleUpdateCat(id: string, body: any, res: VercelResponse) {
  if (isDemoMode || !supabase) {
    console.log('[Demo Mode] 无法更新猫咪状态');
    return res.status(200).json({ message: '演示模式下无法更新' });
  }

  const { status } = body;

  if (!status) {
    return res.status(400).json({ error: '缺少状态参数' });
  }

  // 先获取当前猫咪状态
  const { data: currentCat, error: fetchError } = await supabase
    .from('cats')
    .select('status')
    .eq('id', id)
    .single();

  if (fetchError || !currentCat) {
    console.error('获取猫咪当前状态失败:', fetchError);
    return res.status(404).json({ error: '猫咪不存在' });
  }

  const oldStatus = currentCat.status;
  const newStatus = status;

  // 数据一致性处理：如果从"已领养"改为"可领养"
  // 需要将该猫咪所有已通过的申请状态改为 rejected
  if (oldStatus === '已领养' && newStatus === '可领养') {
    console.log(`[状态变更] 猫咪 ${id} 从"已领养"改为"可领养",处理相关申请...`);

    // 查找该猫咪所有已通过的申请
    const { data: approvedApps, error: appsError } = await supabase
      .from('adoption_applications')
      .select('id, applicant_name')
      .eq('cat_id', id)
      .eq('status', 'approved');

    if (appsError) {
      console.error('查询已通过申请失败:', appsError);
    } else if (approvedApps && approvedApps.length > 0) {
      console.log(`找到 ${approvedApps.length} 个已通过的申请,将其标记为 rejected`);

      // 将所有已通过的申请改为 rejected
      const { error: updateAppsError } = await supabase
        .from('adoption_applications')
        .update({ status: 'rejected' })
        .eq('cat_id', id)
        .eq('status', 'approved');

      if (updateAppsError) {
        console.error('更新申请状态失败:', updateAppsError);
        return res.status(500).json({
          error: '更新失败：无法处理相关领养申请'
        });
      }

      console.log('已成功将相关申请状态更新为 rejected');
    }
  }

  // 更新猫咪状态
  const { data, error } = await supabase
    .from('cats')
    .update({ status: newStatus })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('更新猫咪状态失败:', error);
    return res.status(500).json({ error: '更新失败' });
  }

  // 返回更新结果,包含是否处理了相关申请的信息
  const message = oldStatus === '已领养' && newStatus === '可领养'
    ? '状态更新成功,已自动处理相关领养申请'
    : '更新成功';

  return res.status(200).json({ data, message });
}

async function handleDeleteCat(id: string, res: VercelResponse) {
  if (isDemoMode || !supabase) {
    console.log('[Demo Mode] 无法删除猫咪');
    return res.status(200).json({ message: '演示模式下无法删除' });
  }

  // 删除猫咪
  const { error } = await supabase
    .from('cats')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('删除猫咪失败:', error);
    return res.status(500).json({ error: '删除失败' });
  }

  return res.status(200).json({ message: '删除成功' });
}
