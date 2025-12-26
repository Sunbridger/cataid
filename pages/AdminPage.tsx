import React, { useEffect, useState } from 'react';
import { catService, adoptionService, supportApi } from '../services/apiService';
import { Cat, CatStatus, AdoptionApplication, ApplicationStatus, SupportSession } from '../types';
import { CAT_STATUSES } from '../constants';
import { Loader2, Settings, FileText, CheckCircle, XCircle, Trash2, Shield, MessageSquare } from 'lucide-react';

import { useToast } from '../context/ToastContext';

const AdminPage: React.FC = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'cats' | 'applications' | 'support'>('applications'); // Default to applications for easier testing

  // Cat Management State
  const [cats, setCats] = useState<Cat[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Applications State
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);

  // Support Sessions State
  const [sessions, setSessions] = useState<SupportSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    fetchCats();
    fetchApplications();
    fetchSessions();
  }, []);

  const fetchCats = async () => {
    setLoadingCats(true);
    try {
      const data = await catService.getAll();
      setCats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCats(false);
    }
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const data = await adoptionService.getAllApplications();
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApps(false);
    }
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await supportApi.getAllSessions('admin');
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: CatStatus) => {
    try {
      setUpdatingId(id);
      const result = await catService.updateStatus(id, newStatus);
      setCats(cats.map(cat => cat.id === id ? { ...cat, status: newStatus } : cat));
      window.dispatchEvent(new Event('cat-data-updated'));
      success(result.message || '状态更新成功');
    } catch (err) {
      console.error("Failed to update status", err);
      error("更新状态失败");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteCat = async (id: string) => {
    if (!window.confirm('确定要删除这只猫咪及其所有信息吗？此操作不可恢复。')) {
      return;
    }

    try {
      setDeletingId(id);
      await catService.delete(id);
      setCats(prev => prev.filter(cat => cat.id !== id));
      window.dispatchEvent(new Event('cat-data-updated'));
      success('删除成功');
    } catch (err) {
      console.error("Failed to delete cat", err);
      error("删除失败，请重试");
    } finally {
      setDeletingId(null);
    }
  };

  const handleReviewApplication = async (app: AdoptionApplication, status: ApplicationStatus) => {
    try {
      setProcessingAppId(app.id);

      // Perform the update
      await adoptionService.reviewApplication(app.id, status, app.catId);

      // Update Applications State
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status } : a));

      // If approved/rejected, we might need to update the cat list in the background
      if (status === 'approved') {
        setCats(prev => prev.map(c => c.id === app.catId ? { ...c, status: '已领养' } : c));
        success('已通过申请');
      } else if (status === 'rejected') {
        const cat = cats.find(c => c.id === app.catId);
        if (cat && cat.status === '待定') {
          setCats(prev => prev.map(c => c.id === app.catId ? { ...c, status: '可领养' } : c));
        }
        success('已拒绝申请');
      }

      // 触发数据更新事件
      window.dispatchEvent(new Event('cat-data-updated'));

    } catch (err) {
      console.error(err);
      error('操作失败，请重试');
    } finally {
      setProcessingAppId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 标准顶部导航栏 */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-30 px-4 py-3 flex items-center justify-center shadow-sm border-b border-slate-100 -mx-4">
        <h1 className="text-lg font-bold text-slate-800">管理后台</h1>
      </div>

      <div className="max-w-6xl mx-auto py-6">
        {/* Tab 切换 */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 mb-6 flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex-1 md:flex-none whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'applications'
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20'
              : 'text-slate-500 hover:text-pink-600 hover:bg-pink-50'
              }`}
          >
            领养审核
            {applications.filter(a => a.status === 'pending').length > 0 && (
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                {applications.filter(a => a.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('cats')}
            className={`flex-1 md:flex-none whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'cats'
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20'
              : 'text-slate-500 hover:text-pink-600 hover:bg-pink-50'
              }`}
          >
            猫咪管理
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`flex-1 md:flex-none whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'support'
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20'
              : 'text-slate-500 hover:text-pink-600 hover:bg-pink-50'
              }`}
          >
            客服消息
            {sessions.length > 0 && (
              <span className="ml-2 bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                {sessions.reduce((acc, s) => acc + (s.unreadCount || 0), 0)}
              </span>
            )}
          </button>
        </div>

        {/* 顶部工具栏 (仅在客服 Tab 显示) */}
        {activeTab === 'support' && (
          <div className="flex justify-end mb-4 px-2">
            <button
              onClick={fetchSessions}
              disabled={loadingSessions}
              className="flex items-center gap-1.5 text-sm text-pink-500 font-bold hover:text-pink-600 transition-colors disabled:opacity-50"
            >
              <Loader2 size={14} className={loadingSessions ? 'animate-spin' : ''} />
              {loadingSessions ? '刷新中...' : '刷新列表'}
            </button>
          </div>
        )}

        {activeTab === 'cats' && (
          // Cats Table
          <div className="animate-in fade-in slide-in-from-bottom-2">
            {loadingCats ? (
              <div className="flex justify-center items-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                <Loader2 className="animate-spin text-pink-400" size={32} />
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                          <th className="p-4 pl-6">猫咪</th>
                          <th className="p-4">基本信息</th>
                          <th className="p-4">当前状态</th>
                          <th className="p-4">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cats.map((cat) => (
                          <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-4 pl-6 w-24">
                              <img
                                src={cat.image_url.split(',')[0]}
                                alt={cat.name}
                                className="w-14 h-14 rounded-xl object-cover bg-slate-100 shadow-sm border border-slate-100"
                              />
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-slate-800 text-base">{cat.name}</div>
                              <div className="text-xs font-medium text-slate-400 mt-0.5">{cat.breed} • {new Date(cat.created_at).toLocaleDateString('zh-CN')}</div>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border
                            ${cat.status === '可领养' ? 'bg-green-50 text-green-700 border-green-100' :
                                  cat.status === '已领养' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                                    'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                {cat.status || '可领养'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="relative max-w-[140px]">
                                  <select
                                    value={cat.status || '可领养'}
                                    onChange={(e) => handleStatusChange(cat.id, e.target.value as CatStatus)}
                                    disabled={updatingId === cat.id}
                                    className="appearance-none w-full bg-white border border-slate-200 text-slate-600 py-1.5 pl-3 pr-8 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 disabled:opacity-50 cursor-pointer shadow-sm transition-shadow"
                                  >
                                    {CAT_STATUSES.map(status => (
                                      <option key={status} value={status}>{status}</option>
                                    ))}
                                  </select>
                                  {updatingId === cat.id && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                      <Loader2 className="animate-spin text-pink-500" size={14} />
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDeleteCat(cat.id)}
                                  disabled={deletingId === cat.id}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 border border-transparent hover:border-red-100"
                                  title="删除"
                                >
                                  {deletingId === cat.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {cats.map((cat) => (
                    <div key={cat.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4">
                      <img
                        src={cat.image_url.split(',')[0]}
                        alt={cat.name}
                        className="w-20 h-20 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-slate-800 text-lg truncate">{cat.name}</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border
                              ${cat.status === '可领养' ? 'bg-green-50 text-green-700 border-green-100' :
                                cat.status === '已领养' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                                  'bg-amber-50 text-amber-700 border-amber-100'}`}>
                              {cat.status || '可领养'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">{cat.breed} • {new Date(cat.created_at).toLocaleDateString('zh-CN')}</p>
                        </div>

                        <div className="mt-3">
                          <div className="flex items-center gap-2">
                            <div className="relative w-full">
                              <select
                                value={cat.status || '可领养'}
                                onChange={(e) => handleStatusChange(cat.id, e.target.value as CatStatus)}
                                disabled={updatingId === cat.id}
                                className="appearance-none w-full bg-slate-50 border border-slate-200 text-slate-700 py-2 pl-3 pr-8 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 disabled:opacity-50"
                              >
                                {CAT_STATUSES.map(status => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                {updatingId === cat.id ? (
                                  <Loader2 className="animate-spin text-pink-500" size={16} />
                                ) : (
                                  <Settings size={16} />
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteCat(cat.id)}
                              disabled={deletingId === cat.id}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 bg-slate-50 border border-slate-200"
                            >
                              {deletingId === cat.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          // Applications Table
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            {loadingApps ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-pink-400" size={32} />
              </div>
            ) : applications.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
                <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-500">暂时没有领养申请</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {applications.map((app) => (
                  <div key={app.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col lg:flex-row gap-6">
                    {/* Cat Info */}
                    <div className="flex items-start gap-4 lg:w-1/4">
                      <img src={app.catImage} alt={app.catName} className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-100" />
                      <div>
                        <p className="text-xs text-slate-400 font-bold tracking-wider mb-1">申请领养</p>
                        <h3 className="font-bold text-slate-800 text-lg">{app.catName}</h3>
                        <p className="text-xs text-slate-400 mt-1 font-mono">{new Date(app.createdAt).toLocaleString('zh-CN')}</p>
                      </div>
                    </div>

                    {/* Applicant Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-slate-800 text-lg">{app.applicantName}</span>
                        <span className="bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-lg text-xs font-mono">{app.contactInfo}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl text-sm text-slate-600 leading-relaxed border border-slate-100 relative">
                        <span className="absolute -top-2.5 left-4 px-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">申请理由 / 经验</span>
                        {app.reason}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="lg:w-48 flex flex-col justify-center gap-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                      {app.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleReviewApplication(app, 'approved')}
                            disabled={!!processingAppId}
                            className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-green-500/20 active:scale-95"
                          >
                            {processingAppId === app.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                            通过申请
                          </button>
                          <button
                            onClick={() => handleReviewApplication(app, 'rejected')}
                            disabled={!!processingAppId}
                            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:shadow-inner"
                          >
                            {processingAppId === app.id ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                            婉拒
                          </button>
                        </>
                      ) : (
                        <div className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold border
                        ${app.status === 'approved' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                          {app.status === 'approved' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                          {app.status === 'approved' ? '已通过' : '已驳回'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'support' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
            {loadingSessions ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-pink-400" size={32} />
              </div>
            ) : sessions.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
                <MessageSquare className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-500">暂时没有咨询消息</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
                {sessions.map(session => (
                  <div
                    key={session.id}
                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group"
                    onClick={() => window.open(`#/support?sessionId=${session.id}&userId=${session.userId}`, '_blank')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center font-bold relative">
                        {session.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                            {session.unreadCount}
                          </span>
                        )}
                        <MessageSquare size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">用户 (ID: {session.userId.slice(-4)})</div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{session.lastMessage || '无消息'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">{new Date(session.lastMessageAt).toLocaleString()}</div>
                      <div className="text-pink-500 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">点击回复 &rarr;</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;