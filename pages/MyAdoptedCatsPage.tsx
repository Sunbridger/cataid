import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userService } from '../services/apiService';
import { AdoptionApplication } from '../types';
import { useUser } from '../context/UserContext';
import { Loader2, ArrowLeft, Heart, Cat } from 'lucide-react';
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
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10 -mx-4">
      {/* 顶部导航 */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20 border-b border-slate-100 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/profile" className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
            <ArrowLeft size={22} />
          </Link>
          <h1 className="text-lg font-bold text-slate-800">我的猫咪</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {adoptedCats.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Cat size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">还没有成功领养的猫咪</h3>
            <p className="text-slate-500 mb-6 max-w-xs mx-auto text-sm">
              如果您提交的申请通过审核，猫咪就会出现在这里。
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors text-sm shadow-md shadow-brand-500/20"
            >
              去发现喵星人
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-orange-50 p-4 rounded-2xl text-amber-800 text-sm flex items-start gap-3 border border-orange-100 shadow-sm">
              <Heart className="flex-shrink-0 mt-0.5 text-orange-500 fill-orange-500" size={18} />
              <div>
                <p className="font-bold mb-1 text-base">感谢您给它们一个家！</p>
                <p className="opacity-90 leading-relaxed text-xs text-amber-900/80">
                  这里是您成功领养的猫咪伙伴。请记得定期更新它们的生活动态，我们希望能看到它们幸福的样子。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {adoptedCats.map((app) => {
                // 如果后端返回了完整的 cat 对象，优先使用
                // 否则构造一个临时对象（防止页面崩溃）
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
                  <CatCard
                    key={app.id}
                    cat={displayCat}
                    // 这里不处理收藏状态，因为已经是自己的猫了
                    isFavorited={false}
                  />
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
