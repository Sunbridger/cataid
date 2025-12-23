import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS
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

    // 初始化 Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 下载图片并转换为 Buffer
    let imageBuffer: Buffer;
    let mimeType: string;

    try {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
    } catch (fetchError) {
      console.error('Image fetch error:', fetchError);
      return res.status(400).json({ error: '无法获取图片，请检查图片 URL' });
    }

    // 构造请求 parts
    const prompt = `
      你是一个猫咪专家。请分析这张图片，以纯 JSON 格式返回以下信息：
      {
        "breed": "推测品种(如: 英国短毛猫，如果是混血请注明)",
        "color": "主要毛色(如: 蓝白、橘色)",
        "characteristics": ["特征1", "特征2", "特征3"],
        "age": "推测年龄数字(单位: 岁，如 0.5, 1, 3)",
        "gender": "推测性别('Male' 或 'Female'，如果难以判断可基于直觉猜测)",
        "is_cat": true
      }

      注意：
      1. characteristics 请从以下选项中选择最符合的3个：活泼好动、高冷安静、粘人精、独立自主、话唠、干饭喵、老年猫、幼猫、需特殊照顾、不离不弃组合。
      2. 如果推测是幼猫，age 请填 0.1 到 1 之间的数字；如果是成猫，请填 1 以上的整数。
      3. gender 请必须返回 'Male' 或 'Female' 之一，即使不确定也请给出一个猜测值。
      4. 如果图片中不是猫咪，请返回 { "is_cat": false }。
      5. 不要返回 Markdown 格式（如 \`\`\`json），只要纯 JSON 字符串。
    `;

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: mimeType
      },
    };

    // 调用模型
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    console.log("Gemini Response:", responseText);

    // 解析 JSON
    let parsedResult;
    try {
      // 清理可能存在的 Markdown 标记
      const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanText);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      // 尝试提取 JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Unable to parse AI response as JSON");
      }
    }

    if (parsedResult.is_cat === false) {
      return res.status(200).json({
        result: null,
        message: "这看起来不像是一只猫咪哦"
      });
    }

    return res.status(200).json({ result: parsedResult });

  } catch (error) {
    console.error("Analyze Image Error:", error);
    return res.status(500).json({
      error: 'AI 识别失败，请稍后重试或手动输入',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
