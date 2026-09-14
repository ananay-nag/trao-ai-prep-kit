'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, 
  LogIn, 
  UserPlus, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Compass, 
  ArrowRight,
  Lock,
  Mail,
  User
} from 'lucide-react';
import { loginUser, registerUser, getAuthToken, getMe } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      getMe().then((user) => {
        if (user?.email) {
          router.push('/dashboard');
        }
      }).catch(() => {});
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (authMode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!confirmPassword.trim()) {
        setError('Please re-enter your password.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);

    try {
      if (authMode === 'login') {
        await loginUser(email, password);
      } else {
        await registerUser(email, password, name);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/20 mb-2">
          <Sparkles className="h-6 w-6 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          {authMode === 'login' ? 'Sign in to Your Account' : 'Create Candidate Account'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          {authMode === 'login' 
            ? 'Access your private workspace and personalized interview kits.' 
            : 'Register to create, customize, and track your interview preparation.'}
        </p>
      </div>

      {/* Main Form Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
        {/* Switch Tabs */}
        <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex">
          <button
            type="button"
            onClick={() => { 
              setAuthMode('login'); 
              setError(null); 
              setConfirmPassword('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              authMode === 'login' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { 
              setAuthMode('register'); 
              setError(null); 
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              authMode === 'register' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-emerald-400" /> Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ANANYA NAG"
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-emerald-400" /> Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="candidate@example.com"
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-teal-400" /> Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Re-enter Password Field (Register Mode Only) */}
          {authMode === 'register' && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-cyan-400" /> Re-enter Password (Confirm)
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Authenticating...
              </>
            ) : authMode === 'login' ? (
              <>
                <LogIn className="h-4 w-4" /> Sign In & Open Dashboard
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" /> Register & Open Dashboard
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
