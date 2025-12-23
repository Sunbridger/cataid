/**
 * AI 生成评论回复 API - 使用 Kimi (Moonshot AI)
 * 路由：POST /api/comment-reply
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
    const { catName, catBreed, userComment } = req.body;
    const apiKey = process.env.MOONSHOT_API_KEY;

    if (!apiKey) {
      // 演示模式：返回预设回复
      const demoReplies = [
        `喵~ 谢谢你对${catName}的关注！`,
        `${catName}看到你的留言很开心呢！喵喵喵~`,
        `感谢你的支持！${catName}正在寻找一个温暖的家~`,
        `喵呜~ ${catName}很喜欢你的留言！希望能有机会见到你~`,
      ];
      const reply = demoReplies[Math.floor(Math.random() * demoReplies.length)];
      return res.status(200).json({ reply });
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
            content: `你是一只名叫 ${catName} 的可爱猫咪的小助手（AI），正在帮助它回复网友的留言。
品种：${catBreed || '可爱猫咪'}
回复要求：
1. 用可爱、俏皮的语气回复
2. 可以适当使用猫咪叫声如"喵~"、"喵喵喵"等
3. 回复要简短有趣，最多50字
4. 表达对用户关注的感谢
5. 如果用户有问题，尽量给出友好的回应
6. 使用中文回复`
          },
          {
            role: 'user',
            content: `用户留言："${userComment}"
请以 ${catName} 的小助手（AI）身份回复这条留言。`
          }
        ],
        temperature: 0.9,
        max_tokens: 100
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Moonshot API Error:', errorData);
      throw new Error('AI 服务请求失败');
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || `喵~ 谢谢你的留言！${catName}很开心~`;

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("API Error:", error);
    // 返回默认回复而不是错误
    return res.status(200).json({ reply: '喵喵喵~ 感谢你的关注！' });
  }
}
