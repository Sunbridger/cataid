// Supabase Configuration
// In a real Vercel deployment, these would be process.env.REACT_APP_SUPABASE_URL etc.
// For this demo, we check for them, but provide placeholders if missing to prevent crash.

export const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
export const GEMINI_API_KEY = process.env.API_KEY || '';

// If keys are missing, we enable 'Demo Mode' which uses local mock data.
export const IS_DEMO_MODE = !SUPABASE_URL || !SUPABASE_ANON_KEY;

export const CAT_CATEGORIES = [
  '活泼好动',
  '高冷安静',
  '老年猫',
  '幼猫',
  '需特殊照顾',
  '不离不弃组合'
];

export const CAT_STATUSES = ['可领养', '已领养', '待定'] as const;

export const MOCK_CATS = [
  {
    id: '1',
    name: '小橘 (Ginger)',
    age: 2,
    gender: 'Female',
    breed: '橘猫',
    description: '小橘是一只精力充沛的小老虎，喜欢追逐激光笔，也喜欢在阳光下打盹。她话很多，会经常跟你喵喵叫，分享她的一天。',
    image_url: 'https://picsum.photos/id/237/600/600',
    tags: ['活泼好动', '话唠'],
    status: '可领养',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: '黑夜 (Midnight)',
    age: 5,
    gender: 'Male',
    breed: '孟买猫',
    description: '黑夜里的神秘影子……等等，其实只是一只想要温暖大腿的粘人黑猫。一开始可能有点害羞，但一旦信任你，呼噜声就像柴油引擎一样响。',
    image_url: 'https://picsum.photos/id/40/600/600',
    tags: ['高冷安静', '老年猫'],
    status: '可领养',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    name: '雪球 (Snowball)',
    age: 1,
    gender: 'Male',
    breed: '波斯混血',
    description: '雪球就是一团长了眼睛的云朵。他需要每天梳毛和膜拜。作为回报，他会提供柔软的头槌和踩奶服务。',
    image_url: 'https://picsum.photos/id/219/600/600',
    tags: ['幼猫', '需要伺候'],
    status: '已领养',
    created_at: new Date().toISOString()
  }
];