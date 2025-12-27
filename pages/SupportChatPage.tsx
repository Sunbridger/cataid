
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupport } from '../context/SupportContext';
import { useUser } from '../context/UserContext';
import { userService } from '../services/apiService';
import { ArrowLeft, Send, Image as ImageIcon, Smile, Loader2, User as UserIcon } from 'lucide-react';

// 对方用户信息（管理员视角下的用户）
interface TargetUserInfo {
  id: string;
  nickname: string;
  avatarUrl?: string;
}

const SupportChatPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { session, messages, loading, initSession, loadSessionById, sendMessage, markAsRead, refreshMessages } = useSupport();
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'admin';

  // 管理员视角下的用户信息
  const [targetUser, setTargetUser] = useState<TargetUserInfo | null>(null);

  // 页面加载时初始化
  useEffect(() => {
    if (!user) {
      navigate('/profile');
      return;
    }

    // 检查 URL 参数是否有 sessionId (管理员模式)
    const params = new URLSearchParams(location.search);
    const targetSessionId = params.get('sessionId');
    const targetUserId = params.get('userId');

    if (targetSessionId) {
      loadSessionById(targetSessionId, targetUserId || undefined);

      // 管理员模式：获取用户信息
      if (targetUserId) {
        userService.getUserById(targetUserId).then(userInfo => {
          if (userInfo) {
            setTargetUser({
              id: userInfo.id,
              nickname: userInfo.nickname,
              avatarUrl: userInfo.avatarUrl || undefined
            });
          }
        }).catch(err => {
          console.error('获取用户信息失败:', err);
        });
      }
    } else {
      initSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, location.search]);

  // 自动标记已读
  useEffect(() => {
    if (session?.unreadCount && session.unreadCount > 0) {
      markAsRead();
    }
  }, [session, markAsRead]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    setSending(true);
    const success = await sendMessage(inputText.trim(), 'text');
    setSending(false);

    if (success) {
      setInputText('');
    }
  };

  const handeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading && !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-pink-500 mb-2" />
        <p className="text-slate-500 text-sm">正在连接客服...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50">
      {/* 顶部导航 */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm border-b border-slate-100 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-50">
          <ArrowLeft size={24} className="text-slate-700" />
        </button>
        <div className="text-center">
          <h1 className="font-bold text-lg text-slate-800">
            {isAdmin ? (targetUser?.nickname || '回复用户') : '在线客服'}
          </h1>
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs text-slate-500">{isAdmin ? '用户在线' : '客服在线'}</span>
          </div>
        </div>
        <div className="w-10"></div> {/* 占位，保持标题居中 */}
      </div>

      {/* 消息列表区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 系统欢迎语 - 仅用户可见 */}
        {!isAdmin && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0 border border-pink-200">
                <span className="text-xs font-bold text-pink-500">客服</span>
              </div>
              <div className="bg-white p-3 rounded-2xl rounded-bl-sm shadow-sm border border-slate-100 text-slate-700 text-sm">
                您好，我是您的专属领养顾问，请问有什么可以帮您？
              </div>
            </div>
          </div>
        )}

        {/* 历史消息 */}
        {messages.map((msg) => {
          const isSelf = msg.senderId === user?.id; // 我发送的
          return (
            <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-end gap-2 max-w-[85%] ${isSelf ? 'flex-row-reverse' : ''}`}>
                {/* 头像 */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border overflow-hidden
                  ${isSelf ? 'bg-slate-200 border-slate-300' : isAdmin ? 'bg-blue-100 border-blue-200' : 'bg-pink-100 border-pink-200'}`}>
                  {isSelf ? (
                    // 我方头像
                    <img src={user?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user?.id} alt="Me" className="w-full h-full object-cover" />
                  ) : (
                    // 对方头像
                    isAdmin ? (
                      // 管理员看用户：显示用户头像
                      targetUser?.avatarUrl ? (
                        <img src={targetUser.avatarUrl} alt={targetUser.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={18} className="text-blue-500" />
                      )
                    ) : (
                      // 用户看客服：显示客服字样
                      <span className="text-xs font-bold text-pink-500">客服</span>
                    )
                  )}
                </div>

                {/* 消息气泡 */}
                <div className={`p-3 rounded-2xl shadow-sm text-sm break-words
                  ${isSelf
                    ? 'bg-pink-500 text-white rounded-br-sm'
                    : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm'
                  }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入框 */}
      <div className="bg-white p-3 border-t border-slate-100 safe-area-bottom">
        {/* 快捷回复 Chips (仅用户可见) */}
        {!isAdmin && !session?.lastMessageAt && (
          <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar mb-1">
            {['怎么领养?', '店铺地址在哪里?', '猫咪打疫苗了吗?'].map(text => (
              <button
                key={text}
                onClick={() => sendMessage(text)}
                className="whitespace-nowrap px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-full border border-slate-200 active:bg-slate-200"
              >
                {text}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <button className="p-2 text-slate-400 hover:text-pink-500 transition-colors">
            <ImageIcon size={24} />
          </button>

          <div className="flex-1 bg-slate-100 rounded-2xl px-4 py-2 min-h-[44px] flex items-center">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handeKeyPress}
              placeholder="请输入您的问题..."
              className="w-full bg-transparent border-none outline-none resize-none text-sm max-h-24 p-0 leading-relaxed placeholder:text-slate-400"
              rows={1}
              style={{ height: 'auto', minHeight: '20px' }}
              // 简单的 auto-resize
              onInput={(e: any) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className={`p-2 rounded-full transition-all ${inputText.trim()
              ? 'bg-pink-500 text-white shadow-md shadow-pink-200 active:scale-95'
              : 'bg-slate-100 text-slate-300'
              }`}
          >
            {sending ? <Loader2 size={24} className="animate-spin" /> : <Send size={20} className={inputText.trim() ? 'ml-0.5' : ''} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportChatPage;
