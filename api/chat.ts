import { GoogleGenAI } from "@google/genai";

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { catName, userQuestion } = await req.json();
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Updated instruction for Chinese output
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `你是一个热心的猫咪领养助手。用户正在询问关于一只名叫 ${catName} 的猫。
        用户问题: ${userQuestion}
        请用礼貌的中文回答，并鼓励用户领养。回答字数控制在50字以内。`
    });

    return new Response(JSON.stringify({ answer: response.text?.trim() }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: '猫咪正在睡觉，无法回答。' }), { status: 500 });
  }
}