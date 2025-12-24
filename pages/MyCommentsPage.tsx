import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Loader2, Heart, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { Comment } from '../types';

const MyCommentsPage: React.FC = () => {
  const { user, isLoggedIn } = useUser();
  const navigate = useNavigate();
  const [comments, setComments] = useState<(Comment & { catName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/profile');
      return;
    }
    if (user?.id) {
      loadMyComments();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, user?.id, navigate]);

  const loadMyComments = async () => {
    try {
      const response = await fetch(`/api/user?action=comments&userId=${user?.id}`);
      if (response.ok) {
        const result = await response.json();
        setComments(result.data || []);
      }
    } catch (error) {
      console.error('加载评论失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-pink-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 标准顶部导航栏 */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-30 px-4 py-3 flex items-center shadow-sm border-b border-slate-100 -mx-4">
        <Link to="/profile" className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold text-slate-800 pr-10">我的评论</h1>
      </div>

      <div className="max-w-md mx-auto py-6">
        {comments.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100">
            <div className="w-24 h-24 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <MessageCircle size={40} className="text-sky-300" />
              <div className="absolute top-0 right-0 bg-white p-1.5 rounded-full shadow-sm">
                <Sparkles size={16} className="text-yellow-400 fill-yellow-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">暂无评论</h3>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              在猫咪的详情页留下您的足迹，和大家一起交流吧。
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-pink-500/30 transition-all active:scale-95"
            >
              去看看猫咪
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {comments.map(comment => (
                <div key={comment.id} className="p-5 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-start gap-3">
                    <img
                      src={comment.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.nickname)}&background=f97316&color=fff&rounded=true&size=128`}
                      alt={comment.nickname}
                      className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700">{comment.nickname}</span>
                        <span className="text-xs text-slate-400">{formatTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-slate-800 text-sm leading-relaxed mb-3">{comment.content}</p>

                      <div className="flex items-center justify-between">
                        <Link
                          to={`/cat/${comment.catId}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-pink-500 bg-pink-50 px-2 py-1 rounded-lg hover:bg-pink-100 transition-colors"
                        >
                          查看原帖
                        </Link>

                        <div className="flex items-center gap-4">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Heart size={14} className={comment.likeCount > 0 ? "fill-rose-400 text-rose-400" : ""} />
                            {comment.likeCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCommentsPage;
