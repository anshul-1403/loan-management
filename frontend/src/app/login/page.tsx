'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { KeyRound, Mail, Lock, Sparkles, Loader2 } from 'lucide-react';

const SEEDED_ACCOUNTS = [
  { label: 'Borrower', email: 'borrower@credisea.com', password: 'Borrower@123', color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/30 text-blue-400' },
  { label: 'Sales', email: 'sales@credisea.com', password: 'Sales@123', color: 'from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-400' },
  { label: 'Sanction', email: 'sanction@credisea.com', password: 'Sanction@123', color: 'from-purple-500/10 to-fuchsia-500/10 border-purple-500/30 text-purple-400' },
  { label: 'Disburse', email: 'disburse@credisea.com', password: 'Disburse@123', color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-400' },
  { label: 'Collection', email: 'collect@credisea.com', password: 'Collect@123', color: 'from-pink-500/10 to-rose-500/10 border-pink-500/30 text-pink-400' },
  { label: 'Admin', email: 'admin@credisea.com', password: 'Admin@123', color: 'from-red-500/10 to-rose-500/10 border-red-500/30 text-red-400' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success('Successfully logged in!');
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (acc: typeof SEEDED_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setIsSubmitting(true);
    try {
      await login(acc.email, acc.password);
      toast.success(`Logged in as ${acc.label}!`);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Quick login failed.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 overflow-y-auto">
      {/* Glow elements */}
      <div className="absolute top-[20%] left-[30%] w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[30%] w-[350px] h-[350px] rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 z-10 py-10">
        {/* Logo Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center space-x-2">
            <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 p-2 rounded-xl text-white font-bold tracking-wider">
              CS
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              CrediSea
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Sign in to your account
          </h2>
          <p className="text-sm text-slate-400 font-light">
            Or{' '}
            <Link href="/register" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
              create a new borrower account
            </Link>
          </p>
        </div>

        {/* Main Login Card */}
        <div className="glass-card p-8 rounded-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 text-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Dev Login Shortcuts */}
          <div className="border-t border-slate-850 pt-6 space-y-4">
            <div className="flex items-center space-x-2 text-slate-400">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                Quick Dev Login Shortcuts
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {SEEDED_ACCOUNTS.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  disabled={isSubmitting}
                  className={`flex flex-col items-center justify-center p-2.5 bg-gradient-to-br border rounded-xl hover:scale-[1.02] transition-all text-center text-xs cursor-pointer font-medium ${acc.color}`}
                >
                  <span className="font-bold">{acc.label}</span>
                  <span className="text-[10px] opacity-75 mt-0.5 truncate max-w-full">
                    {acc.email.split('@')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
