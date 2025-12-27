import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { notificationService } from '../services/apiService';
import { useUser } from './UserContext';
import { Notification } from '../types';
import { createClient } from '@supabase/supabase-js';
import NotificationToast from '../components/NotificationToast';

// Supabase 客户端（仅用于 Realtime）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, isLoggedIn } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentToast, setCurrentToast] = useState<Notification | null>(null);

  // 获取通知列表
  const refreshNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await notificationService.getNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('刷新通知列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // 获取未读数量
  const refreshUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const count = await notificationService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('刷新未读数量失败:', error);
    }
  }, [user?.id]);

  // 标记单条已读
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return;
    await notificationService.markRead(user.id, notificationId);
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [user?.id]);

  // 标记全部已读
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    await notificationService.markAllRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, [user?.id]);

  // 初始化：加载通知和未读数
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      refreshUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isLoggedIn, user?.id, refreshUnreadCount]);

  // Supabase Realtime 订阅
  useEffect(() => {
    if (!supabase) {
      console.warn('[Notification] Supabase client not initialized');
      return;
    }

    if (!user?.id) {
      console.warn('[Notification] No user ID, skipping subscription');
      return;
    }

    console.log('[Notification] Setting up Realtime subscription for user:', user.id);

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Notification] ========== NEW NOTIFICATION RECEIVED ==========');
          console.log('[Notification] Payload:', payload);

          // 新通知：增加未读数，添加到列表
          const newNotification: Notification = {
            id: payload.new.id,
            userId: payload.new.user_id,
            type: payload.new.type,
            title: payload.new.title,
            content: payload.new.content,
            isRead: payload.new.is_read,
            relatedId: payload.new.related_id,
            relatedType: payload.new.related_type,
            createdAt: payload.new.created_at,
          };

          console.log('[Notification] New notification object:', newNotification);
          console.log('[Notification] isRead:', newNotification.isRead);

          // 更新通知列表
          setNotifications(prev => {
            console.log('[Notification] Updating notifications. Previous count:', prev.length);
            const updated = [newNotification, ...prev];
            console.log('[Notification] Updated notifications count:', updated.length);
            return updated;
          });

          // 只有未读通知才增加未读数
          if (!newNotification.isRead) {
            setUnreadCount(prev => {
              console.log('[Notification] Updating unreadCount. Previous:', prev);
              const updated = prev + 1;
              console.log('[Notification] Updated unreadCount:', updated);
              return updated;
            });

            // 显示顶部 Toast 提示
            console.log('[Notification] Showing toast for new notification');
            setCurrentToast(newNotification);
          } else {
            console.log('[Notification] Notification is already read, not incrementing unreadCount');
          }

          console.log('[Notification] ========== END ==========');
        }
      )
      .subscribe((status) => {
        console.log('[Notification] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[Notification] ✅ Successfully subscribed to notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Notification] ❌ Channel error');
        } else if (status === 'TIMED_OUT') {
          console.error('[Notification] ❌ Subscription timed out');
        } else if (status === 'CLOSED') {
          console.warn('[Notification] ⚠️ Channel closed');
        }
      });

    return () => {
      console.log('[Notification] Cleaning up subscription for user:', user.id);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // 管理员专属：监听客服消息通知
  useEffect(() => {
    if (!supabase) return;
    if (!user?.id || user.role !== 'admin') return;

    console.log('[Notification] Admin: Setting up support messages subscription');

    // 订阅 support_messages 表的新增（用户发送的消息）
    const supportChannel = supabase
      .channel(`admin-support-messages:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages'
        },
        (payload) => {
          console.log('[Notification] Admin: New support message:', payload);

          // 检查是否是用户发送的（不是管理员自己发的）
          const senderId = payload.new.sender_id;
          if (senderId === user.id) {
            console.log('[Notification] Admin: Message is from self, skipping toast');
            return;
          }

          // 检查当前是否在客服聊天页面（通过 URL 判断）
          const isOnSupportPage = window.location.hash.includes('/support');
          if (isOnSupportPage) {
            console.log('[Notification] Admin: Already on support page, skipping toast');
            return;
          }

          // 显示 Toast 通知
          console.log('[Notification] Admin: Showing support message toast');
          const toastNotification: Notification = {
            id: `support-${payload.new.id}`,
            userId: user.id,
            type: 'support_message',
            title: '💬 新客服消息',
            content: payload.new.content?.slice(0, 50) + (payload.new.content?.length > 50 ? '...' : ''),
            isRead: false,
            relatedId: payload.new.session_id,
            relatedType: 'support',
            createdAt: payload.new.created_at,
          };
          setCurrentToast(toastNotification);
        }
      )
      .subscribe((status) => {
        console.log('[Notification] Admin support subscription status:', status);
      });

    return () => {
      console.log('[Notification] Admin: Cleaning up support subscription');
      supabase.removeChannel(supportChannel);
    };
  }, [user?.id, user?.role]);

  // 监听 unreadCount 变化
  useEffect(() => {
    console.log('[Notification] unreadCount changed to:', unreadCount);
  }, [unreadCount]);

  // 监听 notifications 变化
  useEffect(() => {
    console.log('[Notification] notifications changed. Count:', notifications.length);
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshNotifications,
        refreshUnreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}

      {/* 全局顶部通知提示 */}
      {currentToast && (
        <NotificationToast
          notification={currentToast}
          onClose={() => setCurrentToast(null)}
        />
      )}
    </NotificationContext.Provider>
  );
};
