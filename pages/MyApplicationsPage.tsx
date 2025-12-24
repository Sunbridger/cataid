import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2, Clock, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { AdoptionApplication } from '../types';

const MyApplicationsPage: React.FC = () => {
  const { user, isLoggedIn } = useUser();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/profile');
      return;
    }
    if (user?.id) {
      loadMyApplications();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, user?.id, navigate]);

  const loadMyApplications = async () => {
    try {
      const response = await fetch(`/api/user?action=applications&userId=${user?.id}`);
      if (response.ok) {
        const result = await response.json();
        setApplications(result.data || []);
      }
    } catch (error) {
      console.error('加载申请失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: <Clock size={16} />, text: '审核中', color: 'text-amber-500 bg-amber-50 border-amber-100' };
      case 'approved':
        return { icon: <CheckCircle2 size={16} />, text: '已通过', color: 'text-emerald-500 bg-emerald-50 border-emerald-100' };
      case 'rejected':
        return { icon: <XCircle size={16} />, text: '未通过', color: 'text-rose-500 bg-rose-50 border-rose-100' };
      default:
        return { icon: <Clock size={16} />, text: '未知', color: 'text-slate-500 bg-slate-50 border-slate-100' };
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
      {/* 标准顶部导航栏 */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-30 px-4 py-3 flex items-center shadow-sm border-b border-slate-100 -mx-4">
        <Link to="/profile" className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold text-slate-800 pr-10">领养申请记录</h1>
      </div>

      <div className="max-w-md mx-auto py-6">
        {applications.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100">
            <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 relative text-pink-300">
              <FileText size={40} />
              <div className="absolute top-0 right-0 bg-white p-1.5 rounded-full shadow-sm">
                <Sparkles size={16} className="text-yellow-400 fill-yellow-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">暂无申请记录</h3>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              遇到有缘的猫咪时，记得点击"申请领养"哦。
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold rounded-2xl hover:bg-rose-500 transition-all active:scale-95 shadow-lg shadow-pink-500/20"
            >
              遇见喵星人
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => {
              const status = getStatusDisplay(app.status);
              return (
                <div key={app.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex gap-4 p-4">
                    <Link to={`/cat/${app.catId}`} className="flex-shrink-0 relative group">
                      <img
                        src={app.catImage}
                        alt={app.catName}
                        className="w-24 h-24 rounded-xl object-cover bg-slate-100"
                      />
                      <div className="absolute inset-0 bg-black/5 rounded-xl group-hover:bg-black/10 transition-colors"></div>
                    </Link>

                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Link
                            to={`/cat/${app.catId}`}
                            className="font-bold text-slate-800 hover:text-pink-500 truncate text-lg"
                          >
                            {app.catName}
                          </Link>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border ${status.color}`}>
                            {status.icon}
                            {status.text}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 font-medium">
                        申请日期：{formatDate(app.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* 反馈区域 */}
                  {(app.status === 'approved' || app.status === 'rejected') && (
                    <div className={`px-5 py-3 text-sm font-medium ${app.status === 'approved' ? 'bg-emerald-50/50 text-emerald-700' : 'bg-rose-50/50 text-rose-700'
                      }`}>
                      {app.status === 'approved' ? '🎉 恭喜！工作人员将尽快与您联系。' : '抱歉，本次申请未通过审核。'}
                    </div>
                  )}

                  {app.reason && (
                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                      <p className="text-slate-500 text-sm line-clamp-2">
                        <span className="text-slate-400 mr-2">申请理由:</span>
                        {app.reason}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplicationsPage;
