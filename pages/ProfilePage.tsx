import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useNotifications } from '../context/NotificationContext';
import { authService, userService, catService } from '../services/apiService';
import { Settings, ChevronRight, Heart, MessageCircle, FileText, LogOut, Edit2, Camera, Mail, Phone, Eye, EyeOff, AlertCircle, ThumbsUp, Cat, Loader2, Lock as LockIcon, CheckCircle2, MessageSquareText } from 'lucide-react';

type AuthMode = 'login' | 'register';

const ProfilePage: React.FC = () => {
  const { user, isLoggedIn, isGuest, login, logout, updateUser } = useUser();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  // 获取用户统计数据（包括游客）
  useEffect(() => {
    if (user?.id) {
      userService.getStats(user.id).then(stats => {
        updateUser(stats);
      });
    }
  }, [user?.id]);

  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 认证相关状态
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // 当从登录状态变为未登录状态（即退出登录）时，默认显示登录界面
  useEffect(() => {
    if (!isLoggedIn) {
      setAuthMode('login');
    }
  }, [isLoggedIn]);
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

    try {
      if (authMode === 'register') {
        const { user: newUser, error } = await authService.register({
          phone: authMethod === 'phone' ? authForm.phone : undefined,
          email: authMethod === 'email' ? authForm.email : undefined,
          password: authForm.password,
          nickname: authForm.nickname.trim(),
        });

        if (error) {
          setAuthError(error);
          setAuthLoading(false);
          return;
        }

        if (newUser) {
          login(newUser);
        }
      } else {
        const { user: existingUser, error } = await authService.login({
          phone: authMethod === 'phone' ? authForm.phone : undefined,
          email: authMethod === 'email' ? authForm.email : undefined,
          password: authForm.password,
        });

        if (error) {
          setAuthError(error);
          setAuthLoading(false);
          return;
        }

        if (existingUser) {
          login(existingUser);
        }
      }
    } catch (err) {
      setAuthError('操作失败，请重试');
    }

    setAuthLoading(false);
  };

  const handleGuestLogin = () => {
    login();
  };

  const handleEditStart = () => {
    setEditNickname(user?.nickname || '');
    setIsEditing(true);
  };

  const handleSaveNickname = async () => {
    if (!user?.id || isGuest) return;

    if (editNickname.trim() && editNickname !== user?.nickname) {
      try {
        const updatedUser = await userService.updateProfile(user.id, { nickname: editNickname.trim() });
        if (updatedUser) {
          updateUser(updatedUser);
        }
      } catch (err) {
        console.error('更新昵称失败:', err);
        alert('更新昵称失败，请重试');
      }
    }
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    if (isGuest) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await catService.uploadImage(file);
      if (!imageUrl) {
        throw new Error('图片上传失败');
      }
      const updatedUser = await userService.updateProfile(user.id, { avatarUrl: imageUrl });
      if (updatedUser) {
        updateUser(updatedUser);
      }
    } catch (err) {
      console.error('更新头像失败:', err);
      alert('更新头像失败，请重试');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 未登录界面
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        {/* 标准顶部导航栏 */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-30 px-4 py-3 flex items-center justify-center shadow-sm border-b border-slate-100 -mx-4">
          <h1 className="text-lg font-bold text-slate-800">
            {authMode === 'register' ? '注册账号' : '登录账号'}
          </h1>
        </div>

        <div className="max-w-md mx-auto py-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
            <div className="flex flex-col items-center justify-center text-center mb-8">
              <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mb-4 text-3xl shadow-sm border border-pink-100">
                🐱
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                {authMode === 'register' ? '加入暖心社区' : '欢迎回家'}
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                {authMode === 'register' ? '遇见命中注定的猫咪' : '登录账号，查看您的毛孩子'}
              </p>
            </div>

            <div className="bg-slate-50 p-1 rounded-xl flex relative mb-6">
              <div
                className={`absolute inset-y-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out ${authMethod === 'email' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}`}
              ></div>
              <button
                onClick={() => setAuthMethod('phone')}
                className={`flex-1 relative z-10 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${authMethod === 'phone' ? 'text-rose-500' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Phone size={16} />
                手机号
              </button>
              <button
                onClick={() => setAuthMethod('email')}
                className={`flex-1 relative z-10 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${authMethod === 'email' ? 'text-rose-500' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Mail size={16} />
                邮箱
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {authMethod === 'phone' ? (
                <div className="group">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      value={authForm.phone}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="请输入手机号"
                      maxLength={11}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-rose-400 focus:outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400 text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="group">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="你的邮箱地址"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-rose-400 focus:outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400 text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="group">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors">
                    <LockIcon size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={authForm.password}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={authMode === 'register' ? '设置安全密码 (6位以上)' : '请输入密码'}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-rose-400 focus:outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {authMode === 'register' && (
                <div className="group">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors">
                      <div className="w-5 flex justify-center text-base">😊</div>
                    </div>
                    <input
                      type="text"
                      value={authForm.nickname}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, nickname: e.target.value }))}
                      placeholder="给自己起个好听的名字"
                      maxLength={20}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-rose-400 focus:outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400 text-sm"
                    />
                  </div>
                </div>
              )}

              {authError && (
                <div className="flex items-center gap-2 text-rose-500 text-xs bg-rose-50 px-3 py-2 rounded-lg border border-rose-100 font-medium animate-pulse">
                  <AlertCircle size={14} />
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-rose-400/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {authLoading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : (authMode === 'register' ? '立即注册' : '登 录')}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-xs font-medium">
              <button
                onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}
                className="text-slate-500 hover:text-rose-500 transition-colors"
              >
                {authMode === 'register' ? '已有账号？去登录' : '没有账号？去注册'}
              </button>

              <button
                onClick={handleGuestLogin}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                先逛逛看 →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 已登录状态 - 现代化 Dashboard 设计 (修复：高度缩小，粉色系可爱风)
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 顶部个人卡片区域 - 紧凑型 */}
      <div className="bg-gradient-to-r from-pink-400 via-rose-400 to-pink-300 pb-10 pt-6 px-4 rounded-b-[2rem] shadow-xl shadow-pink-500/10 relative overflow-hidden -mx-4">
        {/* 背景纹理 */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/5 to-transparent"></div>

        {/* 设置按钮 */}
        <button className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all border border-white/20 hover:rotate-90 duration-500 z-20">
          <Settings size={18} />
        </button>

        {/* 用户基础信息 */}
        <div className="relative z-10 flex flex-col items-center">
          {/* 头像 - 缩小尺寸 */}
          <div className="relative mb-2 group">
            <div
              className={`w-20 h-20 rounded-full border-[4px] border-white/40 shadow-xl overflow-hidden relative bg-pink-50 ${!isGuest ? 'cursor-pointer group-hover:scale-105 transition-transform duration-300' : ''}`}
              onClick={handleAvatarClick}
            >
              <img
                src={user?.avatarUrl || 'https://ui-avatars.com/api/?name=User&background=fce7f3&color=db2777&rounded=true&size=128'}
                alt={user?.nickname}
                className={`w-full h-full object-cover ${isUploading ? 'opacity-50 blur-sm' : ''}`}
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            {!isGuest && (
              <button
                onClick={handleAvatarClick}
                disabled={isUploading}
                className="absolute bottom-0 right-0 p-1.5 bg-slate-800 text-white rounded-full shadow-lg border-2 border-white hover:bg-black transition-colors transform hover:scale-110"
              >
                <Camera size={12} />
              </button>
            )}
            {/* 隐藏的文件输入框 */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* 昵称 */}
          <div className="text-center w-full text-white">
            {isEditing ? (
              <div className="flex items-center justify-center gap-2 mb-1">
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="px-3 py-1 bg-white/20 border border-white/30 rounded-lg text-lg font-bold text-white focus:outline-none focus:bg-white/30 text-center w-40 placeholder-white/70"
                  maxLength={20}
                  autoFocus
                />
                <button onClick={handleSaveNickname} className="p-1.5 bg-white text-pink-500 rounded-lg shadow-sm font-bold"><ThumbsUp size={14} /></button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="text-xl font-bold tracking-tight shadow-black/5 drop-shadow-sm">{user?.nickname}</h2>
                <button onClick={handleEditStart} className="text-white/80 hover:text-white transition-colors bg-white/10 p-0.5 rounded-full">
                  <Edit2 size={12} />
                </button>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-xs font-medium text-white/90">
              {isGuest ? (
                <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px] backdrop-blur-sm border border-white/20">游客身份</span>
              ) : (
                <>
                  <span className="font-mono opacity-90">ID: {user?.id?.slice(-6).toUpperCase()}</span>
                  {(user?.phone || user?.email) && (
                    <span className="w-0.5 h-0.5 bg-white/60 rounded-full"></span>
                  )}
                  {user?.phone ? (
                    <span className="font-mono opacity-90">{user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
                  ) : user?.email ? (
                    <span className="font-mono opacity-90">{user.email.replace(/(.{2}).*@/, '$1***@')}</span>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 - 悬浮在 Header 之上 */}
      <div className="max-w-lg mx-auto -mt-6 relative z-10 space-y-4">

        {/* 核心数据概览 (Dashboard) */}
        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 p-4 border border-slate-50/50">
          <div className="grid grid-cols-4 gap-2">
            <StatItem
              icon={<Heart size={20} className="fill-rose-400 text-rose-400" />}
              value={user?.favoriteCount || 0}
              label="收藏"
              to="/my/favorites"
            />
            <StatItem
              icon={<ThumbsUp size={20} className="fill-pink-400 text-pink-400" />}
              value={user?.likeCount || 0}
              label="点赞"
              to="/my/likes"
            />
            <StatItem
              icon={<MessageCircle size={20} className="fill-sky-400 text-sky-400" />}
              value={user?.commentCount || 0}
              label="评论"
              to="/my/comments"
            />
            <StatItem
              icon={<FileText size={20} className="fill-amber-400 text-amber-400" />}
              value={user?.adoptionCount || 0}
              label="申请"
              to="/my/applications"
            />
          </div>
        </div>

        {/* 游客提示横幅 */}
        {isGuest && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center">
                <AlertCircle size={16} />
              </div>
              <div>
                <h4 className="font-bold text-rose-800 text-xs">功能受限</h4>
                <p className="text-rose-600/80 text-[10px] text-left">登录解锁全部领养功能</p>
              </div>
            </div>
            <button onClick={logout} className="px-3 py-1.5 bg-rose-400 text-white text-[10px] font-bold rounded-lg shadow-md shadow-rose-400/20 active:scale-95 transition-all">
              去登录
            </button>
          </div>
        )}

        {/* 我的猫咪 */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <MenuItemGroup title="我的猫咪">
            <MenuItem
              icon={<Cat size={18} />}
              title="我领养的猫猫"
              description="查看已成功领养的毛孩子"
              color="text-amber-500"
              to="/my/cats"
            />
            <MenuItem
              icon={<Heart size={18} />}
              title="我发布的猫猫"
              description="管理我发布的领养信息"
              color="text-blue-500"
              to="/my/published"
            />
          </MenuItemGroup>
        </div>

        {/* 其他功能菜单 */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <MenuItemGroup title="服务中心">
            <MenuItem
              icon={<Mail size={18} />}
              title="消息通知"
              color="text-pink-500"
              badge={unreadCount > 0 ? String(unreadCount) : undefined}
              to="/notifications"
            />
            {/* 管理员通过后台处理客服消息，不显示在线客服入口 */}
            {user?.role !== 'admin' && (
              <MenuItem
                icon={<MessageSquareText size={18} />}
                title="在线客服"
                description="专属顾问在线解答"
                color="text-emerald-500"
                to="/support"
              />
            )}
          </MenuItemGroup>
        </div>

        <button
          onClick={logout}
          className="w-full py-3.5 bg-white border border-slate-100 rounded-2xl text-slate-400 font-medium hover:bg-slate-50 hover:text-rose-500 transition-colors flex items-center justify-center gap-2 text-xs"
        >
          <LogOut size={16} />
          退出登录
        </button>

        <div className="text-center pb-6 pt-2">
          <p className="text-[10px] text-slate-300 font-mono uppercase tracking-widest">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

// 仪表盘统计项
const StatItem: React.FC<{
  icon: React.ReactNode;
  value: number;
  label: string;
  to: string;
}> = ({ icon, value, label, to }) => (
  <Link to={to} className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer active:scale-95 group">
    <div className="mb-2 p-3 bg-slate-50 rounded-2xl group-hover:bg-white group-hover:shadow-sm group-hover:-translate-y-1 transition-all duration-300">
      {icon}
    </div>
    <span className="text-lg font-bold text-slate-800 leading-none mb-1">{value}</span>
    <span className="text-xs text-slate-500 font-medium">{label}</span>
  </Link>
);

// 菜单组
const MenuItemGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
      {title}
    </div>
    <div>{children}</div>
  </div>
);

// 菜单项
const MenuItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  description?: string;
  color?: string;
  to?: string;
  onClick?: () => void;
  badge?: string;
}> = ({ icon, title, description, color = 'text-slate-600', to, onClick, badge }) => {
  const content = (
    <>
      <div className="flex items-center gap-3.5">
        <div className={`p-1.5 rounded-lg bg-slate-50 ${color}`}>{icon}</div>
        <div className="flex-1">
          <div className="font-bold text-slate-700 text-sm">{title}</div>
          {description && <div className="text-slate-400 text-xs mt-0.5">{description}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {badge && <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full">{badge}</span>}
        <ChevronRight size={16} className="text-slate-300" />
      </div>
    </>
  );

  const className = "w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0 active:bg-slate-100";

  if (to) {
    return <Link to={to} className={className}>{content}</Link>;
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
};

export default ProfilePage;
