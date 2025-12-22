/**
 * 图片上传 API - 使用 Supabase Storage
 * 路由：POST /api/upload
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { file, fileName, contentType } = req.body;

    if (!file || !fileName) {
      return res.status(400).json({ error: '缺少文件数据' });
    }

    // 演示模式：返回占位图片
    if (isDemoMode || !supabase) {
      console.log('[Demo Mode] 图片上传:', fileName);
      return res.status(200).json({
        url: `https://picsum.photos/seed/${fileName}/600/600`,
        message: '演示模式：使用占位图片'
      });
    }

    // 解码 Base64 图片
    const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = fileName.split('.').pop() || 'jpg';
    const filePath = `cats/${timestamp}-${randomStr}.${ext}`;

    // 上传到 Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('catImages')
      .upload(filePath, buffer, {
        contentType: contentType || 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('上传失败:', uploadError);
      throw new Error(`上传失败: ${uploadError.message}`);
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from('catImages')
      .getPublicUrl(filePath);

    return res.status(200).json({
      url: urlData.publicUrl,
      path: filePath
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : '上传失败'
    });
  }
}
