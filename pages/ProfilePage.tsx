import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { User, Settings, ChevronRight, Heart, MessageCircle, FileText, LogOut, Edit2, Camera } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, isLoggedIn, login, logout, updateUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState('');

  // 处理一键登录（游客模式）
  const handleQuickLogin = () => {
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

  // 未登录状态
  if (!isLoggedIn) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* 头部背景 */}
          <div className="h-32 bg-gradient-to-br from-brand-400 via-brand-500 to-orange-400 relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
          </div>

          {/* 登录卡片 */}
          <div className="px-6 pb-8 -mt-8 relative">
            <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto flex items-center justify-center border-4 border-white shadow-lg">
              <User size={32} className="text-slate-400" />
            </div>

            <div className="text-center mt-4">
              <h2 className="text-xl font-bold text-slate-800">欢迎来到猫猫领养平台</h2>
              <p className="text-slate-500 text-sm mt-2">登录后可以收藏猫咪、发表评论、提交领养申请</p>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleQuickLogin}
                className="w-full py-3.5 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20"
              >
                一键登录（游客模式）
              </button>

              <p className="text-center text-xs text-slate-400">
                点击登录即表示您同意我们的服务条款和隐私政策
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 已登录状态
  return (
    <div className="max-w-lg mx-auto space-y-4">
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
              </>
            )}
          </div>

          <p className="text-sm text-slate-500 mt-1">
            ID: {user?.id?.slice(-8)}
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
