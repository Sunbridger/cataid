import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AddCatPage from './pages/AddCatPage';
import CatDetailsPage from './pages/CatDetailsPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import MyFavoritesPage from './pages/MyFavoritesPage';
import MyCommentsPage from './pages/MyCommentsPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import { ToastProvider } from './context/ToastContext';
import { UserProvider } from './context/UserContext';

// 布局组件：根据当前路由动态调整底部内边距
const Layout: React.FC = () => {
  const location = useLocation();
  // 有底部导航栏的页面
  const showBottomNav = ['/', '/add', '/admin', '/profile'].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 bg-slate-50">
      <Navbar />
      <main className={`flex-grow container mx-auto px-4 pt-6 md:py-8 max-w-6xl ${showBottomNav ? 'pb-24 md:pb-8' : 'pb-4 md:pb-8'}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/add" element={<AddCatPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/cat/:id" element={<CatDetailsPage />} />
          {/* 我的模块子页面 */}
          <Route path="/my/favorites" element={<MyFavoritesPage />} />
          <Route path="/my/comments" element={<MyCommentsPage />} />
          <Route path="/my/applications" element={<MyApplicationsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <UserProvider>
        <ToastProvider>
          <Layout />
        </ToastProvider>
      </UserProvider>
    </HashRouter>
  );
};

export default App;