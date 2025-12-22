/**
 * 单个申请相关 API
 * 路由：GET/PUT /api/applications/[id]
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 演示模式数据
let MOCK_APPLICATIONS = [
  {
    id: 'app-1',
    catId: '2',
    catName: '黑夜 (Midnight)',
    catImage: 'https://picsum.photos/id/40/600/600',
    applicantName: '张三',
    contactInfo: '13800138000',
    reason: '家里有一只猫了，想找个伴。',
    status: 'pending',
    createdAt: new Date().toISOString()
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: '无效的申请 ID' });
  }

  try {
    // GET /api/applications/[id] - 获取单个申请
    if (req.method === 'GET') {
      const data = await getApplicationById(id);
      if (!data) {
        return res.status(404).json({ error: '申请不存在' });
      }
      return res.status(200).json({ data });
    }

    // PUT /api/applications/[id] - 审核申请
    if (req.method === 'PUT') {
      const { status, catId } = req.body;
      await reviewApplication(id, status, catId);
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

async function getApplicationById(id: string) {
  if (isDemoMode || !supabase) {
    return MOCK_APPLICATIONS.find(a => a.id === id) || null;
  }

  const { data, error } = await supabase
    .from('adoption_applications')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('获取申请失败:', error);
    return null;
  }
  return data;
}

async function reviewApplication(appId: string, status: string, catId: string) {
  if (isDemoMode || !supabase) {
    const app = MOCK_APPLICATIONS.find(a => a.id === appId);
    if (app) app.status = status;
    console.log(`[Demo Mode] 审核申请 ${appId} -> ${status}`);
    return;
  }

  const { error } = await supabase
    .from('adoption_applications')
    .update({ status })
    .eq('id', appId);

  if (error) throw error;

  // 联动更新猫咪状态
  if (status === 'approved') {
    await supabase.from('cats').update({ status: '已领养' }).eq('id', catId);
  } else if (status === 'rejected') {
    await supabase.from('cats').update({ status: '可领养' }).eq('id', catId);
  }
}
