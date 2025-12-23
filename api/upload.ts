/**
 * 图片上传 API - 使用 Cloudinary
 * 路由：POST /api/upload
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v2 as cloudinary } from 'cloudinary';

// 配置 Cloudinary
cloudinary.config({
  cloud_name: 'dunsnio0v',
  api_key: '119875759313936',
  api_secret: 'JVyKynp_m6roTsP-ilrjO9j_3kg'
});

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

    if (!file) {
      return res.status(400).json({ error: '缺少文件数据' });
    }

    // Cloudinary 支持直接上传 Base64 字符串
    // 我们将上传到 'cats' 文件夹中
    const uploadResult = await cloudinary.uploader.upload(file, {
      folder: 'cats',
      public_id: `cat_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      resource_type: 'image',
    });

    return res.status(200).json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id
    });

  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : '图片上传失败'
    });
  }
}
