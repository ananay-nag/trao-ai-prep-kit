'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchUserKits, getMe, getAuthToken } from '../../lib/api';
import { Kit } from '../../types/kit';
import {
  FolderLock,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  Compass,
  User,
  Plus,
  Flame,
  Bot,
  Edit3,
  BookOpen,
  LogOut,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface KitRecord {
  id: string;
  title: string;
  company: string;
  createdAt: string;
  data: Kit;
}

export default function DashboardPage() {
  const router = useRouter();
  const [kits, setKits] = useState<KitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const loadDashboardData = React.useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const userRes = await getMe();
      if (userRes?.email) {
        setUserEmail(userRes.email);
        setUserName(userRes.name || null);
      } else {
        router.push('/login');
        return;
      }

      const kitsData = await fetchUserKits();
      setKits(kitsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadDashboardData();

    const handleAuthChange = () => {
      loadDashboardData();
    };

    window.addEventListener('trao-auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('trao-auth-change', handleAuthChange);
    };
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  // Calculate high-level stats across user kits
  const totalKits = kits.length;
  const totalQuestions = kits.reduce((sum, k) => sum + (k.data?.questions?.length || 0), 0);
  const totalFlashcards = kits.reduce((sum, k) => sum + (k.data?.flashcards?.length || 0), 0);
  const totalMustHaves = kits.reduce((sum, k) => sum + (k.data?.role?.requirements?.filter(r => r.priority === 'must').length || 0), 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
            <User className="h-3.5 w-3.5" /> Candidate Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {userName ? `Welcome back, ${userName}` : 'Welcome to Your Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {userEmail ? `Logged in as ${userEmail} • All your private kits are saved below` : 'Logged in'}
          </p>
        </div>

        <Link
          href="/generate"
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition-all shrink-0 hover:scale-105"
        >
          <Plus className="h-4 w-4 stroke-[3]" /> Create New Interview Kit
        </Link>
      </div>

      {/* Metrics Highlights Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400">Saved Kits</span>
          <p className="text-2xl font-mono font-bold text-white">{totalKits}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400">Must-Have Competencies</span>
          <p className="text-2xl font-mono font-bold text-emerald-400">{totalMustHaves}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400">Targeted Questions</span>
          <p className="text-2xl font-mono font-bold text-cyan-400">{totalQuestions}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400">Study Flashcards</span>
          <p className="text-2xl font-mono font-bold text-teal-400">{totalFlashcards}</p>
        </div>
      </div>

      {/* My Kits Section Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderLock className="h-5 w-5 text-emerald-400" />
            My Kits ({kits.length})
          </h2>
          <span className="text-xs text-slate-400">Only visible to your account</span>
        </div>

        {kits.length === 0 ? (
          <div className="glass-card rounded-3xl p-16 text-center space-y-4 border border-slate-800">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 inline-block">
              <Compass className="h-10 w-10 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white">No Interview Kits Generated Yet</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              Paste in a job description and company website URL to generate your first custom interview kit.
            </p>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
            >
              Generate First Kit <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {kits.map((k) => {
              const mustCount = k.data?.role?.requirements?.filter((r) => r.priority === 'must').length || 0;
              const qCount = k.data?.questions?.length || 0;
              const cardsCount = k.data?.flashcards?.length || 0;
              const daysCount = k.data?.schedule?.days_available || 3;

              return (
                <div
                  key={k.id}
                  className="glass-card rounded-2xl p-6 border border-slate-800/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-5 group shadow-xl"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {k.company || k.data?.source?.company || 'Target Company'}
                      </span>
                      <span className="text-slate-500 text-[11px] font-mono">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                      {k.title || k.data?.role?.title || 'Engineering Role'}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {k.data?.company_brief?.summary || 'Tailored interview preparation material.'}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-800/80">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" /> {mustCount} Must-Haves
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800 text-[10px]">
                        {qCount} Questions
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 text-cyan-400 border border-slate-800 text-[10px] font-mono font-bold">
                        {daysCount} Days
                      </span>
                    </div>

                    {/* Action Bar */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link
                        href={`/kit/${k.id}`}
                        className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-md"
                      >
                        <span>Workspace</span> <ArrowRight className="h-3 w-3" />
                      </Link>

                      <Link
                        href={`/kit/${k.id}/mock`}
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1 border border-slate-700 transition-colors"
                      >
                        <Bot className="h-3 w-3 text-cyan-400" /> Mock
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
