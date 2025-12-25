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
    if (!supabase || !user?.id) return;

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
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

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
