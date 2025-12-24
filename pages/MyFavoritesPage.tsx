import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Loader2, Trash2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { favoriteService } from '../services/apiService';
import { Cat } from '../types';

interface Favorite {
  id: string;
  catId: string;
  createdAt: string;
  cat: Cat | null;
}

const MyFavoritesPage: React.FC = () => {
  const { user, isLoggedIn } = useUser();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载收藏列表
  useEffect(() => {
    if (user?.id) {
      loadFavorites();
    }
  }, [user?.id]);

  const loadFavorites = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await favoriteService.getUserFavorites(user.id);
      setFavorites(data);
    } catch (error) {
      console.error('加载收藏列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 删除收藏
  const handleRemoveFavorite = async (catId: string) => {
    if (!user?.id) return;

    const success = await favoriteService.removeFavorite(user.id, catId);
    if (success) {
      setFavorites(prev => prev.filter(fav => fav.catId !== catId));
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <Heart size={48} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">请先登录</h2>
          <p className="text-slate-500 mb-4">登录后查看您收藏的猫咪</p>
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
        <h1 className="text-2xl font-bold text-slate-800">我的收藏</h1>
        {!loading && favorites.length > 0 && (
          <span className="text-sm text-slate-500">({favorites.length})</span>
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
      {!loading && favorites.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm text-center py-16">
          <Heart size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">还没有收藏的猫咪</p>
          <p className="text-slate-400 text-sm mb-4">在猫咪详情页点击爱心即可收藏</p>
          <Link
            to="/"
            className="text-brand-500 hover:underline text-sm"
          >
            去看看可爱的猫咪们 →
          </Link>
        </div>
      )}

      {/* 收藏列表 */}
      {!loading && favorites.length > 0 && (
        <div className="space-y-4">
          {favorites.map(favorite => {
            const cat = favorite.cat;
            if (!cat) return null;

            return (
              <div
                key={favorite.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4 p-4">
                  {/* 猫咪图片 */}
                  <Link to={`/cat/${cat.id}`} className="flex-shrink-0">
                    <img
                      src={cat.image_url?.split(',')[0] || 'https://via.placeholder.com/150'}
                      alt={cat.name}
                      className="w-24 h-24 object-cover rounded-xl"
                    />
                  </Link>

                  {/* 猫咪信息 */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/cat/${cat.id}`}>
                      <h3 className="text-lg font-bold text-slate-800 mb-1 hover:text-brand-500 transition-colors">
                        {cat.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                      <span>{cat.age}岁</span>
                      <span>·</span>
                      <span>{cat.gender === 'Male' ? '♂ 男孩' : '♀ 女孩'}</span>
                      <span>·</span>
                      <span>{cat.breed}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.tags?.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-brand-50 text-brand-600 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 删除按钮 */}
                  <button
                    onClick={() => handleRemoveFavorite(cat.id)}
                    className="flex-shrink-0 p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="取消收藏"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* 状态标签 */}
                <div className="px-4 pb-4">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${cat.status === '可领养'
                        ? 'bg-green-50 text-green-600'
                        : cat.status === '已领养'
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                  >
                    {cat.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyFavoritesPage;

