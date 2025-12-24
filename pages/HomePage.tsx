import React, { useEffect, useState, useMemo } from 'react';
import { catService, favoriteService } from '../services/apiService';
import { Cat } from '../types';
import CatCard from '../components/CatCard';
import { Loader2, Search } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';

const HomePage: React.FC = () => {
  const { user } = useUser();
  const { success, error: toastError } = useToast();
  const [cats, setCats] = useState<Cat[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCats();

    // Listen for global data updates
    const handleDataUpdate = () => {
      fetchCats(true);
    };

    window.addEventListener('cat-data-updated', handleDataUpdate);
    return () => {
      window.removeEventListener('cat-data-updated', handleDataUpdate);
    };
  }, []);

  // 加载用户收藏
  useEffect(() => {
    if (user?.id) {
      loadFavorites();
    } else {
      setFavoriteIds(new Set());
    }
  }, [user?.id]);

  const loadFavorites = async () => {
    if (!user?.id) return;
    try {
      const favorites = await favoriteService.getUserFavorites(user.id);
      setFavoriteIds(new Set(favorites.map(fav => fav.catId)));
    } catch (err) {
      console.error('加载收藏失败:', err);
    }
  };

  // Pull to refresh state
  const [touchStart, setTouchStart] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const PULL_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setTouchStart(e.targetTouches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchY = e.targetTouches[0].clientY;
    const distance = touchY - touchStart;

    if (touchStart > 0 && window.scrollY === 0 && distance > 0) {
      // Add resistance
      setPullDistance(distance * 0.4);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > PULL_THRESHOLD) {
      setRefreshing(true);
      // 强制刷新，传入 true
      await fetchCats(true);
      setRefreshing(false);
    }
    setTouchStart(0);
    setPullDistance(0);
  };

  const fetchCats = async (force = false) => {
    try {
      // 如果不是强制刷新（即首次加载），才显示全屏 loading
      if (!force) setLoading(true);
      const data = await catService.getAll(force);
      setCats(data);
      if (force) success('已刷新最新数据');
    } catch (err) {
      setError('加载喵星人失败，请稍后再试。');
      if (force) toastError('刷新失败');
    } finally {
      setLoading(false);
    }
  };

  // Sort cats: Available first, then Pending, then Adopted
  const sortedCats = useMemo(() => {
    const statusPriority: Record<string, number> = {
      '可领养': 0,
      '待定': 1,
      '已领养': 2
    };

    return [...cats].sort((a, b) => {
      const statusA = a.status || '可领养';
      const statusB = b.status || '可领养';

      if (statusPriority[statusA] !== statusPriority[statusB]) {
        return statusPriority[statusA] - statusPriority[statusB];
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [cats]);

  const filteredCats = sortedCats.filter(cat => {
    // Handle special boolean filters from the quick tags
    if (searchTerm === '家养') return !cat.is_stray;
    if (searchTerm === '已接种') return cat.is_vaccinated;
    if (searchTerm === '已驱虫') return cat.is_dewormed;
    if (searchTerm === '已绝育') return cat.is_sterilized;

    // Default search behavior
    return (
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div
      className="flex flex-col gap-1"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-transform duration-300"
        style={{
          transform: `translateY(${refreshing ? 10 : Math.min(pullDistance - 60, -60)}px)`, // 默认隐藏在 -60px
          opacity: pullDistance > 0 || refreshing ? 1 : 0
        }}
      >
        <div className="bg-white/90 backdrop-blur rounded-full p-2 shadow-md border border-slate-100 flex items-center gap-2">
          <Loader2 className={`text-pink-500 ${refreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 2}deg)` }} size={20} />
          {refreshing && <span className="text-xs text-slate-500 font-medium pr-1">刷新中...</span>}
        </div>
      </div>

      {/* Header Section */}
      <div className="flex flex-col gap-3 sticky top-0 bg-slate-50/95 backdrop-blur-sm z-30 -mx-4 px-4 pb-2 md:static md:bg-transparent md:p-0">
        <div className="flex items-center gap-3 pt-2 md:block md:pt-0">
          <h1 className="text-lg font-extrabold text-slate-800 tracking-tight md:hidden flex-shrink-0">
            发现<span className="text-pink-500">喵</span>
          </h1>

          {/* Search Bar */}
          <div className="relative group flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-pink-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-4 py-2 border-none rounded-2xl bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 shadow-[0_2px_10px_rgb(0,0,0,0.03)] transition-shadow"
              placeholder="搜索品种、名字..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Tags */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide select-none transition-all">
          <button
            onClick={() => setSearchTerm('')}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap
              ${searchTerm === ''
                ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md transform scale-105'
                : 'bg-white text-slate-600 border border-slate-100 shadow-sm'
              }`}
          >
            全部
          </button>
          {['家养', '已接种', '已驱虫', '已绝育'].map(tag => {
            const isActive = searchTerm === tag;
            return (
              <button
                key={tag}
                onClick={() => setSearchTerm(isActive ? '' : tag)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap
                  ${isActive
                    ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md transform scale-105'
                    : 'bg-white text-slate-600 border border-slate-100 shadow-sm'
                  }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <section className="min-h-[500px]">


        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-pink-500">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p className="text-slate-500">正在召唤喵星人...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 rounded-xl border border-red-100 text-red-600">
            {error}
          </div>
        ) : filteredCats.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-400 text-lg">没有找到符合条件的猫咪。</p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-pink-500 font-medium hover:underline"
            >
              清除筛选条件
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {filteredCats.map(cat => (
              <CatCard
                key={cat.id}
                cat={cat}
                isFavorited={favoriteIds.has(cat.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;