import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cat, PlusCircle, Home, Settings } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path
    ? "text-brand-600 font-semibold bg-brand-50"
    : "text-slate-600 hover:text-brand-500 hover:bg-white";

  // Define routes where the bottom navbar should be visible
  const mainRoutes = ['/', '/add', '/admin'];
  const shouldShowNavbar = mainRoutes.includes(location.pathname);

  // Detect if virtual keyboard is likely open (by checking if input is focused)
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) {
        setIsInputFocused(true);
      }
    };

    const handleFocusOut = () => {
      // Small delay to prevent flickering when switching focus between inputs
      setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement;
        if (!['INPUT', 'TEXTAREA'].includes(activeElement.tagName)) {
          setIsInputFocused(false);
        }
      }, 50);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

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
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-100 pb-safe pt-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] ${(isInputFocused || !shouldShowNavbar) ? 'hidden' : ''}`}>
        <div className="flex justify-around items-center h-16">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center w-20 h-full gap-0.5 transition-all duration-300 group ${location.pathname === '/' ? 'text-brand-600' : 'text-slate-400 hover:text-slate-500'}`}
          >
            <div className={`p-1.5 rounded-2xl transition-all duration-300 ${location.pathname === '/' ? 'bg-brand-50 scale-110 shadow-sm shadow-brand-100' : 'group-active:scale-95'}`}>
              <Home size={24} strokeWidth={location.pathname === '/' ? 2.5 : 2} className={location.pathname === '/' ? 'fill-brand-500/10' : ''} />
            </div>
            <span className={`text-[10px] transition-all duration-300 ${location.pathname === '/' ? 'font-bold' : 'font-medium'}`}>首页</span>
          </Link>

          <Link
            to="/add"
            className={`flex flex-col items-center justify-center w-20 h-full gap-0.5 transition-all duration-300 group ${location.pathname === '/add' ? 'text-brand-600' : 'text-slate-400 hover:text-slate-500'}`}
          >
            <div className={`p-1.5 rounded-2xl transition-all duration-300 ${location.pathname === '/add' ? 'bg-brand-50 scale-110 shadow-sm shadow-brand-100' : 'group-active:scale-95'}`}>
              <PlusCircle size={24} strokeWidth={location.pathname === '/add' ? 2.5 : 2} className={location.pathname === '/add' ? 'fill-brand-500/10' : ''} />
            </div>
            <span className={`text-[10px] transition-all duration-300 ${location.pathname === '/add' ? 'font-bold' : 'font-medium'}`}>发布</span>
          </Link>

          <Link
            to="/admin"
            className={`flex flex-col items-center justify-center w-20 h-full gap-0.5 transition-all duration-300 group ${location.pathname === '/admin' ? 'text-brand-600' : 'text-slate-400 hover:text-slate-500'}`}
          >
            <div className={`p-1.5 rounded-2xl transition-all duration-300 ${location.pathname === '/admin' ? 'bg-brand-50 scale-110 shadow-sm shadow-brand-100' : 'group-active:scale-95'}`}>
              <Settings size={24} strokeWidth={location.pathname === '/admin' ? 2.5 : 2} className={location.pathname === '/admin' ? 'fill-brand-500/10' : ''} />
            </div>
            <span className={`text-[10px] transition-all duration-300 ${location.pathname === '/admin' ? 'font-bold' : 'font-medium'}`}>管理</span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default Navbar;