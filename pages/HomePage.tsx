import React, { useEffect, useState, useMemo } from 'react';
import { catService } from '../services/apiService';
import { Cat } from '../types';
import CatCard from '../components/CatCard';
import { Loader2, Search } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const HomePage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCats();

    // Listen for global data updates (e.g. from background upload in AddCatPage)
    const handleDataUpdate = () => {
      fetchCats();
    };

    window.addEventListener('cat-data-updated', handleDataUpdate);
    return () => {
      window.removeEventListener('cat-data-updated', handleDataUpdate);
    };
  }, []);

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
      className="space-y-8"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      {/* Pull to Refresh Indicator */}
      <div
        className="fixed top-16 left-0 right-0 z-50 flex justify-center pointer-events-none transition-transform duration-300"
        style={{
          transform: `translateY(${refreshing ? 10 : Math.min(pullDistance - 60, -60)}px)`, // 默认隐藏在 -60px
          opacity: pullDistance > 0 || refreshing ? 1 : 0
        }}
      >
        <div className="bg-white/90 backdrop-blur rounded-full p-2 shadow-md border border-slate-100 flex items-center gap-2">
          <Loader2 className={`text-brand-500 ${refreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 2}deg)` }} size={20} />
          {refreshing && <span className="text-xs text-slate-500 font-medium pr-1">刷新中...</span>}
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-brand-500 rounded-2xl md:rounded-3xl p-4 md:p-8 text-center text-white relative overflow-hidden shadow-lg transition-transform duration-200">
        <div className="relative z-10 max-w-xl mx-auto space-y-2 md:space-y-3">
          <h1 className="text-lg md:text-3xl font-bold tracking-tight">
            寻找你的喵星人伙伴
          </h1>
          <p className="text-brand-100 text-xs md:text-base px-2 text-opacity-90">
            成千上万只可爱的猫咪正在等待一个温暖的家。
          </p>

          <div className="relative max-w-md mx-auto mt-3 md:mt-5">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Search size={14} className="md:w-4 md:h-4" />
            </div>
            <input
              type="text"
              placeholder="搜索品种、名字..."
              className="w-full py-2 md:py-2.5 pl-8 md:pl-9 pr-4 rounded-full text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-brand-500/30 shadow-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-1.5 mt-2 md:mt-3 opacity-90">
            {['家养', '已接种', '已驱虫', '已绝育'].map(tag => (
              <button
                key={tag}
                onClick={() => setSearchTerm(searchTerm === tag ? '' : tag)}
                className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs transition-all border ${searchTerm === tag ? 'bg-white text-brand-600 border-white font-bold' : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/10 text-white'}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Decorative Circles */}
        <div className="absolute -top-32 -left-32 w-48 h-48 md:w-64 md:h-64 bg-white/10 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-32 -right-32 w-56 h-56 md:w-72 md:h-72 bg-brand-600/50 rounded-full blur-3xl opacity-60"></div>
      </section>

      {/* Content Area */}
      <section>
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">待领养猫咪</h2>
          <span className="text-slate-500 text-xs md:text-sm font-medium bg-white px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-slate-200">
            {filteredCats.length} 只
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-brand-500">
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
              className="mt-4 text-brand-600 font-medium hover:underline"
            >
              清除筛选条件
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {filteredCats.map(cat => (
              <CatCard key={cat.id} cat={cat} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;