import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { catService } from '../services/apiService';
import { Cat } from '../types';
import { useUser } from '../context/UserContext';
import { Loader2, ArrowLeft, Heart, Cat as CatIcon, Edit2, Sparkles } from 'lucide-react';
import CatCard from '../components/CatCard';

const MyPublishedCatsPage: React.FC = () => {
  const { user, isLoggedIn } = useUser();
  const navigate = useNavigate();
  const [publishedCats, setPublishedCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/profile');
      return;
    }

    if (user?.id) {
      fetchPublishedCats();
    }
  }, [user, isLoggedIn, navigate]);

  const fetchPublishedCats = async () => {
    if (!user?.id) return;
    try {
      // 获取所有猫咪，然后筛选出当前用户发布的
      const allCats = await catService.getAll();
      const myCats = allCats.filter(cat => cat.userId === user.id);
      setPublishedCats(myCats);
    } catch (error) {
      console.error('获取发布记录失败:', error);
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
      {/* 顶部导航栏 */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-30 px-4 py-3 flex items-center shadow-sm border-b border-slate-100 -mx-4">
        <Link to="/profile" className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold text-slate-800 pr-10">我发布的猫猫</h1>
      </div>

      <div className="max-w-md mx-auto py-6">
        {publishedCats.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-xl shadow-slate-200/50 border border-slate-100 mt-8">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-300 relative">
              <CatIcon size={40} />
              <div className="absolute top-0 right-0 bg-white p-1.5 rounded-full shadow-sm">
                <Sparkles size={16} className="text-yellow-400 fill-yellow-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">还没有发布记录</h3>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              您还没有发布过猫咪领养信息。如果您有需要领养的猫咪，可以去发布中心发布。
            </p>
            <Link
              to="/publish"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-blue-400 to-indigo-400 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95"
            >
              去发布猫咪
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Heart className="text-blue-500 fill-blue-500" size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-800 mb-1 text-sm">感谢您的付出！</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  您已经发布了 {publishedCats.length} 只猫咪的领养信息。这里可以管理它们的状态。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {publishedCats.map((cat) => {
                return (
                  <div key={cat.id} className="relative group">
                    {/* 装饰性背景 */}
                    <div className="absolute inset-x-4 top-4 bottom-0 bg-blue-500/5 rounded-3xl transform translate-y-2 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="relative bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                      <CatCard
                        cat={cat}
                        isFavorited={false}
                      />
                      <div className="px-4 pb-4 -mt-2 relative z-10 bg-white">
                        <div className="flex items-center gap-2 justify-between">
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                            <span className={`w-2 h-2 rounded-full ${cat.status === '可领养' ? 'bg-green-400' :
                              cat.status === '待定' ? 'bg-amber-400' :
                                'bg-slate-400'
                              }`}></span>
                            <span>状态：{cat.status}</span>
                          </div>
                          <Link
                            to={`/cats/${cat.id}/edit`}
                            className="flex items-center gap-1.5 text-xs text-blue-500 font-medium hover:text-blue-600 transition-colors"
                          >
                            <Edit2 size={14} />
                            <span>编辑</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPublishedCatsPage;
