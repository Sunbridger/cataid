import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cat, PlusCircle, Home, Settings } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path 
    ? "text-brand-600 font-semibold bg-brand-50" 
    : "text-slate-600 hover:text-brand-500 hover:bg-white";

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-6xl h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-brand-500 text-white p-1.5 rounded-lg group-hover:rotate-12 transition-transform duration-300">
            <Cat size={24} />
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">猫猫<span className="text-brand-500">领养</span></span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link 
            to="/" 
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${isActive('/')}`}
          >
            <Home size={18} />
            <span className="hidden sm:inline">浏览猫咪</span>
          </Link>
          
          <Link 
            to="/add" 
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${isActive('/add')}`}
          >
            <PlusCircle size={18} />
            <span className="hidden sm:inline">发布领养</span>
          </Link>

          <Link 
            to="/admin" 
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${isActive('/admin')}`}
          >
            <Settings size={18} />
            <span className="hidden sm:inline">管理后台</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;