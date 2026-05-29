'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, DollarSign, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-slate-950">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-900 glass sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 p-2 rounded-xl text-white font-bold tracking-wider">
              CS
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              CrediSea
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/login" 
              className="text-slate-300 hover:text-white px-4 py-2 text-sm font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-indigo-500/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex items-center justify-center py-20 px-6 z-10">
        <div className="max-w-5xl mx-auto text-center space-y-10">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full text-indigo-400 text-sm font-semibold tracking-wide uppercase">
            <span>✨</span>
            <span>Secure & Automated Lending Lifecycle</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-none">
            Modern Loan Management <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              Simplified & Accelerated.
            </span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            An end-to-end credit platform. Borrowers get instant eligibility checks via our automated BRE engine. Executives manage leads, appraisals, disbursements, and collections seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/register" 
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium px-8 py-4 rounded-2xl shadow-lg hover:shadow-indigo-500/25 transition-all text-base group"
            >
              <span>Apply for a Loan</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto flex items-center justify-center bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-white font-medium px-8 py-4 rounded-2xl transition-colors text-base"
            >
              Access Operations Hub
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-16 max-w-4xl mx-auto">
            <div className="glass-card p-6 rounded-2xl text-left space-y-3">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit rounded-xl">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Instant BRE Check</h3>
              <p className="text-slate-400 text-sm font-light">Real-time age, salary, PAN format, and employment checks directly on submission.</p>
            </div>

            <div className="glass-card p-6 rounded-2xl text-left space-y-3">
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 w-fit rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Flexible Sliders</h3>
              <p className="text-slate-400 text-sm font-light">Configure loan amounts from ₹50K to ₹5L and tenures from 30 to 365 days instantly.</p>
            </div>

            <div className="glass-card p-6 rounded-2xl text-left space-y-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Role-Based Access</h3>
              <p className="text-slate-400 text-sm font-light">Fine-grained RBAC for Sales, Sanctions, Disbursements, and Collections teams.</p>
            </div>

            <div className="glass-card p-6 rounded-2xl text-left space-y-3">
              <div className="p-3 bg-pink-500/10 border border-pink-500/20 text-pink-400 w-fit rounded-xl">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Auto Loan Closure</h3>
              <p className="text-slate-400 text-sm font-light">Direct UTR recording updates outstanding balance and closes loans automatically.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-slate-500 text-xs tracking-wider z-10">
        <p>&copy; {new Date().getFullYear()} CrediSea. Built with Next.js App Router, Express, and Mongoose.</p>
      </footer>
    </div>
  );
}
