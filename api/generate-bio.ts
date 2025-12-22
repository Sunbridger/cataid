import { GoogleGenAI } from "@google/genai";

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { name, breed, traits } = await req.json();
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Updated prompt for Chinese output
    const prompt = `
      请为一只名叫 ${name} 的猫写一段简短、吸引人且可爱的领养简介（最多80字）。
      品种：${breed}。
      性格特点：${traits.join(', ')}。
      语气要像是猫咪的自我介绍，或者是热情的收容所志愿者。请使用中文。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return new Response(JSON.stringify({ bio: response.text?.trim() }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: 'Failed to generate bio' }), { status: 500 });
  }
}