import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, Loader2, MessageCircle, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { commentLikeService } from '../services/apiService';
import { Comment } from '../types';

interface LikedComment extends Comment {
  catName?: string;
}

const MyLikesPage: React.FC = () => {
  const { user, isLoggedIn } = useUser();
  const navigate = useNavigate();
  const [likedComments, setLikedComments] = useState<LikedComment[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载点赞的评论
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/profile');
      return;
    }
    if (user?.id) {
      loadLikedComments();
    } else {
      setLoading(false);
    }
  }, [user?.id, isLoggedIn, navigate]);

  const loadLikedComments = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await commentLikeService.getUserLikes(user.id);

      // 转换数据格式
      const comments: LikedComment[] = data
        .filter(like => like.comment) // 过滤掉没有评论数据的项
        .map(like => ({
          id: like.comment.id,
          catId: like.comment.catId,
          userId: like.comment.userId,
          parentId: like.comment.parentId,
          nickname: like.comment.nickname,
          avatarUrl: like.comment.avatarUrl,
          content: like.comment.content,
          isAiReply: like.comment.isAiReply,
          likeCount: like.comment.likeCount,
          createdAt: like.comment.createdAt,
          catName: like.comment.catName,
        }));

      setLikedComments(comments);
    } catch (error) {
      console.error('加载点赞评论失败:', error);
    } finally {
      setLoading(false);
    }
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
        <h1 className="flex-1 text-center text-lg font-bold text-slate-800 pr-10">我的点赞</h1>
      </div>

      <div className="max-w-md mx-auto py-6">
        {likedComments.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100">
            <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 text-pink-300 relative">
              <ThumbsUp size={40} className="fill-pink-200" />
              <div className="absolute top-0 right-0 bg-white p-1.5 rounded-full shadow-sm">
                <Sparkles size={16} className="text-yellow-400 fill-yellow-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">还没有点赞的评论</h3>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              去看看猫咪们的评论区，为精彩的发言点个赞吧。
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-pink-500/30 transition-all active:scale-95"
            >
              遇见喵星人
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {likedComments.map(comment => (
              <div
                key={comment.id}
                className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow border border-slate-100"
              >
                {/* 评论者信息 */}
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={comment.avatarUrl || 'https://ui-avatars.com/api/?name=U&background=e2e8f0&color=94a3b8&rounded=true&size=128'}
                    alt={comment.nickname}
                    className="w-10 h-10 rounded-full object-cover border border-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-700 text-sm">{comment.nickname}</span>
                      {comment.isAiReply && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] rounded-md font-bold">
                          AI
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{comment.content}</p>
                  </div>
                </div>

                {/* 底部信息 */}
                <div className="flex items-center justify-between text-xs text-slate-400 pl-13 pt-2 border-t border-slate-50 mt-2">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-pink-500 font-medium">
                      <ThumbsUp size={12} className="fill-pink-500" />
                      {comment.likeCount}
                    </span>
                    {comment.catName && (
                      <Link
                        to={`/cat/${comment.catId}`}
                        className="flex items-center gap-1 hover:text-pink-500 transition-colors bg-slate-50 px-2 py-1 rounded-lg"
                      >
                        <MessageCircle size={12} />
                        来自 {comment.catName}
                      </Link>
                    )}
                  </div>
                  <span>{new Date(comment.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default MyLikesPage;
