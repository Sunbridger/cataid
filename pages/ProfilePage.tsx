import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { User, Settings, ChevronRight, Heart, MessageCircle, FileText, LogOut, Edit2, Camera, Mail, Phone, Eye, EyeOff, AlertCircle } from 'lucide-react';

type AuthMode = 'login' | 'register';

const ProfilePage: React.FC = () => {
  const { user, isLoggedIn, isGuest, login, logout, updateUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState('');

  // 认证相关状态
  const [authMode, setAuthMode] = useState<AuthMode>('register'); // 默认显示注册
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [showPassword, setShowPassword] = useState(false);
  const [authForm, setAuthForm] = useState({
    phone: '',
    email: '',
    password: '',
    nickname: '',
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // 处理注册/登录
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // 验证表单
    if (authMethod === 'phone') {
      if (!/^1[3-9]\d{9}$/.test(authForm.phone)) {
        setAuthError('请输入正确的手机号');
        return;
      }
    } else {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authForm.email)) {
        setAuthError('请输入正确的邮箱地址');
        return;
      }
    }

    if (authForm.password.length < 6) {
      setAuthError('密码至少需要6位');
      return;
    }

    if (authMode === 'register' && !authForm.nickname.trim()) {
      setAuthError('请输入昵称');
      return;
    }

    setAuthLoading(true);

    // 模拟注册/登录（实际应该调用后端 API）
    setTimeout(() => {
      // 生成头像
      const nickname = authForm.nickname.trim() || '用户' + Math.floor(Math.random() * 10000);
      const colors = ['f97316', 'ec4899', '8b5cf6', '06b6d4', '10b981', '3b82f6'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=${color}&color=fff&rounded=true&bold=true&size=128`;

      login({
        id: 'user_' + Date.now(),
        phone: authMethod === 'phone' ? authForm.phone : undefined,
        email: authMethod === 'email' ? authForm.email : undefined,
        nickname,
        avatarUrl,
      });

      setAuthLoading(false);
    }, 800);
  };

  // 处理游客登录
  const handleGuestLogin = () => {
    login();
  };

  // 开始编辑昵称
  const handleEditStart = () => {
    setEditNickname(user?.nickname || '');
    setIsEditing(true);
  };

  // 保存昵称
  const handleSaveNickname = () => {
    if (editNickname.trim() && editNickname !== user?.nickname) {
      updateUser({ nickname: editNickname.trim() });
    }
    setIsEditing(false);
  };

  // 未登录状态 - 显示注册/登录表单
  if (!isLoggedIn) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* 头部背景 */}
          <div className="h-28 bg-gradient-to-br from-brand-400 via-brand-500 to-orange-400 relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent"></div>
          </div>

          {/* 认证卡片 */}
          <div className="px-6 pb-8 -mt-6 relative">
            <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg border-4 border-white">
              <span className="text-3xl">🐱</span>
            </div>

            <div className="text-center mt-3">
              <h2 className="text-xl font-bold text-slate-800">
                {authMode === 'register' ? '创建账号' : '欢迎回来'}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {authMode === 'register' ? '加入猫猫领养平台，帮助更多毛孩子' : '登录您的账号继续'}
              </p>
            </div>

            {/* 切换登录方式 Tab */}
            <div className="flex bg-slate-100 rounded-xl p-1 mt-6">
              <button
                onClick={() => setAuthMethod('phone')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5
                  ${authMethod === 'phone' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
              >
                <Phone size={16} />
                手机号
              </button>
              <button
                onClick={() => setAuthMethod('email')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5
                  ${authMethod === 'email' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
              >
                <Mail size={16} />
                邮箱
              </button>
            </div>

            {/* 表单 */}
            <form onSubmit={handleAuth} className="mt-4 space-y-4">
              {/* 手机号/邮箱输入 */}
              {authMethod === 'phone' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">手机号</label>
                  <input
                    type="tel"
                    value={authForm.phone}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="请输入手机号"
                    maxLength={11}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-base"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">邮箱</label>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="请输入邮箱地址"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-base"
                  />
                </div>
              )}

              {/* 密码输入 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={authForm.password}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={authMode === 'register' ? '设置密码（至少6位）' : '请输入密码'}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-base pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* 注册时显示昵称输入 */}
              {authMode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">昵称</label>
                  <input
                    type="text"
                    value={authForm.nickname}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, nickname: e.target.value }))}
                    placeholder="给自己起个名字吧"
                    maxLength={20}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-base"
                  />
                </div>
              )}

              {/* 错误提示 */}
              {authError && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
                  <AlertCircle size={16} />
                  {authError}
                </div>
              )}

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? '处理中...' : (authMode === 'register' ? '注册' : '登录')}
              </button>
            </form>

            {/* 切换注册/登录 */}
            <div className="mt-4 text-center text-sm text-slate-500">
              {authMode === 'register' ? (
                <span>
                  已有账号？
                  <button
                    onClick={() => setAuthMode('login')}
                    className="text-brand-600 font-medium ml-1 hover:underline"
                  >
                    去登录
                  </button>
                </span>
              ) : (
                <span>
                  没有账号？
                  <button
                    onClick={() => setAuthMode('register')}
                    className="text-brand-600 font-medium ml-1 hover:underline"
                  >
                    去注册
                  </button>
                </span>
              )}
            </div>

            {/* 分割线 */}
            <div className="flex items-center gap-3 mt-6">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-xs text-slate-400">或</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            {/* 游客登录 */}
            <button
              onClick={handleGuestLogin}
              className="w-full mt-4 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm"
            >
              随便逛逛（游客模式）
            </button>

            <p className="text-center text-xs text-slate-400 mt-4">
              注册即表示您同意我们的服务条款和隐私政策
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 已登录状态
  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* 游客提示 */}
      {isGuest && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium text-sm">您当前是游客模式</p>
            <p className="text-amber-600 text-xs mt-1">绑定手机号或邮箱后才能发布领养信息、发表评论和申请领养</p>
            <button
              onClick={logout}
              className="mt-2 text-xs text-amber-700 font-medium hover:underline"
            >
              去注册正式账号 →
            </button>
          </div>
        </div>
      )}

      {/* 用户信息卡片 */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* 头部背景 */}
        <div className="h-24 bg-gradient-to-br from-brand-400 via-brand-500 to-orange-400 relative">
          <button className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors">
            <Settings size={18} />
          </button>
        </div>

        {/* 用户信息 */}
        <div className="px-6 pb-6 -mt-10 relative">
          <div className="relative inline-block">
            <img
              src={user?.avatarUrl || 'https://ui-avatars.com/api/?name=U&background=e2e8f0&color=94a3b8&rounded=true&size=128'}
              alt={user?.nickname}
              className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover bg-slate-200"
            />
            <button className="absolute bottom-0 right-0 p-1.5 bg-brand-500 text-white rounded-full shadow-lg hover:bg-brand-600 transition-colors">
              <Camera size={14} />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  maxLength={20}
                  autoFocus
                />
                <button
                  onClick={handleSaveNickname}
                  className="px-3 py-1.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600"
                >
                  保存
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-slate-500 text-sm hover:text-slate-700"
                >
                  取消
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-slate-800">{user?.nickname}</h2>
                <button
                  onClick={handleEditStart}
                  className="p-1 text-slate-400 hover:text-brand-500 transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                {isGuest && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">游客</span>
                )}
              </>
            )}
          </div>

          <p className="text-sm text-slate-500 mt-1">
            {user?.phone && <span className="mr-3">📱 {user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>}
            {user?.email && <span>📧 {user.email.replace(/(.{2}).*@/, '$1***@')}</span>}
            {!user?.phone && !user?.email && <span>ID: {user?.id?.slice(-8)}</span>}
          </p>

          {/* 统计数据 */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100">
            <div className="text-center">
              <div className="text-lg font-bold text-slate-800">{user?.favoriteCount || 0}</div>
              <div className="text-xs text-slate-500">收藏</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-slate-800">{user?.commentCount || 0}</div>
              <div className="text-xs text-slate-500">评论</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-slate-800">{user?.adoptionCount || 0}</div>
              <div className="text-xs text-slate-500">申请</div>
            </div>
          </div>
        </div>
      </div>

      {/* 功能菜单 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <MenuItem icon={<Heart size={20} />} title="我的收藏" color="text-red-500" />
        <MenuItem icon={<MessageCircle size={20} />} title="我的评论" color="text-blue-500" />
        <MenuItem icon={<FileText size={20} />} title="领养申请" color="text-green-500" />
      </div>

      {/* 退出登录 */}
      <button
        onClick={logout}
        className="w-full py-4 bg-white rounded-2xl shadow-sm text-red-500 font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut size={18} />
        退出登录
      </button>
    </div>
  );
};

// 菜单项组件
const MenuItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  color?: string;
  onClick?: () => void;
}> = ({ icon, title, color = 'text-slate-600', onClick }) => (
  <button
    onClick={onClick}
    className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0"
  >
    <div className="flex items-center gap-3">
      <span className={color}>{icon}</span>
      <span className="font-medium text-slate-700">{title}</span>
    </div>
    <ChevronRight size={18} className="text-slate-400" />
  </button>
);

export default ProfilePage;
