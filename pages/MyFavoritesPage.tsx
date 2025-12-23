import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { useUser } from '../context/UserContext';

const MyFavoritesPage: React.FC = () => {
  const { isLoggedIn } = useUser();

  if (!isLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <Heart size={48} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">请先登录</h2>
          <p className="text-slate-500 mb-4">登录后查看您收藏的猫咪</p>
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
        <h1 className="text-2xl font-bold text-slate-800">我的收藏</h1>
      </div>

      {/* 空状态 */}
      <div className="bg-white rounded-2xl shadow-sm text-center py-16">
        <Heart size={48} className="text-slate-200 mx-auto mb-4" />
        <p className="text-slate-400 mb-2">还没有收藏的猫咪</p>
        <p className="text-slate-400 text-sm mb-4">在猫咪详情页点击爱心即可收藏</p>
        <Link
          to="/"
          className="text-brand-500 hover:underline text-sm"
        >
          去看看可爱的猫咪们 →
        </Link>
      </div>

      {/* TODO: 收藏功能待实现 */}
      {/* 收藏功能需要：
          1. 在数据库中创建 favorites 表
          2. 创建收藏 API
          3. 在猫咪详情页添加收藏按钮
          4. 这里加载并显示收藏列表
      */}
    </div>
  );
};

export default MyFavoritesPage;
