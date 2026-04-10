import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';

import { API_URL } from '../config';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/auth/register`, { username, password });
      setSuccess('Account created! Redirecting…');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err.response?.data || 'Registration failed');
    }
  };

  return (
    <Layout>
      <div className="flex justify-center items-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto flex items-center justify-center shadow-lg shadow-indigo-200 mb-4">
              <span className="text-white font-black text-2xl">F</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800">Create account</h1>
            <p className="text-slate-500 mt-1">Join FlashMastery for free</p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg shadow-blue-100/60 border border-slate-100 p-8">
            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium">{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium">{success}</div>}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2 block">Username</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2 block">Password</label>
                <input
                  type="password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 shadow-md shadow-indigo-200 transition-all mt-2"
              >
                Create Account
              </button>
            </form>
            <p className="mt-6 text-center text-slate-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-bold hover:text-blue-700">Log in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Register;
