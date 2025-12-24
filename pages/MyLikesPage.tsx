import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, Loader2, MessageCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { commentLikeService } from '../services/apiService';
import { Comment } from '../types';

interface LikedComment extends Comment {
  catName?: string;
}

const MyLikesPage: React.FC = () => {
  const { user, isLoggedIn } = useUser();
  const [likedComments, setLikedComments] = useState<LikedComment[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载点赞的评论
  useEffect(() => {
    if (user?.id) {
      loadLikedComments();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

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

  if (!isLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <ThumbsUp size={48} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">请先登录</h2>
          <p className="text-slate-500 mb-4">登录后查看您点赞的评论</p>
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
        <h1 className="text-2xl font-bold text-slate-800">我的点赞</h1>
        {!loading && likedComments.length > 0 && (
          <span className="text-sm text-slate-500">({likedComments.length})</span>
        )}
      </div>

      {/* 加载中 */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-sm py-16 text-center">
          <Loader2 size={32} className="text-brand-500 mx-auto mb-2 animate-spin" />
          <p className="text-slate-400">加载中...</p>
        </div>
      )}

      {/* 空状态 */}
      {!loading && likedComments.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm text-center py-16">
          <ThumbsUp size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">还没有点赞的评论</p>
          <p className="text-slate-400 text-sm mb-4">去看看猫咪们的评论区吧</p>
          <Link
            to="/"
            className="text-brand-500 hover:underline text-sm"
          >
            去看看可爱的猫咪们 →
          </Link>
        </div>
      )}

      {/* 点赞列表 */}
      {!loading && likedComments.length > 0 && (
        <div className="space-y-4">
          {likedComments.map(comment => (
            <div
              key={comment.id}
              className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              {/* 评论者信息 */}
              <div className="flex items-start gap-3 mb-3">
                <img
                  src={comment.avatarUrl || 'https://ui-avatars.com/api/?name=U&background=e2e8f0&color=94a3b8&rounded=true&size=128'}
                  alt={comment.nickname}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-800">{comment.nickname}</span>
                    {comment.isAiReply && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full">
                        AI
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">{comment.content}</p>
                </div>
              </div>

              {/* 底部信息 */}
              <div className="flex items-center justify-between text-xs text-slate-400 pl-13">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <ThumbsUp size={14} className="text-brand-500" fill="currentColor" />
                    {comment.likeCount}
                  </span>
                  {comment.catName && (
                    <Link
                      to={`/cat/${comment.catId}`}
                      className="flex items-center gap-1 hover:text-brand-500 transition-colors"
                    >
                      <MessageCircle size={14} />
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

      {/* 提示信息 */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
        <p className="text-sm text-green-800">
          ✅ <strong>云端同步已启用：</strong>您的点赞数据已保存到云端，可在不同设备间同步。
        </p>
      </div>
    </div>
  );
};

export default MyLikesPage;
