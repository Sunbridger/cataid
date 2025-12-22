/**
 * AI 生成猫咪简介 API
 * 路由：POST /api/generate-bio
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
    const { name, breed, traits } = req.body;
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: '服务器配置错误：缺少 API_KEY' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 生成简介
    const prompt = `
      请为一只名叫 ${name} 的猫写一段简短、吸引人且可爱的领养简介（最多80字）。
      品种：${breed}。
      性格特点：${traits.join(', ')}。
      语气要像是猫咪的自我介绍，或者是热情的收容所志愿者。请使用中文。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
    });

    return res.status(200).json({ bio: response.text?.trim() });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: '生成简介失败' });
  }
}