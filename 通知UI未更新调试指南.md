# 🔧 通知功能调试指南

## 当前状态

✅ **Realtime 连接成功** - Console 显示 "Successfully subscribed"
✅ **收到通知消息** - Console 显示 "Received new notification"
❌ **UI 未更新** - 导航栏未显示未读数量

---

## 🐛 问题诊断

### 已完成的修复

1. ✅ 添加了详细的调试日志
2. ✅ 在移动端底部导航栏添加了通知图标
3. ✅ 添加了 useEffect 监听状态变化

### 需要检查的点

#### 1. 检查通知的 `isRead` 字段

从 Console 日志中查找:
```
[Notification] isRead: true/false
```

**如果 `isRead` 为 `true`**:
- 通知不会增加未读数量
- 这是正常的,因为代码现在只对未读通知计数

**解决方案**: 检查数据库插入通知时 `is_read` 的默认值

#### 2. 检查 `unreadCount` 的初始值

在 Console 中查找:
```
[Notification] unreadCount changed to: X
```

**如果始终是 0**:
- 可能是初始化时就设置为 0
- 需要检查 `refreshUnreadCount` 是否正确执行

#### 3. 检查 Navbar 是否重新渲染

在 Console 中查找:
```
[Navbar] unreadCount: X
```

**如果没有这个日志**:
- Navbar 没有重新渲染
- 可能是 Context 传递问题

---

## 🔍 调试步骤

### 步骤 1: 刷新页面并查看初始日志

1. 刷新浏览器页面 (F5)
2. 打开 Console
3. 查找以下日志:

```
[Notification] Setting up Realtime subscription for user: xxx
[Notification] Subscription status: SUBSCRIBED
[Notification] unreadCount changed to: X
[Navbar] unreadCount: X
```

### 步骤 2: 触发新通知

1. 让"小憩"回复"七彩"的评论
2. 立即查看 Console 日志:

```
[Notification] ========== NEW NOTIFICATION RECEIVED ==========
[Notification] Payload: {...}
[Notification] New notification object: {...}
[Notification] isRead: false/true  ← 关键!
[Notification] Updating unreadCount. Previous: X
[Notification] Updated unreadCount: Y
[Notification] unreadCount changed to: Y
[Navbar] unreadCount: Y
```

### 步骤 3: 检查数据库

在 Supabase SQL Editor 执行:

```sql
-- 查看最近创建的通知
SELECT
  id,
  user_id,
  type,
  title,
  is_read,  -- ← 关键字段
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 5;
```

**检查 `is_read` 的值**:
- 如果是 `true`,通知不会增加未读数
- 如果是 `false`,应该增加未读数

---

## 🎯 可能的问题和解决方案

### 问题 1: 通知创建时 `is_read` 为 `true`

**原因**: 数据库插入时没有设置 `is_read` 或默认值错误

**解决方案**: 检查 `api/comments.ts` 中的通知创建代码:

```typescript
await supabase
  .from('notifications')
  .insert([{
    user_id: parentComment.user_id,
    type: 'comment_reply',
    title: '收到新回复',
    content: `...`,
    related_id: data.id,
    related_type: 'comment',
    // ← 确保没有设置 is_read: true
  }]);
```

**验证**: 在 SQL 中检查表的默认值:

```sql
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'notifications' AND column_name = 'is_read';
```

应该看到 `column_default` 为 `false`

---

### 问题 2: `unreadCount` 初始值不对

**原因**: `refreshUnreadCount` 返回的数量不准确

**解决方案**: 检查 API 返回值:

在 Console 中添加临时代码:

```javascript
// 在浏览器 Console 中执行
fetch('/api/user?action=unread_count&userId=YOUR_USER_ID')
  .then(r => r.json())
  .then(d => console.log('Unread count from API:', d));
```

---

### 问题 3: Context 更新但 Navbar 未重新渲染

**原因**: React 组件优化或 Context 传递问题

**解决方案**: 强制 Navbar 重新渲染

在 `Navbar.tsx` 中添加:

```typescript
useEffect(() => {
  console.log('[Navbar] Component rendered/updated');
  console.log('[Navbar] unreadCount:', unreadCount);
}, [unreadCount]);
```

---

## 📊 预期的 Console 日志流程

### 正常流程:

```
1. [Notification] Setting up Realtime subscription for user: xxx
2. [Notification] Subscription status: SUBSCRIBED
3. [Notification] ✅ Successfully subscribed to notifications
4. [Notification] unreadCount changed to: 0
5. [Navbar] unreadCount: 0

--- 收到新通知 ---

6. [Notification] ========== NEW NOTIFICATION RECEIVED ==========
7. [Notification] Payload: {...}
8. [Notification] isRead: false
9. [Notification] Updating unreadCount. Previous: 0
10. [Notification] Updated unreadCount: 1
11. [Notification] unreadCount changed to: 1
12. [Navbar] unreadCount: 1  ← UI 应该更新
```

---

## 🚨 如果还是不行

### 临时解决方案: 使用轮询

在 `NotificationContext.tsx` 中添加:

```typescript
// 每 5 秒刷新一次未读数量
useEffect(() => {
  if (!user?.id) return;

  const interval = setInterval(() => {
    console.log('[Notification] Polling unread count...');
    refreshUnreadCount();
  }, 5000);

  return () => clearInterval(interval);
}, [user?.id, refreshUnreadCount]);
```

---

## 📝 下一步

1. **刷新页面**,查看 Console 日志
2. **触发新通知**,观察日志变化
3. **截图 Console** 中的所有 `[Notification]` 和 `[Navbar]` 日志
4. **告诉我**:
   - `isRead` 的值是什么?
   - `unreadCount` 有没有变化?
   - `[Navbar]` 日志有没有更新?

根据这些信息,我可以精确定位问题! 🎯
