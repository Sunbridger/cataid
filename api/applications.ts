/**
 * 领养申请相关 API
 * 部署在 Vercel，使用 Service Role Key 访问 Supabase
 */
import { createClient } from '@supabase/supabase-js';

// 从环境变量获取服务端密钥
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

// 演示模式猫咪数据（用于状态联动更新）
const MOCK_CATS_STATUS: Record<string, string> = {
  '1': '可领养',
  '2': '可领养',
  '3': '已领养'
};

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

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const method = req.method;
  const pathParts = url.pathname.split('/').filter(Boolean);

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // GET /api/applications - 获取所有申请
    if (method === 'GET' && pathParts.length === 2) {
      const data = await getAllApplications();
      return new Response(JSON.stringify({ data }), { headers });
    }

    // GET /api/applications/:id - 获取单个申请
    if (method === 'GET' && pathParts.length === 3) {
      const id = pathParts[2];
      const data = await getApplicationById(id);
      if (!data) {
        return new Response(JSON.stringify({ error: '申请不存在' }), { status: 404, headers });
      }
      return new Response(JSON.stringify({ data }), { headers });
    }

    // POST /api/applications - 提交申请
    if (method === 'POST') {
      const body = await req.json();
      const data = await submitApplication(body);
      return new Response(JSON.stringify({ data }), { status: 201, headers });
    }

    // PUT /api/applications/:id/review - 审核申请
    if (method === 'PUT' && pathParts.length === 4 && pathParts[3] === 'review') {
      const id = pathParts[2];
      const { status, catId } = await req.json();
      await reviewApplication(id, status, catId);
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response(JSON.stringify({ error: '未找到路由' }), { status: 404, headers });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '服务器内部错误' }),
      { status: 500, headers }
    );
  }
}

// ===== 数据库操作函数 =====

async function getAllApplications() {
  if (isDemoMode || !supabase) {
    return [...MOCK_APPLICATIONS].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  const { data, error } = await supabase
    .from('adoption_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
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

interface NewApplicationInput {
  catId: string;
  catName: string;
  catImage: string;
  applicantName: string;
  contactInfo: string;
  reason: string;
}

async function submitApplication(app: NewApplicationInput) {
  if (isDemoMode || !supabase) {
    const newApp = {
      id: `app-${Date.now()}`,
      ...app,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    MOCK_APPLICATIONS.push(newApp);
    MOCK_CATS_STATUS[app.catId] = '待定';
    return newApp;
  }

  const { data, error } = await supabase
    .from('adoption_applications')
    .insert([{ ...app, status: 'pending' }])
    .select()
    .single();

  if (error) throw error;

  // 自动更新猫咪状态为待定
  await supabase
    .from('cats')
    .update({ status: '待定' })
    .eq('id', app.catId);

  return data;
}

async function reviewApplication(appId: string, status: string, catId: string) {
  if (isDemoMode || !supabase) {
    const app = MOCK_APPLICATIONS.find(a => a.id === appId);
    if (app) app.status = status;

    // 联动更新猫咪状态
    if (status === 'approved') {
      MOCK_CATS_STATUS[catId] = '已领养';
    } else if (status === 'rejected') {
      if (MOCK_CATS_STATUS[catId] === '待定') {
        MOCK_CATS_STATUS[catId] = '可领养';
      }
    }
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
