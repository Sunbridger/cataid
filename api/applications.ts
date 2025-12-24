/**
 * 领养申请相关 API
 * 路由：GET/POST /api/applications
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 演示模式数据
let MOCK_APPLICATIONS = [
  {
    id: 'app-1',
    cat_id: '2',
    cat_name: '黑夜 (Midnight)',
    cat_image: 'https://picsum.photos/id/40/600/600',
    applicant_name: '张三',
    contact_info: '13800138000',
    reason: '家里有一只猫了，想找个伴。',
    status: 'pending',
    created_at: new Date().toISOString()
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
function toSnakeCase(app: NewApplicationInput) {
  return {
    cat_id: app.catId,
    user_id: app.userId || null,
    cat_name: app.catName,
    cat_image: app.catImage,
    applicant_name: app.applicantName,
    contact_info: app.contactInfo,
    reason: app.reason
  };
}

// 将数据库 snake_case 转换为前端 camelCase
function toCamelCase(data: any) {
  if (!data) return data;

  const convert = (item: any) => ({
    id: item.id,
    catId: item.cat_id,
    userId: item.user_id,
    catName: item.cat_name,
    catImage: item.cat_image,
    applicantName: item.applicant_name,
    contactInfo: item.contact_info,
    reason: item.reason,
    status: item.status,
    createdAt: item.created_at,
    reviewedAt: item.reviewed_at || null
  });

  return Array.isArray(data) ? data.map(convert) : convert(data);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    // GET /api/applications - 获取所有申请
    if (req.method === 'GET') {
      const data = await getAllApplications();
      return res.status(200).json({ data: toCamelCase(data) });
    }

    // POST /api/applications - 提交申请
    if (req.method === 'POST') {
      const data = await submitApplication(req.body);
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

async function getAllApplications() {
  if (isDemoMode || !supabase) {
    return [...MOCK_APPLICATIONS].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const { data, error } = await supabase
    .from('adoption_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

interface NewApplicationInput {
  catId: string;
  userId?: string;
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
      ...toSnakeCase(app),
      status: 'pending',
      created_at: new Date().toISOString()
    };
    MOCK_APPLICATIONS.push(newApp);
    return newApp;
  }

  // 使用 snake_case 插入数据库
  const { data, error } = await supabase
    .from('adoption_applications')
    .insert([{ ...toSnakeCase(app), status: 'pending' }])
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
