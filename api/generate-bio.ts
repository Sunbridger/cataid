/**
 * AI 生成猫咪简介 API - 使用 Kimi (Moonshot AI)
 * 路由：POST /api/generate-bio
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Moonshot API 配置
const MOONSHOT_API_URL = "https://api.moonshot.cn/v1/chat/completions";

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
    const { name, breed, traits } = req.body;
    const apiKey = process.env.MOONSHOT_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: '服务器配置错误：缺少 MOONSHOT_API_KEY' });
    }

    // 调用 Moonshot API
    const response = await fetch(MOONSHOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的猫咪领养简介撰写者，擅长用可爱、吸引人的语言描述猫咪。'
          },
          {
            role: 'user',
            content: `请为一只名叫 ${name} 的猫写一段简短、吸引人且可爱的领养简介（最多80字）。
品种：${breed}。
性格特点：${traits.join(', ')}。
语气要像是猫咪的自我介绍，或者是热情的收容所志愿者。请使用中文。`
          }
        ],
        temperature: 0.8,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Moonshot API Error:', errorData);
      throw new Error('AI 服务请求失败');
    }

    const data = await response.json();
    const bio = data.choices?.[0]?.message?.content?.trim() || '';

    return res.status(200).json({ bio });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: '生成简介失败' });
  }
}