import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Check, CheckCheck, Loader2, MessageCircle, FileText, Heart, Sparkles } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useUser } from '../context/UserContext';
import { Notification, NotificationType } from '../types';

// 通知图标映射
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'application_submitted':
    case 'application_approved':
    case 'application_rejected':
    case 'new_application':
      return <FileText size={18} />;
    case 'comment_reply':
      return <MessageCircle size={18} />;
    case 'comment_like':
      return <Heart size={18} className="fill-current" />;
    case 'system':
      return <Sparkles size={18} />;
    default:
      return <Bell size={18} />;
  }
};

// 通知颜色映射
const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'new_application':
      return 'bg-orange-100 text-orange-600';
    case 'application_approved':
      return 'bg-green-100 text-green-600';
    case 'application_rejected':
      return 'bg-red-100 text-red-600';
    case 'comment_like':
      return 'bg-pink-100 text-pink-600';
    case 'comment_reply':
      return 'bg-blue-100 text-blue-600';
    case 'system':
      return 'bg-purple-100 text-purple-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
};

// 获取通知跳转链接
const getNotificationLink = (notification: Notification): string | null => {
  if (!notification.relatedId) return null;
  switch (notification.relatedType) {
    case 'cat':
      return `/cat/${notification.relatedId}`;
    case 'application':
      return `/my/applications`;
    default:
      return null;
  }
};

const NotificationsPage: React.FC = () => {
  const { isLoggedIn } = useUser();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  useEffect(() => {
    console.log('[NotificationsPage] Component mounted/updated');
    console.log('[NotificationsPage] isLoggedIn:', isLoggedIn);
    console.log('[NotificationsPage] notifications:', notifications);
    console.log('[NotificationsPage] notifications.length:', notifications.length);

    if (!isLoggedIn) {
      navigate('/profile');
      return;
    }

    // 加载通知列表
    refreshNotifications();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, navigate]); // 移除 refreshNotifications 避免无限循环

  const handleNotificationClick = async (notification: Notification) => {
    // 标记已读
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    // 跳转
    const link = getNotificationLink(notification);
    if (link) {
      navigate(link);
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-pink-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-30 px-4 py-3 flex items-center shadow-sm border-b border-slate-100 -mx-4">
        <Link to="/profile" className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold text-slate-800">消息通知</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-xs text-pink-600 font-medium bg-pink-50 px-3 py-1.5 rounded-full hover:bg-pink-100 transition-colors"
          >
            <CheckCheck size={14} />
            全部已读
          </button>
        )}
      </div>

      <div className="max-w-md mx-auto py-6">
        {(() => {
          console.log('[NotificationsPage] Rendering. notifications.length:', notifications.length);
          console.log('[NotificationsPage] Rendering. notifications:', notifications);
          return notifications.length === 0;
        })() ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100">
            <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 text-pink-300">
              <Bell size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">暂无消息</h3>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              当有新的动态时，我们会在这里通知你。
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-pink-500/30 transition-all active:scale-95"
            >
              去首页逛逛
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notification => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left bg-white rounded-2xl shadow-sm p-4 transition-all border ${notification.isRead
                  ? 'border-slate-100 opacity-70'
                  : 'border-pink-100 hover:shadow-md'
                  }`}
              >
                <div className="flex items-start gap-3">
                  {/* 图标 */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800 text-sm truncate">
                        {notification.title}
                      </span>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    {notification.content && (
                      <p className="text-slate-500 text-xs line-clamp-2">
                        {notification.content}
                      </p>
                    )}
                    <p className="text-slate-400 text-[10px] mt-1">
                      {new Date(notification.createdAt).toLocaleString('zh-CN', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* 已读标记 */}
                  {notification.isRead && (
                    <Check size={16} className="text-slate-300 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
