// This service now calls our Vercel Serverless Functions in /api
// These endpoints act as proxies to the actual AI provider (Moonshot/Kimi).

export const analyzeCatImage = async (imageUrl: string): Promise<{ breed?: string; color?: string; characteristics?: string[]; age?: number; gender?: 'Male' | 'Female' } | null> => {
  try {
    const response = await fetch('/api/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) throw new Error('Analysis failed');

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("Image Analysis Error:", error);
    return null;
  }
};

export const generateCatBio = async (
  name: string,
  breed: string,
  traits: string[]
): Promise<string> => {
  try {
    const response = await fetch('/api/generate-bio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, breed, traits }),
    });

    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();
    return data.bio || "一只正在寻找温暖新家的可爱猫咪。";
  } catch (error) {
    console.error("Bio Generation Error:", error);
    return "无法生成简介，请尝试手动编写。";
  }
};

export const chatAboutCat = async (catName: string, userQuestion: string): Promise<string> => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catName, userQuestion }),
    });

    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();
    return data.answer || "我没听清你的问题，喵？";
  } catch (e) {
    console.error("Chat Error:", e);
    return "猫咪现在有点分心，没法回答你。";
  }
};