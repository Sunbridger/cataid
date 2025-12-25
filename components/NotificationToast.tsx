import React, { useEffect, useState } from 'react';
import { X, Bell, MessageCircle, FileText, Heart, Sparkles } from 'lucide-react';
import { Notification, NotificationType } from '../types';
import { useNavigate } from 'react-router-dom';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
}

// 通知图标映射
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'application_submitted':
    case 'application_approved':
    case 'application_rejected':
      return <FileText size={20} />;
    case 'comment_reply':
      return <MessageCircle size={20} />;
    case 'comment_like':
      return <Heart size={20} className="fill-current" />;
    case 'system':
      return <Sparkles size={20} />;
    default:
      return <Bell size={20} />;
  }
};

// 通知颜色映射
const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'application_approved':
      return 'from-green-500 to-emerald-500';
    case 'application_rejected':
      return 'from-red-500 to-rose-500';
    case 'comment_like':
      return 'from-pink-500 to-rose-500';
    case 'comment_reply':
      return 'from-blue-500 to-indigo-500';
    case 'system':
      return 'from-purple-500 to-violet-500';
    default:
      return 'from-slate-500 to-slate-600';
  }
};

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 进入动画
    setTimeout(() => setIsVisible(true), 10);

    // 5秒后自动关闭
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const handleClick = () => {
    // 跳转到通知页面
    navigate('/notifications');
    handleClose();
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] flex justify-center px-4 pt-4 pointer-events-none transition-all duration-300 ${isVisible && !isLeaving ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
    >
      <div
        onClick={handleClick}
        className={`
          pointer-events-auto
          max-w-md w-full
          bg-white/95 backdrop-blur-xl
          rounded-2xl
          shadow-2xl shadow-black/10
          border border-white/20
          overflow-hidden
          cursor-pointer
          transform transition-all duration-300
          hover:scale-[1.02] hover:shadow-2xl
          active:scale-[0.98]
        `}
      >
        {/* 顶部渐变条 */}
        <div className={`h-1 bg-gradient-to-r ${getNotificationColor(notification.type)}`} />

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* 图标 */}
            <div className={`
              flex-shrink-0
              w-12 h-12
              rounded-xl
              bg-gradient-to-br ${getNotificationColor(notification.type)}
              flex items-center justify-center
              text-white
              shadow-lg
            `}>
              {getNotificationIcon(notification.type)}
            </div>

            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-bold text-slate-800 text-sm leading-tight">
                  {notification.title}
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {notification.content && (
                <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                  {notification.content}
                </p>
              )}

              <p className="text-slate-400 text-[10px] mt-2">
                刚刚
              </p>
            </div>
          </div>
        </div>

        {/* 底部进度条 */}
        <div className="h-1 bg-slate-100">
          <div
            className={`h-full bg-gradient-to-r ${getNotificationColor(notification.type)} animate-[shrink_5s_linear]`}
            style={{
              animation: 'shrink 5s linear forwards'
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;
