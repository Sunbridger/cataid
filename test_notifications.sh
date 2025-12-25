#!/bin/bash

# 消息通知功能测试脚本

echo "======================================"
echo "消息通知功能测试"
echo "======================================"
echo ""

# 1. 检查环境变量
echo "1. 检查环境变量配置..."
if grep -q "VITE_SUPABASE_URL" .env.local && grep -q "VITE_SUPABASE_ANON_KEY" .env.local; then
    echo "✅ 前端环境变量已配置"
else
    echo "❌ 前端环境变量缺失"
    exit 1
fi

if grep -q "SUPABASE_URL" .env.local && grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
    echo "✅ 后端环境变量已配置"
else
    echo "❌ 后端环境变量缺失"
    exit 1
fi

echo ""

# 2. 检查关键文件
echo "2. 检查关键文件..."
files=(
    "context/NotificationContext.tsx"
    "api/user.ts"
    "api/applications.ts"
    "api/applications/[id].ts"
    "api/comments.ts"
    "pages/NotificationsPage.tsx"
    "components/Navbar.tsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file 不存在"
    fi
done

echo ""

# 3. 检查通知创建逻辑
echo "3. 检查通知创建逻辑..."

if grep -q "notifications" api/applications.ts; then
    echo "✅ 申请提交通知已实现"
else
    echo "❌ 申请提交通知未实现"
fi

if grep -q "notifications" api/applications/\[id\].ts; then
    echo "✅ 申请审核通知已实现"
else
    echo "❌ 申请审核通知未实现"
fi

if grep -q "comment_reply" api/comments.ts; then
    echo "✅ 评论回复通知已实现"
else
    echo "❌ 评论回复通知未实现"
fi

echo ""

# 4. 检查 Realtime 订阅
echo "4. 检查 Realtime 订阅..."
if grep -q "\.channel" context/NotificationContext.tsx; then
    echo "✅ Realtime 订阅已配置"
else
    echo "❌ Realtime 订阅未配置"
fi

echo ""

# 5. 提示下一步操作
echo "======================================"
echo "下一步操作："
echo "======================================"
echo "1. 重启开发服务器: npm run dev"
echo "2. 在 Supabase SQL Editor 中执行: fix_notifications_rls_v2.sql"
echo "3. 登录应用并测试通知功能"
echo ""
echo "详细说明请查看: 消息通知修复指南.md"
echo ""
