import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AddCatPage from './pages/AddCatPage';
import CatDetailsPage from './pages/CatDetailsPage';
import AdminPage from './pages/AdminPage';
import { ToastProvider } from './context/ToastContext';
import { useKeyboardFix } from './hooks/useKeyboardFix';

// 内部组件，用于在 Router 内部使用 hook
const AppContent: React.FC = () => {
  // 启用 iOS 键盘修复
  useKeyboardFix('app-container');

  return (
    <div id="app-container" className="min-h-screen flex flex-col font-sans text-slate-800 bg-brand-50/30">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-6 md:py-8 max-w-6xl md:pb-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/add" element={<AddCatPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/cat/:id" element={<CatDetailsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </HashRouter>
  );
};

export default App;