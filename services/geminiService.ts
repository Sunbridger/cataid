// This service now calls our Vercel Serverless Functions in /api
// These endpoints act as proxies to the actual AI provider (Moonshot/Kimi).

export const analyzeCatImage = async (imageUrl: string): Promise<{ breed?: string; color?: string; characteristics?: string[]; age?: number; gender?: 'Male' | 'Female' } | null> => {
  try {
    const response = await fetch('/api/ai?type=analyze-image', {
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
    const response = await fetch('/api/ai?type=generate-bio', {
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

/**
 * 生成AI评论回复
 * @param catName 猫咪名字
 * @param catBreed 猫咪品种
 * @param userComment 用户评论内容
 * @returns AI生成的回复内容
 */
export const generateCommentReply = async (
  catName: string,
  catBreed: string,
  userComment: string
): Promise<string> => {
  try {
    const response = await fetch('/api/ai?type=reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catName, catBreed, userComment }),
    });

    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();
    return data.reply || "喵~谢谢你的留言！";
  } catch (e) {
    console.error("Comment Reply Error:", e);
    return "喵喵喵~ 感谢你的关注！";
  }
};