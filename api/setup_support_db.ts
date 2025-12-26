import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: '环境变量未配置' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 读取 SQL 文件
    const sqlPath = path.join(process.cwd(), 'create_support_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 注意：Supabase JS 客户端不直接支持执行原始 SQL 字符串。
    // 通常我们需要用 pg 库或者 supabase 的 rpc 功能。
    // 但是，我们可以尝试拆分 SQL 语句并通过 rest api 调用？不支持。
    // 如果没有 postgres 连接库，我们无法直接运行 .sql 文件。

    // 变通方案：告诉用户去 Dashboard 执行
    // 或者，如果项目里已经有 pg 驱动？查看 package.json

    return res.status(200).json({
      message: '请复制 create_support_tables.sql 的内容并在 Supabase Dashboard 的 SQL Editor 中执行。',
      sqlContent: sql
    });

  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
}
