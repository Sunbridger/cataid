import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Loader2, Heart, Trash2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { Comment } from '../types';

const MyCommentsPage: React.FC = () => {
  const { user, isLoggedIn } = useUser();
  const [comments, setComments] = useState<(Comment & { catName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadMyComments();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, user?.id]);

  const loadMyComments = async () => {
    try {
      // 调用 API 获取用户评论
      const response = await fetch(`/api/users/${user?.id}/comments`);
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

  // 格式化时间
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

  if (!isLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <MessageCircle size={48} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">请先登录</h2>
          <p className="text-slate-500 mb-4">登录后查看您的评论</p>
          <Link
            to="/profile"
            className="inline-block px-6 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600"
          >
            去登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 头部 */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/profile"
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-slate-600" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">我的评论</h1>
      </div>

      {/* 评论列表 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="animate-spin text-slate-300" size={32} />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">还没有发表过评论</p>
            <Link
              to="/"
              className="text-brand-500 hover:underline text-sm mt-2 inline-block"
            >
              去看看猫咪们 →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {comments.map(comment => (
              <div key={comment.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  <img
                    src={comment.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.nickname)}&background=f97316&color=fff&rounded=true&size=128`}
                    alt={comment.nickname}
                    className="w-10 h-10 rounded-full bg-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700">{comment.nickname}</span>
                      <span className="text-xs text-slate-400">{formatTime(comment.createdAt)}</span>
                    </div>
                    <p className="text-slate-800 mt-1">{comment.content}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <Link
                        to={`/cat/${comment.catId}`}
                        className="text-xs text-brand-500 hover:underline"
                      >
                        查看原帖 →
                      </Link>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Heart size={12} /> {comment.likeCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCommentsPage;
