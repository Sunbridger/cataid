import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cat, PlusCircle, Home, Settings } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path
    ? "text-brand-600 font-semibold bg-brand-50"
    : "text-slate-600 hover:text-brand-500 hover:bg-white";

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-slate-100/50">
      <div className="container mx-auto px-4 max-w-6xl h-14 md:h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-brand-500 text-white p-1.5 rounded-lg group-hover:rotate-12 transition-transform duration-300">
            <Cat size={20} className="md:w-6 md:h-6" />
          </div>
          <span className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">猫猫<span className="text-brand-500">领养</span></span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/"
            className={`p-2 sm:px-4 sm:py-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 min-w-[3rem] sm:min-w-0
              ${location.pathname === '/' ? 'text-brand-600 bg-brand-50 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Home size={20} className="md:w-5 md:h-5" strokeWidth={location.pathname === '/' ? 2.5 : 2} />
            <span className="text-[10px] sm:text-sm font-medium leading-none sm:leading-normal">首页</span>
          </Link>

          <Link
            to="/add"
            className={`p-2 sm:px-4 sm:py-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 min-w-[3rem] sm:min-w-0
              ${location.pathname === '/add' ? 'text-white bg-brand-500 shadow-lg shadow-brand-500/20' : 'text-brand-600 hover:bg-brand-50'}`}
          >
            <PlusCircle size={20} className="md:w-5 md:h-5" strokeWidth={location.pathname === '/add' ? 2.5 : 2} />
            <span className="text-[10px] sm:text-sm font-bold leading-none sm:leading-normal">发布</span>
          </Link>

          <Link
            to="/admin"
            className={`p-2 sm:px-4 sm:py-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 min-w-[3rem] sm:min-w-0
              ${location.pathname === '/admin' ? 'text-slate-800 bg-slate-100 font-bold' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <Settings size={20} className="md:w-5 md:h-5" strokeWidth={location.pathname === '/admin' ? 2.5 : 2} />
            <span className="text-[10px] sm:text-sm font-medium leading-none sm:leading-normal">管理</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;