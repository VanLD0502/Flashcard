import React from 'react';
import Header from './Header';
import { Toaster } from 'react-hot-toast';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Toaster position="top-center" toastOptions={{ duration: 3000, style: { background: '#333', color: '#fff', borderRadius: '12px' } }} />
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative">
        {children}
      </main>
    </div>
  );
};

export default Layout;
