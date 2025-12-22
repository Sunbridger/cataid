import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cat, PlusCircle, Home, Settings } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path
    ? "text-brand-600 font-semibold bg-brand-50"
    : "text-slate-600 hover:text-brand-500 hover:bg-white";

  return (
    <>
      {/* Desktop Navbar (Top) */}
      <nav className="hidden md:block bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-slate-100/50">
        <div className="container mx-auto px-4 max-w-6xl h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-brand-500 text-white p-1.5 rounded-lg group-hover:rotate-12 transition-transform duration-300">
              <Cat size={24} />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">猫猫<span className="text-brand-500">领养</span></span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${isActive('/')}`}
            >
              <Home size={18} />
              <span>浏览猫咪</span>
            </Link>

            <Link
              to="/add"
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${isActive('/add')}`}
            >
              <PlusCircle size={18} />
              <span>发布领养</span>
            </Link>

            <Link
              to="/admin"
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${isActive('/admin')}`}
            >
              <Settings size={18} />
              <span>管理后台</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe pt-2 z-50">
        <div className="flex justify-around items-center h-14">
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${location.pathname === '/' ? 'text-slate-900' : 'text-slate-400'}`}
          >
            <Home size={24} strokeWidth={location.pathname === '/' ? 2.5 : 2} />
            <span className={`text-[10px] ${location.pathname === '/' ? 'font-bold' : 'font-medium'}`}>首页</span>
          </Link>

          <Link
            to="/add"
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${location.pathname === '/add' ? 'text-slate-900' : 'text-slate-400'}`}
          >
            <PlusCircle size={24} strokeWidth={location.pathname === '/add' ? 2.5 : 2} />
            <span className={`text-[10px] ${location.pathname === '/add' ? 'font-bold' : 'font-medium'}`}>发布</span>
          </Link>

          <Link
            to="/admin"
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${location.pathname === '/admin' ? 'text-slate-900' : 'text-slate-400'}`}
          >
            <Settings size={24} strokeWidth={location.pathname === '/admin' ? 2.5 : 2} />
            <span className={`text-[10px] ${location.pathname === '/admin' ? 'font-bold' : 'font-medium'}`}>管理</span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default Navbar;