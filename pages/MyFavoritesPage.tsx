import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Loader2, Trash2, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { favoriteService } from '../services/apiService';
import { Cat } from '../types';
import CatCard from '../components/CatCard';

interface Favorite {
  id: string;
  catId: string;
  createdAt: string;
  cat: Cat | null;
}

const MyFavoritesPage: React.FC = () => {
  const { user, isLoggedIn } = useUser();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载收藏列表
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/profile');
      return;
    }
    if (user?.id) {
      loadFavorites();
    }
  }, [user?.id, isLoggedIn, navigate]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-pink-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 沉浸式顶部 - 粉色系 */}
      <div className="bg-gradient-to-r from-pink-400 via-rose-400 to-pink-300 pb-10 pt-6 px-4 rounded-b-[2rem] relative overflow-hidden shadow-lg shadow-pink-500/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -ml-10 -mb-10"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/profile" className="p-2 -ml-2 text-white/90 hover:bg-white/20 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold text-white">我的收藏</h1>
          </div>

          <div className="flex items-center gap-4 text-white px-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
              <Heart size={24} className="text-white fill-white/20" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight">{favorites.length}</div>
              <div className="text-[10px] text-white/80 uppercase tracking-wider font-medium mt-0.5">心动猫咪</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6 relative z-20">
        {favorites.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-xl shadow-slate-200/50 border border-slate-100 max-w-md mx-auto">
            <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 text-pink-300 relative">
              <Heart size={40} className="fill-pink-200" />
              <div className="absolute top-0 right-0 bg-white p-1.5 rounded-full shadow-sm">
                <Sparkles size={16} className="text-yellow-400 fill-yellow-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">还没有收藏的猫咪</h3>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              遇到喜欢的猫咪不仅要放在心里，还要收藏在列表里哦。
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-pink-500/30 transition-all active:scale-95"
            >
              遇见喵星人
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map(favorite => {
              const cat = favorite.cat;
              if (!cat) return null;

              return (
                <div key={favorite.id} className="relative group">
                  {/* 装饰性背景 */}
                  <div className="absolute inset-x-2 top-4 bottom-0 bg-pink-500/5 rounded-3xl transform translate-y-2 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="relative bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                    <CatCard cat={cat} />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveFavorite(cat.id);
                      }}
                      className="absolute top-3 right-3 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full text-rose-400 shadow-sm hover:bg-rose-50 hover:text-rose-600 hover:scale-110 transition-all duration-200 border border-white/50"
                      title="取消收藏"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="px-4 pb-3 -mt-3 relative z-10 bg-white flex justify-end">
                      <span className="text-[10px] text-slate-300 font-medium">收藏于 {new Date(favorite.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyFavoritesPage;
