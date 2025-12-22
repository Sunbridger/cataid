/**
 * AI 聊天 API
 * 路由：POST /api/chat
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

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
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: '服务器配置错误：缺少 API_KEY' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 生成回复
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: `你是一个热心的猫咪领养助手。用户正在询问关于一只名叫 ${catName} 的猫。
        用户问题: ${userQuestion}
        请用礼貌的中文回答，并鼓励用户领养。回答字数控制在50字以内。`
    });

    return res.status(200).json({ answer: response.text?.trim() });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: '猫咪正在睡觉，无法回答。' });
  }
}