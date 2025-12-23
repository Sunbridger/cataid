/**
 * AI 统一接口
 * 路由：POST /api/ai
 * 查询参数：type = 'analyze-image' | 'generate-bio' | 'chat' | 'reply'
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Moonshot API 配置
const MOONSHOT_API_URL = "https://api.moonshot.cn/v1/chat/completions";

// 设置 CORS
function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// 1. 分析图片 (Gemini)
async function handleAnalyzeImage(req: VercelRequest, res: VercelResponse) {
  try {
    const { imageUrl } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
    if (!imageUrl) return res.status(400).json({ error: 'Missing imageUrl parameter' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 下载图片
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

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
      注意：characteristics 请从以下选项中选择最符合的3个：活泼好动、高冷安静、粘人精、独立自主、话唠、干饭喵、老年猫、幼猫、需特殊照顾、不离不弃组合。
      如果图片中不是猫咪，请返回 { "is_cat": false }。不要返回 Markdown。
    `;

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: mimeType
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    // 解析 JSON
    let parsedResult;
    try {
      const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanText);
    } catch (e) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsedResult = JSON.parse(jsonMatch[0]);
      else throw new Error("Unable to parse AI response as JSON");
    }

    if (parsedResult.is_cat === false) {
      return res.status(200).json({ result: null, message: "这看起来不像是一只猫咪哦" });
    }

    return res.status(200).json({ result: parsedResult });
  } catch (error) {
    console.error("Analyze Image Error:", error);
    return res.status(500).json({ error: 'AI 识别失败', details: String(error) });
  }
}

// 2. 生成简介 (Moonshot)
async function handleGenerateBio(req: VercelRequest, res: VercelResponse) {
  try {
    const { name, breed, traits } = req.body;
    const apiKey = process.env.MOONSHOT_API_KEY;
    if (!apiKey) throw new Error('Missing MOONSHOT_API_KEY');

    const response = await fetch(MOONSHOT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          { role: 'system', content: '你是一个专业的猫咪领养简介撰写者，擅长用可爱、吸引人的语言描述猫咪。' },
          { role: 'user', content: `请为一只名叫 ${name} 的猫写一段简短、吸引人且可爱的领养简介（最多80字）。品种：${breed}。性格特点：${traits.join(', ')}。语气要像是猫咪的自我介绍，或者是热情的收容所志愿者。请使用中文。` }
        ],
        temperature: 0.8, max_tokens: 200
      })
    });

    if (!response.ok) throw new Error('AI 服务请求失败');
    const data = await response.json();
    const bio = data.choices?.[0]?.message?.content?.trim() || '';
    return res.status(200).json({ bio });
  } catch (error) {
    console.error("Generate Bio Error:", error);
    return res.status(500).json({ error: '生成简介失败' });
  }
}

// 3. AI 聊天 (Moonshot)
async function handleChat(req: VercelRequest, res: VercelResponse) {
  try {
    const { catName, userQuestion } = req.body;
    const apiKey = process.env.MOONSHOT_API_KEY;
    if (!apiKey) throw new Error('Missing MOONSHOT_API_KEY');

    const response = await fetch(MOONSHOT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          { role: 'system', content: '你是一个热心的猫咪领养助手，回答要简短可爱，控制在50字以内。' },
          { role: 'user', content: `用户正在询问关于一只名叫 ${catName} 的猫。问题: ${userQuestion}。请用礼貌的中文回答，并鼓励用户领养。` }
        ],
        temperature: 0.7, max_tokens: 150
      })
    });

    if (!response.ok) throw new Error('AI 服务请求失败');
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || '喵~';
    return res.status(200).json({ answer });
  } catch (error) {
    console.error("Chat Error:", error);
    return res.status(500).json({ error: '猫咪正在睡觉，无法回答。' });
  }
}

// 4. 评论回复 (Moonshot)
async function handleReply(req: VercelRequest, res: VercelResponse) {
  try {
    const { catName, catBreed, userComment } = req.body;
    const apiKey = process.env.MOONSHOT_API_KEY;

    if (!apiKey) {
      // 演示模式
      const demoReplies = [`喵~ 谢谢你对${catName}的关注！`, `${catName}看到你的留言很开心呢！`, `感谢支持！`];
      return res.status(200).json({ reply: demoReplies[Math.floor(Math.random() * demoReplies.length)] });
    }

    const response = await fetch(MOONSHOT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          { role: 'system', content: `你是一只名叫 ${catName} 的可爱猫咪的小助手（AI）。回复要简短有趣，最多50字。中文。` },
          { role: 'user', content: `用户留言："${userComment}"。请回复。` }
        ],
        temperature: 0.9, max_tokens: 100
      })
    });

    if (!response.ok) throw new Error('AI 服务请求失败');
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || `喵~ 谢谢你的留言！${catName}很开心~`;
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Reply Error:", error);
    return res.status(200).json({ reply: '喵喵喵~ 感谢你的关注！' });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { type } = req.query;

  switch (type) {
    case 'analyze-image': return handleAnalyzeImage(req, res);
    case 'generate-bio': return handleGenerateBio(req, res);
    case 'chat': return handleChat(req, res);
    case 'reply': return handleReply(req, res);
    default: return res.status(400).json({ error: 'Invalid or missing type parameter' });
  }
}
