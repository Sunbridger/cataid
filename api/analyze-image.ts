import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { imageUrl } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('Missing GEMINI_API_KEY');
      return res.status(500).json({ error: 'Server config error: Missing API Key' });
    }

    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing imageUrl parameter' });
    }

    // 下载图片并转换为 base64（Gemini API 要求 base64 格式）
    let base64Image: string;
    let mimeType: string;

    try {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      base64Image = Buffer.from(imageBuffer).toString('base64');

      // 检测图片类型
      mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
    } catch (fetchError) {
      console.error('Image fetch error:', fetchError);
      return res.status(400).json({ error: '无法获取图片，请检查图片 URL' });
    }

    // 调用 Gemini Vision API
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `请识别这只猫咪的品种、毛色和可能的性格特征。请以 JSON 格式返回结果，格式如下：
{
  "breed": "品种名称（如：中华田园猫、英国短毛猫等）",
  "color": "毛色描述",
  "characteristics": ["性格特点1", "性格特点2", "性格特点3"]
}

注意：
1. breed 请使用常见的中文品种名称
2. characteristics 请从以下选项中选择最符合的3个：粘人精、活泼好动、幼猫、高冷安静、话唠、需要伺候、老年猫、独立自主
3. 只返回 JSON 对象，不要其他文字`
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 500,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini Vision API Error:", errorData);

      // 如果是 API 限制
      if (response.status === 429) {
        return res.status(429).json({ error: 'AI 识别服务请求过于频繁，请稍后再试' });
      }

      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('Empty response from Gemini API');
    }

    // 解析 JSON 响应
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // 尝试提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from AI');
      }
    }

    return res.status(200).json({ result });

  } catch (error) {
    console.error("Analyze Image Error:", error);

    // 返回降级响应，让用户知道需要手动输入
    return res.status(500).json({
      error: 'AI 识别暂时不可用，请手动填写猫咪信息',
      result: null
    });
  }
}
