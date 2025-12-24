import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userService } from '../services/apiService';
import { AdoptionApplication } from '../types';
import { useUser } from '../context/UserContext';
import { Loader2, ArrowLeft, Heart, Cat, Calendar, Sparkles } from 'lucide-react';
import CatCard from '../components/CatCard';

const MyAdoptedCatsPage: React.FC = () => {
  const { user, isLoggedIn } = useUser();
  const navigate = useNavigate();
  const [adoptedCats, setAdoptedCats] = useState<AdoptionApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/profile');
      return;
    }

    if (user?.id) {
      fetchAdoptedCats();
    }
  }, [user, isLoggedIn, navigate]);

  const fetchAdoptedCats = async () => {
    if (!user?.id) return;
    try {
      const allApplications = await userService.getUserApplications(user.id);
      // 筛选出已通过审核的申请（即成功领养的猫咪）
      const approved = allApplications.filter(app => app.status === 'approved');
      setAdoptedCats(approved);
    } catch (error) {
      console.error('获取领养记录失败:', error);
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
      {/* 沉浸式顶部 - 粉色系 */}
      <div className="bg-gradient-to-r from-pink-400 via-rose-400 to-pink-300 pb-10 pt-6 px-4 rounded-b-[2rem] relative overflow-hidden shadow-lg shadow-pink-500/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -ml-10 -mb-10"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/profile" className="p-2 -ml-2 text-white/90 hover:bg-white/20 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold text-white">我的猫咪家族</h1>
          </div>

          <div className="flex items-center gap-4 text-white px-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
              <Cat size={24} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight">{adoptedCats.length}</div>
              <div className="text-[10px] text-white/80 uppercase tracking-wider font-medium mt-0.5">已成功领养</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-6 relative z-20">
        {adoptedCats.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 text-pink-300 relative">
              <Cat size={40} />
              <div className="absolute top-0 right-0 bg-white p-1.5 rounded-full shadow-sm">
                <Sparkles size={16} className="text-yellow-400 fill-yellow-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">还没有领养记录</h3>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              这里空空如也。去寻找命中注定的那只猫咪吧，它正在等待一个温暖的家。
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-pink-500/30 transition-all active:scale-95"
            >
              去领养中心逛逛
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
              <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Heart className="text-rose-500 fill-rose-500" size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-800 mb-1 text-sm">感谢您的爱心！</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  您已经为 {adoptedCats.length} 只流浪猫咪提供了温暖的家。这里是它们的专属空间。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {adoptedCats.map((app) => {
                const catData = app.cat || {
                  id: app.catId,
                  name: app.catName,
                  image_url: app.catImage,
                  age: 0,
                  gender: 'Male',
                  breed: '未知',
                  status: '已领养',
                  is_stray: false,
                  tags: [],
                  description: '暂无详细介绍',
                  created_at: app.createdAt,
                  is_sterilized: false,
                  is_dewormed: false,
                  is_vaccinated: false
                };

                // 强制显示为已领养状态
                const displayCat = { ...catData, status: '已领养' as const };

                return (
                  <div key={app.id} className="relative group">
                    {/* 装饰性背景 */}
                    <div className="absolute inset-x-4 top-4 bottom-0 bg-pink-500/5 rounded-3xl transform translate-y-2 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="relative bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                      <CatCard
                        cat={displayCat}
                        isFavorited={false}
                      />
                      <div className="px-4 pb-4 -mt-2 relative z-10 bg-white">
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <Calendar size={14} className="text-pink-400" />
                          <span>领养时间：{new Date(app.updatedAt || app.createdAt).toLocaleDateString()}</span>
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

export default MyAdoptedCatsPage;
