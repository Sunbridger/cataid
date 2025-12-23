import React, { useEffect, useState } from 'react';
import { catService, adoptionService } from '../services/apiService';
import { Cat, CatStatus, AdoptionApplication, ApplicationStatus } from '../types';
import { CAT_STATUSES } from '../constants';
import { Loader2, Settings, FileText, CheckCircle, XCircle, Trash2 } from 'lucide-react';

import { useToast } from '../context/ToastContext';

const AdminPage: React.FC = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'cats' | 'applications'>('applications'); // Default to applications for easier testing

  // Cat Management State
  const [cats, setCats] = useState<Cat[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Applications State
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);

  useEffect(() => {
    fetchCats();
    fetchApplications();
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

  const handleStatusChange = async (id: string, newStatus: CatStatus) => {
    try {
      setUpdatingId(id);
      await catService.updateStatus(id, newStatus);
      setCats(cats.map(cat => cat.id === id ? { ...cat, status: newStatus } : cat));
      localStorage.setItem('cat_data_update_ts', Date.now().toString());
      window.dispatchEvent(new Event('cat-data-updated'));
      success('状态更新成功');
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
      localStorage.setItem('cat_data_update_ts', Date.now().toString());
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
    // Removed window.confirm to improve UX and avoid blocking issues.
    // Instead, we rely on immediate feedback and the ability to see the status change.

    try {
      setProcessingAppId(app.id);

      // Perform the update
      await adoptionService.reviewApplication(app.id, status, app.catId);

      // Update Applications State
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status } : a));

      // If approved/rejected, we might need to update the cat list in the background
      // so the "Cats Management" tab reflects the changes immediately.
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

    } catch (err) {
      console.error(err);
      error('操作失败，请重试');
    } finally {
      setProcessingAppId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-brand-500 to-brand-600 text-white p-3 rounded-2xl shadow-lg shadow-brand-500/20">
            <Settings size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">管理后台</h1>
            <p className="text-sm text-slate-500 font-medium">管理猫咪信息与审核领养申请</p>
          </div>
        </div>

        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('cats')}
            className={`flex-1 md:flex-none whitespace-nowrap px-4 md:px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'cats'
              ? 'bg-slate-800 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
          >
            猫咪管理
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex-1 md:flex-none whitespace-nowrap px-4 md:px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'applications'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-500 hover:text-brand-600 hover:bg-brand-50'
              }`}
          >
            领养审核
            {applications.filter(a => a.status === 'pending').length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {applications.filter(a => a.status === 'pending').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'cats' ? (
        // Cats Table
        // Cats Management
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          {loadingCats ? (
            <div className="flex justify-center items-center py-20 bg-white rounded-3xl shadow-lg border border-slate-100">
              <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase tracking-wider">
                        <th className="p-4 font-semibold">猫咪</th>
                        <th className="p-4 font-semibold">基本信息</th>
                        <th className="p-4 font-semibold">当前状态</th>
                        <th className="p-4 font-semibold">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cats.map((cat) => (
                        <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 w-24">
                            <img
                              src={cat.image_url.split(',')[0]}
                              alt={cat.name}
                              className="w-16 h-16 rounded-lg object-cover bg-slate-200"
                            />
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-800">{cat.name}</div>
                            <div className="text-sm text-slate-500">{cat.breed} • {new Date(cat.created_at).toLocaleDateString('zh-CN')}</div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                          ${cat.status === '可领养' ? 'bg-green-50 text-green-700 border-green-200' :
                                cat.status === '已领养' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                                  'bg-amber-50 text-amber-700 border-amber-200'}`}>
                              {cat.status || '可领养'}
                            </span>
                          </td>
                          <td className="p-4">
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="relative max-w-[140px]">
                                  <select
                                    value={cat.status || '可领养'}
                                    onChange={(e) => handleStatusChange(cat.id, e.target.value as CatStatus)}
                                    disabled={updatingId === cat.id}
                                    className="appearance-none w-full bg-white border border-slate-300 text-slate-700 py-1.5 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 disabled:opacity-50 cursor-pointer"
                                  >
                                    {CAT_STATUSES.map(status => (
                                      <option key={status} value={status}>{status}</option>
                                    ))}
                                  </select>
                                  {updatingId === cat.id && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                      <Loader2 className="animate-spin text-brand-500" size={14} />
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDeleteCat(cat.id)}
                                  disabled={deletingId === cat.id}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="删除"
                                >
                                  {deletingId === cat.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                </button>
                              </div>
                            </td>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
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
                            ${cat.status === '可领养' ? 'bg-green-50 text-green-700 border-green-200' :
                              cat.status === '已领养' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {cat.status || '可领养'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{cat.breed} • {new Date(cat.created_at).toLocaleDateString('zh-CN')}</p>
                      </div>

                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="relative w-full">
                            <select
                              value={cat.status || '可领养'}
                              onChange={(e) => handleStatusChange(cat.id, e.target.value as CatStatus)}
                              disabled={updatingId === cat.id}
                              className="appearance-none w-full bg-slate-50 border border-slate-200 text-slate-700 py-2 pl-3 pr-8 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 disabled:opacity-50"
                            >
                              {CAT_STATUSES.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                              {updatingId === cat.id ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <Settings size={16} />
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteCat(cat.id)}
                            disabled={deletingId === cat.id}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 bg-slate-50 border border-slate-200"
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
      ) : (
        // Applications Table
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          {loadingApps ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-brand-400" size={32} />
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
                    <img src={app.catImage} alt={app.catName} className="w-16 h-16 rounded-xl object-cover bg-slate-100" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">申请领养</p>
                      <h3 className="font-bold text-slate-800">{app.catName}</h3>
                      <p className="text-xs text-slate-400 mt-1">{new Date(app.createdAt).toLocaleString('zh-CN')}</p>
                    </div>
                  </div>

                  {/* Applicant Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800 text-lg">{app.applicantName}</span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-mono">{app.contactInfo}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl text-sm text-slate-600 leading-relaxed border border-slate-100">
                      <span className="font-semibold text-slate-400 block text-xs mb-1 uppercase">申请理由 / 经验</span>
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
                          className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                        >
                          {processingAppId === app.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                          通过申请
                        </button>
                        <button
                          onClick={() => handleReviewApplication(app, 'rejected')}
                          disabled={!!processingAppId}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
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
    </div>
  );
};

export default AdminPage;