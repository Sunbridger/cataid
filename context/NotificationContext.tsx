import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { notificationService } from '../services/apiService';
import { useUser } from './UserContext';
import { Notification } from '../types';
import { createClient } from '@supabase/supabase-js';

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
    </NotificationContext.Provider>
  );
};
