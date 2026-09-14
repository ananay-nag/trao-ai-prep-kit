'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sparkles,
  Compass,
  FolderLock,
  User,
  LogOut,
  LogIn,
  UserPlus,
  X,
  Loader2,
  AlertCircle,
  LayoutDashboard,
  Lock,
  Mail
} from 'lucide-react';
import { getMe, loginUser, registerUser, removeAuthToken } from '../../lib/api';

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    const local = email.split('@')[0];
    const parts = local.split(/[._-]/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return local.slice(0, 2).toUpperCase();
  }
  return 'U';
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ userId?: string; email?: string; name?: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncUser = React.useCallback(() => {
    getMe().then((user) => {
      if (user?.email) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    }).catch(() => {
      setCurrentUser(null);
    });
  }, []);

  useEffect(() => {
    syncUser();

    const handleAuthChange = () => {
      syncUser();
    };

    window.addEventListener('trao-auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('trao-auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [pathname, syncUser]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
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
        const res = await loginUser(email, password);
        setCurrentUser(res.user);
      } else {
        const res = await registerUser(email, password, name);
        setCurrentUser(res.user);
      }
      setShowAuthModal(false);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setCurrentUser(null);
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                Trao <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Prep Kit AI</span>
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium">
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${pathname === '/dashboard' || pathname === '/kits' ? 'bg-slate-800 text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
            >
              <LayoutDashboard className="h-4 w-4 text-emerald-400" />
              <span>Dashboard & My Kits</span>
            </Link>

            <Link
              href="/generate"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${pathname === '/generate' ? 'bg-slate-800 text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
            >
              <Compass className="h-4 w-4 text-cyan-400" />
              <span>New Kit</span>
            </Link>

            {/* Auth Circle Avatar with Hover Details or Login Button */}
            {currentUser?.email ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
                <div className="relative group/user">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 p-0.5 rounded-full bg-slate-900 border border-emerald-500/30 hover:border-emerald-500 transition-all shadow-sm hover:shadow-emerald-500/20 cursor-pointer"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center tracking-wider shadow-inner">
                      {getInitials(currentUser.name, currentUser.email)}
                    </div>
                  </Link>

                  {/* On hover show Name and Email card */}
                  <div className="absolute top-full right-0 mt-2 hidden group-hover/user:flex flex-col gap-1.5 p-3.5 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl shadow-slate-950/90 min-w-[220px] z-50 animate-fade-in backdrop-blur-xl pointer-events-none">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                        {getInitials(currentUser.name, currentUser.email)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate">
                          Hey, {currentUser.name || 'Candidate'}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate">
                          {currentUser.email}
                        </span>
                      </div>
                    </div>
                    <div className="pt-0.5 flex items-center justify-between text-[10px] text-emerald-400 font-semibold">
                      <span>Logged In</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">Candidate</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign Out of Account"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-red-950/80 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <LogOut className="h-3.5 w-3.5 text-red-400" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Log In / Register</span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 max-w-md w-full shadow-2xl space-y-5 animate-fade-in relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {authMode === 'login' ? <LogIn className="h-5 w-5 text-emerald-400" /> : <UserPlus className="h-5 w-5 text-emerald-400" />}
                {authMode === 'login' ? 'Log In to Trao' : 'Create Candidate Account'}
              </h3>
              <p className="text-xs text-slate-400">
                {authMode === 'login'
                  ? 'Access your saved prep kits and customized question banks.'
                  : 'Register to save private interview preparation workspaces.'}
              </p>
            </div>

            {/* Switch Tabs */}
            <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 flex">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setError(null); setConfirmPassword(''); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${authMode === 'login' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${authMode === 'register' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
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
                    className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                  className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                  className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

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
                    className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : authMode === 'login' ? 'Sign In & Open Dashboard' : 'Register & Open Dashboard'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
