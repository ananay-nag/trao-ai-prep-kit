'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Globe,
  Calendar,
  FileText,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Compass,
  Flame,
  FolderLock,
  User,
  LogIn,
  Bot,
  Layers,
  Award
} from 'lucide-react';
import { getMe } from '../lib/api';

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ userId?: string; email?: string } | null>(null);

  useEffect(() => {
    getMe()
      .then((user) => {
        if (user?.email) setCurrentUser(user);
      })
      .catch(() => { });
  }, []);

  return (
    <div className="space-y-12 pb-12 max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-6 pt-6 sm:pt-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider shadow-inner">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> Multi-Stage Deterministic + LLM Pipeline
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl mx-auto space-y-1">
          <span className="block">Turn Any Job Description Into</span>
          <span className="block bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            a Precision Interview Kit
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Intelligently crawls company culture, extracts must-have requirements, validates complete question coverage via deterministic feedback loops, and allocates a tailored day-by-day study roadmap.
        </p>

        {/* Primary Action Buttons */}
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4">
        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-3 hover:border-emerald-500/30 transition-all">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">100% Must-Have Coverage</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Deterministic code loop validates that every extracted must-have qualification has corresponding interview questions and flashcards.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-3 hover:border-teal-500/30 transition-all">
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 w-fit">
            <Globe className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">Smart Link Discovery</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Heuristic crawler discovers careers, engineering blogs, and company values without hardcoding paths, with SSRF protection.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-3 hover:border-cyan-500/30 transition-all">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 w-fit">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">Reshapeable Builder</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            State preservation engine preserves all pinned and user-edited questions when triggering category regenerations.
          </p>
        </div>
      </div>

      {/* Interactive Suite Showcase */}
      <div className="glass-card rounded-3xl p-8 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              Complete Preparation Suite Included with Every Kit
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Everything generated adheres to strict Appendix A schemas and deterministic arithmetic timelines.
            </p>
          </div>

          <Link
            href="/generate"
            className="text-xs px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 w-fit"
          >
            <span>Try Guest Kit</span> <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <Layers className="h-4 w-4" /> Categorized Question Bank
            </div>
            <p className="text-[11px] text-slate-400">
              Technical, System Design, Behavioural (STAR), and Company Fit with answer blueprints.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-orange-400 text-xs font-bold">
              <Flame className="h-4 w-4" /> Practice Mode Flashcards
            </div>
            <p className="text-[11px] text-slate-400">
              3D flip cards, Web Speech TTS audio playback, and spaced review confidence sorting.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
              <Calendar className="h-4 w-4" /> Arithmetic Schedule
            </div>
            <p className="text-[11px] text-slate-400">
              Day-by-day integer minute breakdown with persistent checkbox tracking.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-teal-400 text-xs font-bold">
              <Bot className="h-4 w-4" /> AI Mock Simulator
            </div>
            <p className="text-[11px] text-slate-400">
              Voice speech recognition dictation, countdown timer, and scoring feedback radar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
