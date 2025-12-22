/**
 * AI 聊天 API - 使用 Kimi (Moonshot AI)
 * 路由：POST /api/chat
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
    const { catName, userQuestion } = req.body;
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
            content: '你是一个热心的猫咪领养助手，回答要简短可爱，控制在50字以内。'
          },
          {
            role: 'user',
            content: `用户正在询问关于一只名叫 ${catName} 的猫。问题: ${userQuestion}。请用礼貌的中文回答，并鼓励用户领养。`
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Moonshot API Error:', errorData);
      throw new Error('AI 服务请求失败');
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || '喵~';

    return res.status(200).json({ answer });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: '猫咪正在睡觉，无法回答。' });
  }
}