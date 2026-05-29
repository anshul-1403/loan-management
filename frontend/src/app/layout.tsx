import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CrediSea | Advanced Loan Management System',
  description: 'Apply for quick loans, check real-time BRE eligibility, and manage loan lifecycles efficiently.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full dark`}>
      <body className="min-h-full bg-slate-950 text-slate-100 font-sans antialiased flex flex-col">
        <AuthProvider>
          <Toaster 
            position="top-right" 
            toastOptions={{
              className: 'bg-slate-900 text-slate-100 border border-slate-800 rounded-xl',
              duration: 4000,
            }} 
          />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
