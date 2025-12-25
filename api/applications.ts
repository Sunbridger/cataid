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

  // 为申请人创建通知
  if (app.userId) {
    try {
      console.log(`[API] Creating notification for user ${app.userId}`);
      const { error: notifError } = await supabase
        .from('notifications')
        .insert([{
          user_id: app.userId,
          type: 'application_submitted',
          title: `已提交领养申请`,
          content: `您对 ${app.catName} 的领养申请已提交，请等待审核`,
          related_id: data.id,
          related_type: 'application',
        }]);

      if (notifError) {
        console.error('[API] Failed to create notification:', notifError);
      } else {
        console.log('[API] Notification created successfully');
      }
    } catch (err) {
      console.error('[API] Error creating notification:', err);
    }
  } else {
    console.warn('[API] No userId provided for application, skipping notification');
  }

  // 为所有管理员创建通知
  try {
    console.log('[API] Creating notifications for admins');

    // 获取所有管理员
    const { data: admins, error: adminError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .eq('status', 'active');

    if (adminError) {
      console.error('[API] Failed to fetch admins:', adminError);
    } else if (admins && admins.length > 0) {
      console.log(`[API] Found ${admins.length} admin(s)`);

      // 为每个管理员创建通知
      const adminNotifications = admins.map(admin => ({
        user_id: admin.id,
        type: 'new_application',
        title: '新的领养申请',
        content: `${app.applicantName} 申请领养 ${app.catName}`,
        related_id: data.id,
        related_type: 'application',
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(adminNotifications);

      if (notifError) {
        console.error('[API] Failed to create admin notifications:', notifError);
      } else {
        console.log('[API] Admin notifications created successfully');
      }
    } else {
      console.warn('[API] No active admins found');
    }
  } catch (err) {
    console.error('[API] Error creating admin notifications:', err);
  }

  // 为猫咪发布者创建通知
  try {
    console.log('[API] Check for cat owner to notify');

    // 获取猫咪发布者 ID
    const { data: catData, error: catError } = await supabase
      .from('cats')
      .select('user_id')
      .eq('id', app.catId)
      .single();

    if (catError) {
      console.error('[API] Failed to fetch cat owner:', catError);
    } else if (catData && catData.user_id) {
      const ownerId = catData.user_id;

      // 如果发布者不是申请人自己，并且也不是管理员（如果需要避免重复通知，可在此检查，但现在为了简单暂不检查管理员重合情况，让其收到通知也没坏处）
      // 实际上，如果发布者就是管理员，上面已经发过了吗？上面的逻辑只发给了 role='admin' 的用户。
      // 如果这里不检查是否已发，可能会发两次。为了用户体验，我们可以尝试避免。
      // 但这里我们简单处理：只要 ownerId 存在且不等于 app.userId，就发。

      if (ownerId !== app.userId) {
        console.log(`[API] Creating notification for cat owner ${ownerId}`);

        const { error: ownerNotifError } = await supabase
          .from('notifications')
          .insert([{
            user_id: ownerId,
            type: 'new_application',
            title: '您的猫咪收到领养申请',
            content: `${app.applicantName} 申请领养您的猫咪 ${app.catName}`,
            related_id: data.id,
            related_type: 'application',
          }]);

        if (ownerNotifError) {
          console.error('[API] Failed to create owner notification:', ownerNotifError);
        } else {
          console.log('[API] Owner notification created successfully');
        }
      }
    }
  } catch (err) {
    console.error('[API] Error creating owner notification:', err);
  }

  return data;
}

