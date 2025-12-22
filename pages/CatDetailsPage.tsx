import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { catService, adoptionService } from '../services/apiService';
import { chatAboutCat } from '../services/geminiService';
import { Cat, AdoptionApplication } from '../types';
import { Loader2, ArrowLeft, Heart, MessageCircle, Send, Sparkles, CheckCircle2, XCircle, Clock, X } from 'lucide-react';

const CatDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [cat, setCat] = useState<Cat | null>(null);
  const [loading, setLoading] = useState(true);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Adoption State
  const [isAdoptModalOpen, setIsAdoptModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myApplication, setMyApplication] = useState<AdoptionApplication | null>(null);
  const [adoptForm, setAdoptForm] = useState({
    name: '',
    contact: '',
    reason: ''
  });

  useEffect(() => {
    if (id) {
      loadCat(id);
      checkMyApplication(id);
    }
  }, [id]);

  const loadCat = async (catId: string) => {
    try {
      const data = await catService.getById(catId);
      if (data) setCat(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const checkMyApplication = async (catId: string) => {
    // 1. Get local record to find if we applied
    const storedApps = JSON.parse(localStorage.getItem('my_applications') || '[]');
    const localApp = storedApps.find((app: AdoptionApplication) => app.catId === catId);

    if (localApp) {
      // Optimistically set local app first
      setMyApplication(localApp);

      // 2. Then fetch fresh data to get latest status from server/mock
      try {
        const freshApp = await adoptionService.getApplicationById(localApp.id);
        if (freshApp) {
          setMyApplication(freshApp);

          // Sync back to local storage to keep it updated
          const newStoredApps = storedApps.map((a: AdoptionApplication) =>
            a.id === freshApp.id ? freshApp : a
          );
          localStorage.setItem('my_applications', JSON.stringify(newStoredApps));
        }
      } catch (e) {
        console.error("Failed to sync application status", e);
      }
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !cat) return;

    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);

    const response = await chatAboutCat(cat.name, userMsg);

    setChatHistory(prev => [...prev, { role: 'ai', text: response }]);
    setChatLoading(false);
  };

  const handleAdoptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cat) return;

    setSubmitting(true);
    try {
      const newApp = await adoptionService.submitApplication({
        catId: cat.id,
        catName: cat.name,
        catImage: cat.image_url,
        applicantName: adoptForm.name,
        contactInfo: adoptForm.contact,
        reason: adoptForm.reason
      });

      // Update Local Storage
      const storedApps = JSON.parse(localStorage.getItem('my_applications') || '[]');
      localStorage.setItem('my_applications', JSON.stringify([...storedApps, newApp]));

      setMyApplication(newApp);
      setIsAdoptModalOpen(false);

      // Refresh cat data to show status change if needed
      loadCat(cat.id);

    } catch (error) {
      console.error(error);
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  if (!cat) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-800">未找到该猫咪</h2>
        <Link to="/" className="text-brand-600 mt-4 inline-block hover:underline">返回首页</Link>
      </div>
    );
  }

  const status = cat.status || '可领养';
  const isAdopted = status === '已领养';

  // Render Status Badge Logic
  const renderApplicationStatus = () => {
    if (!myApplication) return null;

    if (myApplication.status === 'pending') {
      return (
        <div className="w-full py-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex flex-col items-center justify-center gap-2 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Clock className="animate-pulse" /> 申请审核中
          </div>
          <p className="text-sm opacity-80">志愿者正在审核您的申请，请保持电话畅通</p>
        </div>
      );
    }
    if (myApplication.status === 'approved') {
      return (
        <div className="w-full py-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex flex-col items-center justify-center gap-2 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-2 font-bold text-lg">
            <CheckCircle2 /> 恭喜！申请通过
          </div>
          <p className="text-sm opacity-80">您的领养申请已通过，我们将尽快联系您交接。</p>
        </div>
      );
    }
    if (myApplication.status === 'rejected') {
      return (
        <div className="w-full py-4 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl flex flex-col items-center justify-center gap-2 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-2 font-bold text-lg">
            <XCircle /> 申请未通过
          </div>
          <p className="text-sm opacity-80">很抱歉，根据目前情况我们无法通过您的申请。</p>
        </div>
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto relative">
      <Link to="/" className="inline-flex items-center text-slate-500 hover:text-brand-600 mb-6 font-medium transition-colors">
        <ArrowLeft size={18} className="mr-1" /> 返回列表
      </Link>

      <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100 flex flex-col md:flex-row">
        {/* Image Side */}
        <div className="md:w-1/2 bg-slate-100 relative h-96 md:h-auto group">
          <img
            src={cat.image_url}
            alt={cat.name}
            className={`w-full h-full object-cover ${isAdopted ? 'grayscale-[0.8]' : ''}`}
          />
          {isAdopted && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
              <div className="bg-white/90 px-6 py-3 rounded-2xl transform -rotate-12 shadow-2xl border-4 border-slate-800">
                <span className="text-3xl font-black text-slate-800 uppercase tracking-widest">已领养</span>
              </div>
            </div>
          )}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm uppercase tracking-wide">
            {cat.breed}
          </div>

          <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow-sm uppercase tracking-wide
             ${status === '可领养' ? 'bg-green-100 text-green-700' :
              status === '待定' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
            {status}
          </div>
        </div>

        {/* Info Side */}
        <div className="md:w-1/2 p-8 md:p-10 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-1">{cat.name}</h1>
              <p className="text-slate-500 font-medium text-lg">{cat.age} 岁 • {cat.gender === 'Male' ? '公' : '母'}</p>
            </div>
            <button className="p-3 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors">
              <Heart size={24} fill="currentColor" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {cat.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-lg text-sm font-semibold">
                {tag}
              </span>
            ))}
          </div>

          <div className="prose prose-slate mb-8 text-slate-600 leading-relaxed">
            <p>{cat.description}</p>
          </div>

          <div className="mt-auto space-y-4">
            {renderApplicationStatus()}

            {(!myApplication && !isAdopted) && (
              <button
                className={`w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 transition-all flex justify-center items-center gap-2
                 ${status !== '可领养' ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => setIsAdoptModalOpen(true)}
                disabled={status !== '可领养'}
              >
                {status === '待定' ? '已有其他人正在申请' : `领养 ${cat.name}`}
              </button>
            )}

            {(!myApplication && isAdopted) && (
              <div className="w-full py-3.5 bg-slate-100 text-slate-500 font-bold rounded-xl flex justify-center items-center gap-2 cursor-not-allowed">
                <CheckCircle2 size={20} />
                {cat.name} 找到了永远的家
              </div>
            )}

            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="w-full py-3.5 bg-white border-2 border-brand-100 text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-all flex justify-center items-center gap-2"
            >
              <MessageCircle size={18} />
              {chatOpen ? '关闭对话' : `问问 AI 关于 ${cat.name}`}
            </button>
          </div>
        </div>
      </div>

      {/* AI Chat Section */}
      {chatOpen && (
        <div className="mt-6 bg-white rounded-2xl shadow-lg border border-brand-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-brand-50 p-4 border-b border-brand-100 flex justify-between items-center">
            <h3 className="font-bold text-brand-800 flex items-center gap-2">
              <Sparkles size={16} />
              喵喵助手
            </h3>
            <span className="text-xs text-brand-600">Powered by Gemini</span>
          </div>

          <div className="h-64 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user'
                  ? 'bg-brand-500 text-white rounded-tr-sm'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                  }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleChatSubmit} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="输入你的问题..."
              className="flex-grow px-4 py-2 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-brand-300 focus:ring-2 focus:ring-brand-100 outline-none"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="p-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Adoption Modal */}
      {isAdoptModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">申请领养 {cat.name}</h3>
              <button
                onClick={() => setIsAdoptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAdoptSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">您的称呼</label>
                <input
                  required
                  type="text"
                  value={adoptForm.name}
                  onChange={e => setAdoptForm({ ...adoptForm, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  placeholder="怎么称呼您？"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">联系方式</label>
                <input
                  required
                  type="text"
                  value={adoptForm.contact}
                  onChange={e => setAdoptForm({ ...adoptForm, contact: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  placeholder="手机号或微信号"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">领养理由 / 养宠经验</label>
                <textarea
                  required
                  value={adoptForm.reason}
                  onChange={e => setAdoptForm({ ...adoptForm, reason: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-none"
                  placeholder="简单介绍一下您的家庭环境和养宠经验..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      提交中...
                    </>
                  ) : '提交申请'}
                </button>
                <p className="text-xs text-slate-400 text-center mt-3">
                  提交申请即代表您承诺善待动物，接受定期回访。
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatDetailsPage;