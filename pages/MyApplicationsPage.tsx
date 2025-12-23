import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { AdoptionApplication } from '../types';

const MyApplicationsPage: React.FC = () => {
  const { user, isLoggedIn } = useUser();
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadMyApplications();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, user?.id]);

  const loadMyApplications = async () => {
    try {
      // 调用 API 获取用户申请
      const response = await fetch(`/api/user-data?userId=${user?.id}&type=applications`);
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

  // 格式化时间
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 状态显示
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: <Clock size={16} />, text: '审核中', color: 'text-amber-500 bg-amber-50' };
      case 'approved':
        return { icon: <CheckCircle2 size={16} />, text: '已通过', color: 'text-green-500 bg-green-50' };
      case 'rejected':
        return { icon: <XCircle size={16} />, text: '未通过', color: 'text-red-500 bg-red-50' };
      default:
        return { icon: <Clock size={16} />, text: '未知', color: 'text-slate-500 bg-slate-50' };
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <FileText size={48} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">请先登录</h2>
          <p className="text-slate-500 mb-4">登录后查看您的领养申请</p>
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
        <h1 className="text-2xl font-bold text-slate-800">领养申请</h1>
      </div>

      {/* 申请列表 */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm flex justify-center items-center py-16">
            <Loader2 className="animate-spin text-slate-300" size={32} />
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm text-center py-16">
            <FileText size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">还没有提交过领养申请</p>
            <Link
              to="/"
              className="text-brand-500 hover:underline text-sm mt-2 inline-block"
            >
              去看看可领养的猫咪 →
            </Link>
          </div>
        ) : (
          applications.map(app => {
            const status = getStatusDisplay(app.status);
            return (
              <div key={app.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="flex gap-4 p-4">
                  {/* 猫咪图片 */}
                  <Link to={`/cat/${app.catId}`} className="flex-shrink-0">
                    <img
                      src={app.catImage}
                      alt={app.catName}
                      className="w-20 h-20 rounded-xl object-cover bg-slate-200"
                    />
                  </Link>

                  {/* 申请信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/cat/${app.catId}`}
                        className="font-bold text-slate-800 hover:text-brand-500 truncate"
                      >
                        {app.catName}
                      </Link>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${status.color}`}>
                        {status.icon}
                        {status.text}
                      </span>
                    </div>

                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{app.reason}</p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span>申请人：{app.applicantName}</span>
                      <span>联系方式：{app.contactInfo}</span>
                    </div>

                    <div className="text-xs text-slate-400 mt-1">
                      申请时间：{formatDate(app.createdAt)}
                    </div>
                  </div>
                </div>

                {/* 状态提示 */}
                {app.status === 'approved' && (
                  <div className="px-4 py-3 bg-green-50 border-t border-green-100 text-green-700 text-sm">
                    🎉 恭喜！您的领养申请已通过，请等待工作人员联系您。
                  </div>
                )}
                {app.status === 'rejected' && (
                  <div className="px-4 py-3 bg-red-50 border-t border-red-100 text-red-600 text-sm">
                    很抱歉，您的申请未通过。您可以尝试申请其他猫咪。
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyApplicationsPage;
