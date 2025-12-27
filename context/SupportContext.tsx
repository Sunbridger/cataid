
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { SupportSession, SupportMessage } from '../types';
import { useUser } from './UserContext';
import { useToast } from './ToastContext';

// API 调用辅助函数 (内联，避免循环依赖)
const API_BASE = ''; // 相对路径

interface SupportContextType {
  session: SupportSession | null;
  messages: SupportMessage[];
  loading: boolean;
  initSession: () => Promise<void>;
  loadSessionById: (id: string, userId?: string) => Promise<void>; // userId 是可选的，用于显示
  sendMessage: (content: string, type?: 'text' | 'image') => Promise<boolean>;
  markAsRead: () => Promise<void>;
  refreshMessages: () => Promise<void>;
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

export const SupportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { error: toastError } = useToast();

  const [session, setSession] = useState<SupportSession | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // 用于防止 Realtime 重复添加消息的 Set
  const messageIdsRef = useRef<Set<string>>(new Set());

  // 初始化会话
  const initSession = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. 获取或创建会话
      const res = await fetch(`${API_BASE}/api/support?type=sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const result = await res.json();

      if (result.data) {
        setSession(result.data);
        // 2. 加载历史消息
        await fetchMessages(result.data.id);
      }
    } catch (err) {
      console.error('初始化客服会话失败:', err);
      toastError('无法连接客服系统');
    } finally {
      setLoading(false);
    }
  };

  // 管理员加载特定会话
  const loadSessionById = async (sessionId: string, targetUserId?: string) => {
    setLoading(true);
    try {
      // 构造一个临时的 Session 对象，确保有 ID 即可
      // 如果后端有 getSessionById 更好，暂时只为了让聊天跑起来
      setSession({
        id: sessionId,
        userId: targetUserId || '',
        status: 'active',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as SupportSession);

      await fetchMessages(sessionId);
    } catch (err) {
      console.error('加载会话失败:', err);
      toastError('加载会话失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/support?type=messages&sessionId=${sessionId}`);
      const result = await res.json();
      if (result.data) {
        // 转换下划线字段到驼峰 (API返回的是数据库原有字段)
        // 实际上我们的 API 代码似乎把 DB 结果直接返回了
        // 所以我们需要适配 DB 字段名 (snake_case) 到 Frontend 类型 (camelCase)
        // 这里做一个简单的映射
        const formattedMessages = result.data.map(mapDbMessageToType);

        setMessages(formattedMessages);
        // 更新 ID 集合
        messageIdsRef.current = new Set(formattedMessages.map((m: any) => m.id));
      }
    } catch (err) {
      console.error('获取消息历史失败:', err);
    }
  };

  const refreshMessages = async () => {
    if (session) {
      await fetchMessages(session.id);
    }
  };

  // 发送消息
  const sendMessage = async (content: string, type: 'text' | 'image' = 'text'): Promise<boolean> => {
    if (!session || !user) return false;

    try {
      const res = await fetch(`${API_BASE}/api/support?type=messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          senderId: user.id,
          content,
          msgType: type
        })
      });

      if (!res.ok) throw new Error('发送失败');

      // 获取 API 返回的新消息数据
      const result = await res.json();
      if (result.data) {
        const newMsg = mapDbMessageToType(result.data);
        // 立即添加到消息列表（乐观更新）
        setMessages(prev => {
          if (messageIdsRef.current.has(newMsg.id)) return prev;
          messageIdsRef.current.add(newMsg.id);
          return [...prev, newMsg];
        });
      }

      return true;
    } catch (err) {
      console.error('发送消息失败:', err);
      toastError('发送失败，请重试');
      return false;
    }
  };

  const markAsRead = async () => {
    if (!session) return;
    try {
      await fetch(`${API_BASE}/api/support?type=sessions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, action: 'read' })
      });
      // 乐观更新本地状态
      setSession(prev => prev ? { ...prev, unread_count: 0 } : null);
    } catch (err) {
      console.error('标记已读失败', err);
    }
  };

  // Realtime 订阅状态
  const realtimeStatusRef = useRef<string>('');

  // Realtime 订阅
  useEffect(() => {
    if (!supabase || !session) {
      console.log('[Support] Skipping Realtime subscription: supabase or session not ready');
      return;
    }

    console.log('[Support] Setting up Realtime subscription for session:', session.id);

    // 订阅 Messages 表的新增
    const channel = supabase
      .channel(`session:${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `session_id=eq.${session.id}`
        },
        (payload) => {
          console.log('[Support] Realtime: New message received:', payload);
          // 处理新消息
          const newMsgRaw = payload.new;
          const newMsg = mapDbMessageToType(newMsgRaw);

          setMessages(prev => {
            // 防止重复
            if (messageIdsRef.current.has(newMsg.id)) {
              console.log('[Support] Realtime: Message already exists, skipping');
              return prev;
            }
            messageIdsRef.current.add(newMsg.id);
            console.log('[Support] Realtime: Adding new message to list');
            return [...prev, newMsg];
          });
        }
      )
      .subscribe((status) => {
        console.log('[Support] Realtime subscription status:', status);
        realtimeStatusRef.current = status;
      });

    return () => {
      console.log('[Support] Cleaning up Realtime subscription for session:', session.id);
      supabase.removeChannel(channel);
    };
  }, [session?.id]); // 只依赖 session.id，避免不必要的重新订阅

  // 轮询备用机制：当 Realtime 不可用时，每 3 秒刷新一次消息
  useEffect(() => {
    if (!session) return;

    // 定时检查是否需要轮询
    const pollInterval = setInterval(async () => {
      // 如果 Realtime 没有正常工作（不是 SUBSCRIBED），则手动刷新
      if (realtimeStatusRef.current !== 'SUBSCRIBED') {
        console.log('[Support] Polling: Realtime not subscribed, fetching messages...');
        try {
          const res = await fetch(`${API_BASE}/api/support?type=messages&sessionId=${session.id}`);
          const result = await res.json();
          if (result.data) {
            const formattedMessages = result.data.map(mapDbMessageToType);

            // 检查是否有新消息
            const newMessages = formattedMessages.filter(
              (m: SupportMessage) => !messageIdsRef.current.has(m.id)
            );

            if (newMessages.length > 0) {
              console.log('[Support] Polling: Found', newMessages.length, 'new messages');
              // 更新消息列表
              setMessages(formattedMessages);
              // 更新 ID 集合
              messageIdsRef.current = new Set(formattedMessages.map((m: SupportMessage) => m.id));
            }
          }
        } catch (err) {
          console.error('[Support] Polling error:', err);
        }
      }
    }, 3000); // 每 3 秒检查一次

    return () => {
      clearInterval(pollInterval);
    };
  }, [session?.id]);

  return (
    <SupportContext.Provider value={{
      session,
      messages,
      loading,
      initSession,
      loadSessionById,
      sendMessage,
      markAsRead,
      refreshMessages
    }}>
      {children}
    </SupportContext.Provider>
  );
};

export const useSupport = () => {
  const context = useContext(SupportContext);
  if (context === undefined) {
    throw new Error('useSupport must be used within a SupportProvider');
  }
  return context;
};

// 辅助函数：DB 字段映射到 TS 类型
function mapDbMessageToType(dbRecord: any): SupportMessage {
  return {
    id: dbRecord.id,
    sessionId: dbRecord.session_id,
    senderId: dbRecord.sender_id,
    content: dbRecord.content,
    msgType: dbRecord.msg_type,
    isRead: dbRecord.is_read,
    createdAt: dbRecord.created_at
  };
}
