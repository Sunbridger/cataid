import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userService } from '../services/apiService';
import { AdoptionApplication } from '../types';
import { useUser } from '../context/UserContext';
import { Loader2, ArrowLeft, Heart, Cat } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* 顶部导航 */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100 px-4 h-14 flex items-center gap-3">
        <Link to="/profile" className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-lg font-bold text-slate-800">我的猫咪</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {adoptedCats.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Cat size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">还没有成功领养的猫咪</h3>
            <p className="text-slate-500 mb-6 max-w-xs mx-auto">
              如果您提交的申请通过审核，猫咪就会出现在这里。
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors"
            >
              去发现喵星人
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-orange-100 to-amber-50 p-4 rounded-xl text-amber-800 text-sm mb-6 flex items-start gap-3">
              <Heart className="flex-shrink-0 mt-0.5 text-orange-500 fill-orange-500" size={18} />
              <div>
                <p className="font-bold mb-1">感谢您给它们一个家！</p>
                <p className="opacity-90">这里是您成功领养的猫咪伙伴。请记得定期更新它们的生活动态，我们希望能看到它们幸福的样子。</p>
              </div>
            </div>

            <div className="grid gap-4">
              {adoptedCats.map((app) => (
                <Link
                  key={app.id}
                  to={`/cat/${app.catId}`}
                  className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-100 group"
                >
                  <div className="flex">
                    <div className="w-32 h-32 bg-slate-100 relative overflow-hidden">
                      <img
                        src={app.catImage || `https://ui-avatars.com/api/?name=${app.catName}&background=random`}
                        alt={app.catName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-green-500/90 text-white text-[10px] font-bold rounded-full backdrop-blur-sm">
                        已领养
                      </div>
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-center">
                      <h3 className="text-lg font-bold text-slate-800 mb-1">{app.catName}</h3>
                      <p className="text-sm text-slate-500 mb-2 line-clamp-2">
                        申请理由：{app.reason}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          领养时间：{new Date(app.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">
                          查看档案
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAdoptedCatsPage;
