
import { createClient } from '@supabase/supabase-js';

// 注意：为了使用 Realtime 功能，前端必须能连接到 Supabase。
// 你需要在 .env.local 中配置以下 VITE_ 开头的环境变量。
// VITE_SUPABASE_URL=你的Supabase项目URL
// VITE_SUPABASE_ANON_KEY=你的Supabase匿名Key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 如果没有配置，这里会创建一个空的客户端，Realtime 功能将不可用。
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
