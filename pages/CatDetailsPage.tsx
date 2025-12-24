import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { catService, adoptionService, favoriteService } from '../services/apiService';
import { Cat, AdoptionApplication } from '../types';
import { Loader2, ArrowLeft, Heart, CheckCircle2, XCircle, Clock, X, MoreHorizontal, Share, Lock } from 'lucide-react';
import CatImageGallery from '../components/CatImageGallery';
import CommentSection from '../components/CommentSection';

import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';

const CatDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { success, error } = useToast();
  const { user, isLoggedIn, isGuest } = useUser();

  // 是否可以申请领养（登录且非游客）
  const canApply = isLoggedIn && !isGuest;

  // 使用 SWR Hook 获取猫咪数据
  const [cat, setCat] = useState<Cat | null>(null);
  const [loading, setLoading] = useState(true);

  // Adoption State
  const [isAdoptModalOpen, setIsAdoptModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myApplication, setMyApplication] = useState<AdoptionApplication | null>(null);
  const [adoptForm, setAdoptForm] = useState({
    name: '',
    contact: '',
    reason: ''
  });

  // 收藏状态
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [showMenu, setShowMenu] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${cat?.name} 正在寻找一个家 | 猫猫领养平台`;
    const text = `不论是流浪还是被遗弃，每一只猫咪都值得被温柔以待。来看看 ${cat?.name} 吧！`;

    setShowMenu(false);

    // 1. Try Native Share (Mobile)
    // 这是实现"直接提示发送内容"的唯一 Web 标准途径
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // User aborted or error, fall through
      }
    }

    // 2. Fallback: Copy to Clipboard
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      success('链接已复制！去微信分享给朋友吧。');

      // 3. Try to open WeChat (Deep Link)
      // Only if on mobile and not seemingly in a desktop browser
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        setTimeout(() => {
          window.location.href = 'weixin://';
        }, 500);
      }
    } catch (err) {
      error('复制失败，请手动复制浏览器链接分享。');
    }
  };

  // 检查收藏状态
  const checkFavoriteStatus = async () => {
    if (!user?.id || !id) return;

    try {
      const favorited = await favoriteService.isFavorited(user.id, id);
      setIsFavorited(favorited);
    } catch (err) {
      console.error('检查收藏状态失败:', err);
    }
  };

  // 处理收藏/取消收藏
  const handleToggleFavorite = async () => {
    if (!user?.id || !id) {
      error('请先登录');
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        // 取消收藏
        const result = await favoriteService.removeFavorite(user.id, id);
        if (result) {
          setIsFavorited(false);
          success('已取消收藏');
        }
      } else {
        // 添加收藏
        const result = await favoriteService.addFavorite(user.id, id);
        if (result) {
          setIsFavorited(true);
          success('收藏成功');
        }
      }
    } catch (err) {
      console.error('收藏操作失败:', err);
      error('操作失败，请重试');
    } finally {
      setFavoriteLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadCat(id);
      checkMyApplication(id);
      checkFavoriteStatus();
    }
  }, [id, user?.id]);

  const loadCat = async (catId: string) => {
    try {
      const data = await catService.getById(catId);
      if (data) setCat(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const checkMyApplication = async (catId: string) => {
    // 1. Get local record to find if we applied
    const storedApps = JSON.parse(localStorage.getItem('my_applications') || '[]');
    const localApp = storedApps.find((app: AdoptionApplication) => app.catId === catId);

    if (localApp) {
      // Optimistically set local app first
      setMyApplication(localApp);

      // 2. Then fetch fresh data to get latest status from server/mock
      try {
        const freshApp = await adoptionService.getApplicationById(localApp.id);
        if (freshApp) {
          setMyApplication(freshApp);

          // Sync back to local storage to keep it updated
          const newStoredApps = storedApps.map((a: AdoptionApplication) =>
            a.id === freshApp.id ? freshApp : a
          );
          localStorage.setItem('my_applications', JSON.stringify(newStoredApps));
        }
      } catch (e) {
        console.error("Failed to sync application status", e);
      }
    }
  };

  const handleAdoptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cat) return;

    setSubmitting(true);
    try {
      const newApp = await adoptionService.submitApplication({
        catId: cat.id,
        catName: cat.name,
        catImage: cat.image_url.split(',')[0],
        applicantName: adoptForm.name,
        contactInfo: adoptForm.contact,
        reason: adoptForm.reason
      });

      // Update Local Storage
      const storedApps = JSON.parse(localStorage.getItem('my_applications') || '[]');
      localStorage.setItem('my_applications', JSON.stringify([...storedApps, newApp]));

      // 触发首页缓存刷新（猫咪状态可能变为"待定"）
      localStorage.setItem('cat_data_update_ts', Date.now().toString());
      window.dispatchEvent(new Event('cat-data-updated'));

      setMyApplication(newApp);
      setIsAdoptModalOpen(false);

      // Refresh cat data to show status change if needed
      loadCat(cat.id);
      success('申请已提交，请耐心等待审核！');

    } catch (err) {
      console.error(err);
      error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  if (!cat) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-800">未找到该猫咪</h2>
        <Link to="/" className="text-brand-600 mt-4 inline-block hover:underline">返回首页</Link>
      </div>
    );
  }

  const status = cat.status || '可领养';
  const isAdopted = status === '已领养';

  // Render Status Badge Logic
  const renderApplicationStatus = () => {
    if (!myApplication) return null;

    if (myApplication.status === 'pending') {
      return (
        <div className="w-full py-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex flex-col items-center justify-center gap-2 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Clock className="animate-pulse" /> 申请审核中
          </div>
          <p className="text-sm opacity-80">志愿者正在审核您的申请，请保持电话畅通</p>
        </div>
      );
    }
    if (myApplication.status === 'approved') {
      return (
        <div className="w-full py-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex flex-col items-center justify-center gap-2 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-2 font-bold text-lg">
            <CheckCircle2 /> 恭喜！申请通过
          </div>
          <p className="text-sm opacity-80">您的领养申请已通过，我们将尽快联系您交接。</p>
        </div>
      );
    }
    if (myApplication.status === 'rejected') {
      return (
        <div className="w-full py-4 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl flex flex-col items-center justify-center gap-2 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-2 font-bold text-lg">
            <XCircle /> 申请未通过
          </div>
          <p className="text-sm opacity-80">很抱歉，根据目前情况我们无法通过您的申请。</p>
        </div>
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto relative pt-10 md:pt-0">
      {/* Mobile App-like Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md shadow-sm z-30 flex items-center justify-between px-4 border-b border-slate-100">
        <div className="flex items-center gap-2 overflow-hidden">
          <Link to="/" className="p-2 -ml-2 text-slate-800 active:bg-slate-100 rounded-full transition-colors flex-shrink-0">
            <ArrowLeft size={24} />
          </Link>
          <span className="font-bold text-lg truncate">{cat.name} 的档案</span>
        </div>

        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 -mr-2 text-slate-600 active:bg-slate-100 rounded-full transition-colors"
          >
            <MoreHorizontal size={24} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <button
                  onClick={handleShare}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 flex items-center gap-3"
                >
                  <Share size={18} className="text-brand-500" />
                  分享详情
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Desktop Back Button */}
      <Link to="/" className="hidden md:inline-flex items-center text-slate-500 hover:text-brand-600 mb-6 font-medium transition-colors">
        <ArrowLeft size={18} className="mr-1" /> 返回列表
      </Link>

      <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100 flex flex-col md:flex-row">
        {/* Image Side */}
        <div className="md:w-1/2 bg-slate-100 relative h-96 md:h-auto group">
          <CatImageGallery
            images={cat.image_url.split(',')}
            name={cat.name}
            isAdopted={isAdopted}
          />
        </div>

        {/* Info Side */}
        <div className="md:w-1/2 p-6 md:p-10 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${cat.is_stray ? 'bg-orange-400' : 'bg-brand-500'}`}>
                  {cat.is_stray ? '流浪' : '家养'}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${status === '可领养' ? 'bg-green-100 text-green-700' :
                  status === '待定' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                  {status}
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-1">{cat.name}</h1>
              <div className="flex items-center gap-3 text-slate-500 font-medium text-sm md:text-base mt-2">
                <span className="bg-slate-100 px-2 py-1 rounded">{cat.age} 岁</span>
                <span className="bg-slate-100 px-2 py-1 rounded">{cat.gender === 'Male' ? '男孩' : '女孩'}</span>
                <span className="bg-slate-100 px-2 py-1 rounded">{cat.breed}</span>
              </div>
            </div>
            <button
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              className={`p-2 md:p-3 rounded-full transition-all ${isFavorited
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-red-50 text-red-500 hover:bg-red-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isFavorited ? '取消收藏' : '收藏'}
            >
              <Heart
                size={20}
                className="md:w-6 md:h-6"
                fill={isFavorited ? "currentColor" : "none"}
              />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {cat.is_vaccinated && <span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-semibold">已接种</span>}
            {cat.is_sterilized && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold">已绝育</span>}
            {cat.is_dewormed && <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-lg text-sm font-semibold">已驱虫</span>}

            {cat.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-lg text-sm font-semibold">
                {tag}
              </span>
            ))}
          </div>

          <div className="prose prose-slate mb-6 text-slate-600 leading-relaxed">
            <p>{cat.description}</p>
          </div>

          <div className="mt-auto space-y-4">
            {renderApplicationStatus()}

            {(!myApplication && !isAdopted) && (
              canApply ? (
                <button
                  className={`w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 transition-all flex justify-center items-center gap-2
                   ${status !== '可领养' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => setIsAdoptModalOpen(true)}
                  disabled={status !== '可领养'}
                >
                  {status === '待定' ? '已有其他人正在申请' : `领养 ${cat.name}`}
                </button>
              ) : (
                <Link
                  to="/profile"
                  className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl flex justify-center items-center gap-2 transition-colors"
                >
                  <Lock size={18} />
                  {!isLoggedIn ? '登录后申请领养' : '绑定手机号后申请领养'}
                </Link>
              )
            )}

            {(!myApplication && isAdopted) && (
              <div className="w-full py-3.5 bg-slate-100 text-slate-500 font-bold rounded-xl flex justify-center items-center gap-2 cursor-not-allowed">
                <CheckCircle2 size={20} />
                {cat.name} 找到了永远的家
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 评论区 */}
      <CommentSection cat={cat} />

      {/* Adoption Modal */}
      {isAdoptModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">申请领养 {cat.name}</h3>
              <button
                onClick={() => setIsAdoptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAdoptSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">您的称呼</label>
                <input
                  required
                  type="text"
                  value={adoptForm.name}
                  onChange={e => setAdoptForm({ ...adoptForm, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  placeholder="怎么称呼您？"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">联系方式</label>
                <input
                  required
                  type="text"
                  value={adoptForm.contact}
                  onChange={e => setAdoptForm({ ...adoptForm, contact: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  placeholder="手机号或微信号"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">领养理由 / 养宠经验</label>
                <textarea
                  required
                  value={adoptForm.reason}
                  onChange={e => setAdoptForm({ ...adoptForm, reason: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-none"
                  placeholder="简单介绍一下您的家庭环境和养宠经验..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      提交中...
                    </>
                  ) : '提交申请'}
                </button>
                <p className="text-xs text-slate-400 text-center mt-3">
                  提交申请即代表您承诺善待动物，接受定期回访。
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatDetailsPage;