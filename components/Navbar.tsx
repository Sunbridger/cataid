import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cat, PlusCircle, Home, Settings, User } from 'lucide-react';
import { useUser } from '../context/UserContext';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, isLoggedIn } = useUser();

  // 是否为管理员
  const isAdmin = isLoggedIn && user?.role === 'admin';

  const isActive = (path: string) => location.pathname === path
    ? "text-pink-600 font-semibold bg-pink-50"
    : "text-slate-600 hover:text-pink-500 hover:bg-white";

  // 定义需要显示底部导航栏的路由
  const mainRoutes = ['/', '/add', '/profile'];
  if (isAdmin) mainRoutes.push('/admin');
  const shouldShowNavbar = mainRoutes.includes(location.pathname);

  return (
    <>
      {/* Desktop Navbar (Top) */}
      <nav className="hidden md:block bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-slate-100/50">
        <div className="container mx-auto px-4 max-w-6xl h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-pink-500 text-white p-1.5 rounded-lg group-hover:rotate-12 transition-transform duration-300">
              <Cat size={24} />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">猫猫<span className="text-pink-500">领养</span></span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${isActive('/')}`}
            >
              <Home size={18} />
              <span>浏览猫咪</span>
            </Link>

            <Link
              to="/add"
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${isActive('/add')}`}
            >
              <PlusCircle size={18} />
              <span>发布领养</span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${isActive('/admin')}`}
              >
                <Settings size={18} />
                <span>管理后台</span>
              </Link>
            )}

            <Link
              to="/profile"
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${isActive('/profile')}`}
            >
              <User size={18} />
              <span>我的</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navbar */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-100 pb-safe pt-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] ${!shouldShowNavbar ? 'hidden' : ''}`}>
        <div className="flex justify-around items-center h-16">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center w-20 h-full gap-0.5 group ${location.pathname === '/' ? 'text-pink-600' : 'text-slate-400 hover:text-slate-500'}`}
          >
            <div className={`p-1.5 rounded-2xl ${location.pathname === '/' ? 'bg-pink-50 shadow-sm shadow-pink-100' : ''}`}>
              <Home size={22} strokeWidth={location.pathname === '/' ? 2.5 : 2} className={location.pathname === '/' ? 'fill-pink-500/10' : ''} />
            </div>
            <span className={`text-[10px] ${location.pathname === '/' ? 'font-bold' : 'font-medium'}`}>首页</span>
          </Link>

          <Link
            to="/add"
            className={`flex flex-col items-center justify-center w-20 h-full gap-0.5 group ${location.pathname === '/add' ? 'text-pink-600' : 'text-slate-400 hover:text-slate-500'}`}
          >
            <div className={`p-1.5 rounded-2xl ${location.pathname === '/add' ? 'bg-pink-50 shadow-sm shadow-pink-100' : ''}`}>
              <PlusCircle size={22} strokeWidth={location.pathname === '/add' ? 2.5 : 2} className={location.pathname === '/add' ? 'fill-pink-500/10' : ''} />
            </div>
            <span className={`text-[10px] ${location.pathname === '/add' ? 'font-bold' : 'font-medium'}`}>发布</span>
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              className={`flex flex-col items-center justify-center w-20 h-full gap-0.5 group ${location.pathname === '/admin' ? 'text-pink-600' : 'text-slate-400 hover:text-slate-500'}`}
            >
              <div className={`p-1.5 rounded-2xl ${location.pathname === '/admin' ? 'bg-pink-50 shadow-sm shadow-pink-100' : ''}`}>
                <Settings size={22} strokeWidth={location.pathname === '/admin' ? 2.5 : 2} className={location.pathname === '/admin' ? 'fill-pink-500/10' : ''} />
              </div>
              <span className={`text-[10px] ${location.pathname === '/admin' ? 'font-bold' : 'font-medium'}`}>管理</span>
            </Link>
          )}

          <Link
            to="/profile"
            className={`flex flex-col items-center justify-center w-20 h-full gap-0.5 group ${location.pathname === '/profile' ? 'text-pink-600' : 'text-slate-400 hover:text-slate-500'}`}
          >
            <div className={`p-1.5 rounded-2xl ${location.pathname === '/profile' ? 'bg-pink-50 shadow-sm shadow-pink-100' : ''}`}>
              <User size={22} strokeWidth={location.pathname === '/profile' ? 2.5 : 2} className={location.pathname === '/profile' ? 'fill-pink-500/10' : ''} />
            </div>
            <span className={`text-[10px] ${location.pathname === '/profile' ? 'font-bold' : 'font-medium'}`}>我的</span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default Navbar;