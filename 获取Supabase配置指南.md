# 获取 Supabase 配置信息指南

## 🎯 需要获取的配置

你需要获取以下两个配置值:

1. **VITE_SUPABASE_URL** - Supabase 项目的 URL
2. **VITE_SUPABASE_ANON_KEY** - Supabase 的匿名密钥 (公开密钥)

## 📋 获取步骤

### 步骤 1: 登录 Supabase Dashboard

访问: https://supabase.com/dashboard

### 步骤 2: 选择你的项目

根据你的配置,项目 URL 是:
```
https://vljwyjfdpfjmjidbfmcs.supabase.co
```

所以项目 Reference ID 是: `vljwyjfdpfjmjidbfmcs`

### 步骤 3: 进入 Project Settings

1. 在左侧菜单栏底部,点击 **⚙️ Settings**
2. 选择 **API** 选项卡

### 步骤 4: 复制配置信息

在 API Settings 页面,你会看到:

#### Project URL
```
URL: https://vljwyjfdpfjmjidbfmcs.supabase.co
```
这就是 `VITE_SUPABASE_URL` 的值

#### Project API keys

你会看到两个密钥:

1. **anon / public** (公开密钥) ⭐ 这是我们需要的
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsand5amZkcGZqbWppZGJmbWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3NTk5MzksImV4cCI6MjA1MDMzNTkzOX0.Ks5gYMDJcW_jKLGPKpDZPXUDVVQqYqKvPCDqFPxpVpQ
   ```
   这就是 `VITE_SUPABASE_ANON_KEY` 的值

2. **service_role** (服务端密钥) - 这个已经在你的 Vercel 环境变量中配置了

## 🔧 配置到本地环境

### 方案 1: 手动复制 (推荐)

1. 从 Supabase Dashboard 复制上述两个值
2. 更新 `.env.local` 文件:

```bash
# 服务端环境变量
SUPABASE_URL=https://vljwyjfdpfjmjidbfmcs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=你的service_role_key

# 前端环境变量 (从 Supabase Dashboard 复制)
VITE_SUPABASE_URL=https://vljwyjfdpfjmjidbfmcs.supabase.co
VITE_SUPABASE_ANON_KEY=从Dashboard复制的anon_key
```

### 方案 2: 使用我提供的值 (如果上面的值正确)

根据你现有的配置,我已经推断出了这些值。如果你的项目 URL 确实是 `https://vljwyjfdpfjmjidbfmcs.supabase.co`,那么我在 `.env.local` 中配置的值应该是正确的。

你可以验证一下:

```bash
cat .env.local
```

## 🚀 配置到 Vercel

### 在 Vercel Dashboard 添加环境变量

1. 访问: https://vercel.com/dashboard
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**
4. 添加以下变量:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://vljwyjfdpfjmjidbfmcs.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | 从 Supabase 复制的 anon key | Production, Preview, Development |

⚠️ **注意**: 这两个变量**不需要**设置为 Sensitive,因为它们是公开的前端变量。

### 已有的 Vercel 环境变量

你已经配置了:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `MOONSHOT_API_KEY`

现在需要**新增**:
- ⭐ `VITE_SUPABASE_URL`
- ⭐ `VITE_SUPABASE_ANON_KEY`

## 🔐 安全说明

### 为什么需要两套密钥?

1. **SERVICE_ROLE_KEY** (服务端)
   - 拥有完整的数据库权限
   - 绕过所有 RLS 策略
   - ⚠️ 只能在服务端使用
   - ⚠️ 绝不能暴露给前端

2. **ANON_KEY** (前端)
   - 权限受 RLS 策略限制
   - ✅ 可以安全地在前端使用
   - ✅ 用于 Realtime 订阅
   - ✅ 可以公开在代码中

### 为什么 ANON_KEY 可以公开?

- 它本身不提供任何权限
- 所有操作都受 RLS 策略保护
- 即使被获取也无法进行危险操作
- 类似于 Firebase 的公开配置

## 🧪 验证配置

### 验证本地配置

运行以下命令检查环境变量:

```bash
# 检查 .env.local 文件
cat .env.local | grep VITE_SUPABASE

# 应该看到:
# VITE_SUPABASE_URL=https://vljwyjfdpfjmjidbfmcs.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 验证 Vercel 配置

1. 在 Vercel Dashboard 查看环境变量
2. 确保 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 已添加
3. 重新部署应用以应用新的环境变量

## 📝 快速参考

### Supabase Dashboard 路径
```
Dashboard → 选择项目 → Settings → API
```

### 需要复制的内容
```
Project URL → VITE_SUPABASE_URL
anon / public key → VITE_SUPABASE_ANON_KEY
```

### 配置位置
```
本地开发: .env.local
生产环境: Vercel Environment Variables
```

## ❓ 常见问题

### Q: 我找不到 anon key?
**A**: 在 Supabase Dashboard → Settings → API 页面,找到 "Project API keys" 部分,第一个就是 anon key。

### Q: anon key 和 service_role key 有什么区别?
**A**:
- anon key: 前端使用,权限受限,安全
- service_role key: 后端使用,完整权限,敏感

### Q: 需要重新部署吗?
**A**:
- 本地: 重启开发服务器即可
- Vercel: 添加环境变量后需要重新部署

### Q: 为什么之前没有配置这些?
**A**: 之前的实现可能没有使用 Realtime 功能,或者使用了其他方式。现在为了实现实时通知,必须配置这些变量。

## 🎯 下一步

配置完成后:

1. ✅ 重启本地开发服务器
2. ✅ 执行数据库修复 SQL
3. ✅ 测试通知功能
4. ✅ 在 Vercel 添加环境变量并重新部署

---

**需要帮助?** 如果在获取配置时遇到问题,请告诉我具体的错误信息。
