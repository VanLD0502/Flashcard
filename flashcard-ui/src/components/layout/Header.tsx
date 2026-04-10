import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PlusCircle, LogOut, LayoutDashboard, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50 shadow-sm shadow-blue-100/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200 group-hover:shadow-indigo-300 transition-shadow">
              <span className="text-white font-black text-sm">F</span>
            </div>
            <span className="text-xl font-black tracking-tight">
              <span className="text-blue-600">Flash</span><span className="text-indigo-700">Mastery</span>
            </span>
          </Link>

          {/* Nav */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link to="/" className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 px-3 py-2 rounded-lg font-medium transition-colors hover:bg-blue-50">
                  <Home size={16} /> <span className="hidden sm:inline">Home</span>
                </Link>
                <Link to="/my-sets" className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 px-3 py-2 rounded-lg font-medium transition-colors hover:bg-indigo-50">
                  <LayoutDashboard size={16} /> <span className="hidden sm:inline">My Sets</span>
                </Link>

                <Link
                  to="/create"
                  className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 shadow-md shadow-indigo-200 hover:shadow-indigo-300 transition-all"
                >
                  <PlusCircle size={16} />
                  <span>Create</span>
                </Link>

                <div className="flex items-center gap-3 ml-2 pl-3 border-l border-slate-200">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-white flex items-center justify-center font-bold text-sm select-none shadow-md ring-2 ring-white">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                    title="Log out"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-blue-600 px-4 py-2 rounded-lg font-medium transition-colors hover:bg-blue-50">Log in</Link>
                <Link to="/register" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 shadow-md transition-all">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
