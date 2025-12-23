import React, { useState, useEffect, useRef } from 'react';
import { Comment, NewCommentInput, Cat } from '../types';
import { commentService } from '../services/apiService';
import { generateCommentReply } from '../services/geminiService';
import { Heart, Send, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface CommentSectionProps {
  cat: Cat;
}

// 随机生成可爱的默认头像
const getRandomAvatar = (nickname: string) => {
  const colors = ['f97316', 'ec4899', '8b5cf6', '06b6d4', '10b981', '3b82f6'];
  const color = colors[nickname.length % colors.length];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=${color}&color=fff&rounded=true&bold=true&size=128`;
};

// 格式化时间显示
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

  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
};

// 单条评论组件
const CommentItem: React.FC<{
  comment: Comment;
  onReply: (parentId: string, parentNickname: string) => void;
  onLike: (commentId: string) => void;
  likedComments: Set<string>;
  isReply?: boolean;
}> = ({ comment, onReply, onLike, likedComments, isReply = false }) => {
  const [showReplies, setShowReplies] = useState(true);
  const isLiked = likedComments.has(comment.id);

  return (
    <div>
      <div className={`flex gap-3 ${isReply ? 'py-1.5 ml-12' : 'py-3'}`}>
        {/* 头像 */}
        <div className="flex-shrink-0">
          <img
            src={comment.avatarUrl || getRandomAvatar(comment.nickname)}
            alt={comment.nickname}
            className={`rounded-full object-cover bg-slate-200 ${isReply ? 'w-7 h-7' : 'w-9 h-9'}`}
          />
        </div>

        {/* 内容区域 */}
        <div className="flex-1 min-w-0">
          {/* 用户名和标签 */}
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-medium text-slate-500 ${isReply ? 'text-xs' : 'text-sm'}`}>
              {comment.nickname}
            </span>
            {comment.isAiReply && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded-full">
                <Sparkles size={8} />
                AI
              </span>
            )}
          </div>

          {/* 评论内容 */}
          <p className={`text-slate-800 leading-relaxed whitespace-pre-wrap break-words ${isReply ? 'text-sm' : 'text-[15px]'}`}>
            {comment.content}
          </p>

          {/* 底部操作栏 */}
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            <span>{formatTime(comment.createdAt)}</span>

            {!isReply && (
              <button
                onClick={() => onReply(comment.id, comment.nickname)}
                className="hover:text-slate-600 transition-colors"
              >
                回复
              </button>
            )}
          </div>
        </div>

        {/* 右侧点赞按钮 */}
        <div className="flex-shrink-0 flex flex-col items-center pt-1">
          <button
            onClick={() => onLike(comment.id)}
            className={`flex flex-col items-center gap-0.5 transition-colors ${isLiked ? 'text-red-500' : 'text-slate-300 hover:text-slate-400'}`}
          >
            <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
            <span className="text-[10px]">{(comment.likeCount || 0) + (isLiked ? 1 : 0) || ''}</span>
          </button>
        </div>
      </div>

      {/* 子评论 */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.length > 2 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 text-xs text-brand-600 font-medium mb-2 hover:text-brand-700"
            >
              {showReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showReplies ? '收起回复' : `展开 ${comment.replies.length} 条回复`}
            </button>
          )}

          {(showReplies || comment.replies.length <= 2) && (
            <div className="space-y-0">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onLike={onLike}
                  likedComments={likedComments}
                  isReply={true}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CommentSection: React.FC<CommentSectionProps> = ({ cat }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [nickname, setNickname] = useState('');
  const [showNicknameInput, setShowNicknameInput] = useState(false);
  const [replyTo, setReplyTo] = useState<{ parentId: string; nickname: string } | null>(null);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 加载评论
  useEffect(() => {
    loadComments();
    // 从 localStorage 读取已点赞的评论
    const liked = JSON.parse(localStorage.getItem(`liked_comments_${cat.id}`) || '[]');
    setLikedComments(new Set(liked));
    // 从 localStorage 读取昵称
    const savedNickname = localStorage.getItem('comment_nickname');
    if (savedNickname) {
      setNickname(savedNickname);
    }
  }, [cat.id]);

  const loadComments = async (silent = false) => {
    // 静默刷新时不显示 loading 状态，避免白屏闪烁
    if (!silent) {
      setLoading(true);
    }
    const data = await commentService.getCommentsByCatId(cat.id);

    // 组装父子评论关系
    const topLevelComments: Comment[] = [];
    const replyMap = new Map<string, Comment[]>();

    data.forEach(comment => {
      if (!comment.parentId) {
        topLevelComments.push({ ...comment, replies: [] });
      } else {
        if (!replyMap.has(comment.parentId)) {
          replyMap.set(comment.parentId, []);
        }
        replyMap.get(comment.parentId)!.push(comment);
      }
    });

    // 将回复挂载到父评论
    topLevelComments.forEach(comment => {
      comment.replies = replyMap.get(comment.id) || [];
    });

    // 按时间倒序
    topLevelComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setComments(topLevelComments);
    setLoading(false);
  };

  const handleReply = (parentId: string, parentNickname: string) => {
    setReplyTo({ parentId, nickname: parentNickname });
    setInputValue(`@${parentNickname} `);
    inputRef.current?.focus();
  };

  const handleLike = async (commentId: string) => {
    if (likedComments.has(commentId)) return;

    const newLiked = new Set(likedComments);
    newLiked.add(commentId);
    setLikedComments(newLiked);
    localStorage.setItem(`liked_comments_${cat.id}`, JSON.stringify([...newLiked]));

    // 后台调用 API（无需等待）
    commentService.likeComment(commentId);
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    // 检查昵称
    if (!nickname.trim()) {
      setShowNicknameInput(true);
      return;
    }

    setSubmitting(true);

    const commentInput: NewCommentInput = {
      catId: cat.id,
      parentId: replyTo?.parentId || null,
      nickname: nickname.trim(),
      content: inputValue.trim(),
    };

    const newComment = await commentService.submitComment(commentInput);

    if (newComment) {
      // 清空输入
      setInputValue('');
      setReplyTo(null);

      // 刷新评论列表
      await loadComments(true);

      // 触发 AI 回复（仅对顶级评论）
      if (!replyTo?.parentId) {
        generateAiReply(newComment);
      }
    }

    setSubmitting(false);
  };

  // AI 自动回复
  const generateAiReply = async (userComment: Comment) => {
    try {
      const aiReplyContent = await generateCommentReply(
        cat.name,
        cat.breed,
        userComment.content
      );

      // 提交 AI 回复
      const aiCommentInput: NewCommentInput = {
        catId: cat.id,
        parentId: userComment.id,
        nickname: `${cat.name}的小助手`,
        content: aiReplyContent,
      };

      // 在后端需要标记为 AI 回复，这里通过特殊参数传递
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...aiCommentInput, isAiReply: true }),
      });

      // 刷新评论
      await loadComments(true);
    } catch (error) {
      console.error('AI回复生成失败:', error);
    }
  };

  const saveNickname = () => {
    if (nickname.trim()) {
      localStorage.setItem('comment_nickname', nickname.trim());
      setShowNicknameInput(false);
      // 重新触发提交
      handleSubmit();
    }
  };

  const totalComments = comments.reduce(
    (sum, c) => sum + 1 + (c.replies?.length || 0),
    0
  );

  return (
    <div className="mt-8">
      {/* 头部 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base font-bold text-slate-800">共 {totalComments} 条评论</span>
      </div>

      {/* 输入区域 - 顶部显示 */}
      <div className="flex items-start gap-3 mb-6 pb-4 border-b border-slate-100">
        <img
          src={nickname ? getRandomAvatar(nickname) : 'https://ui-avatars.com/api/?name=?&background=e2e8f0&color=94a3b8&rounded=true&size=128'}
          alt="我"
          className="w-9 h-9 rounded-full bg-slate-200 flex-shrink-0"
        />
        <div className="flex-1">
          {/* 昵称输入弹窗 */}
          {showNicknameInput && (
            <div className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-sm text-slate-600 mb-2">第一次评论？给自己起个昵称吧~</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="输入昵称..."
                  maxLength={20}
                  className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                  autoFocus
                />
                <button
                  onClick={saveNickname}
                  className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors"
                >
                  确定
                </button>
              </div>
            </div>
          )}

          {/* 回复提示 */}
          {replyTo && (
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">
                回复 <span className="text-brand-600 font-medium">@{replyTo.nickname}</span>
              </span>
              <button
                onClick={() => {
                  setReplyTo(null);
                  setInputValue('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                取消
              </button>
            </div>
          )}

          {/* 输入框 */}
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="说点什么吧..."
              rows={1}
              className="flex-1 px-4 py-2.5 rounded-full bg-slate-100 border-0 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white resize-none text-sm leading-relaxed"
              style={{ minHeight: '40px', maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !inputValue.trim()}
              className="p-2.5 bg-brand-500 text-white rounded-full hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 评论列表 */}
      <div>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-slate-300" size={24} />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">还没有评论，快来抢沙发吧！</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={handleReply}
                onLike={handleLike}
                likedComments={likedComments}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
