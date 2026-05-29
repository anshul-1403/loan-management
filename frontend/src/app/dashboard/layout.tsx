'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, LayoutDashboard, Shield } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'Borrower') {
        router.push('/portal');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role === 'Borrower') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="text-sm font-medium text-slate-400">Loading Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-900 glass sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 p-2 rounded-xl text-white font-bold tracking-wider">
              CS
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              CrediSea Operations
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white">{user.name}</p>
              <div className="flex items-center space-x-1 justify-end text-indigo-400">
                <Shield className="w-3.5 h-3.5" />
                <span className="text-xs font-medium uppercase tracking-wider">{user.role} Hub</span>
              </div>
            </div>
            <button 
              onClick={logout}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 text-slate-300 hover:text-red-400 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main dashboard content area */}
      <div className="flex-grow flex flex-col">
        {children}
      </div>
    </div>
  );
}
