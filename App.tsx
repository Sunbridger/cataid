import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AddCatPage from './pages/AddCatPage';
import CatDetailsPage from './pages/CatDetailsPage';
import AdminPage from './pages/AdminPage';
import { ToastProvider } from './context/ToastContext';

const App: React.FC = () => {
  return (
    <HashRouter>
      <ToastProvider>
        <div className="min-h-screen flex flex-col font-sans text-slate-800 bg-brand-50/30">
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
          <footer className="bg-white border-t border-brand-100 py-6">
            <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
              <p>© 2025 猫猫领养平台</p>
            </div>
          </footer>
        </div>
      </ToastProvider>
    </HashRouter>
  );
};

export default App;