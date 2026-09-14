'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchKit } from '../../../lib/api';
import { Kit, Requirement } from '../../../types/kit';
import { 
  Building2, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  ListOrdered, 
  ExternalLink, 
  Layers, 
  AlertCircle,
  Calendar,
  Flame,
  Bot,
  ArrowRight,
  Filter,
  Check,
  ChevronRight,
  Edit3,
  Globe,
  Clock,
  Zap,
  Target,
  FileText,
  BadgeCheck,
  FileCheck
} from 'lucide-react';
import { useKitContext } from './KitContext';
import { OverviewShimmerSkeleton } from '../../components/KitShimmerSkeleton';

export default function KitOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const kitId = params?.id as string;
  const { kit, loading } = useKitContext();
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);
  const [filterKind, setFilterKind] = useState<'all' | 'technical' | 'behavioural' | 'domain'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'must' | 'nice'>('all');

  if (loading || !kit) {
    return <OverviewShimmerSkeleton />;
  }


  const filteredRequirements = kit.role.requirements.filter((r) => {
    if (filterKind !== 'all' && r.kind !== filterKind) return false;
    if (filterPriority !== 'all' && r.priority !== filterPriority) return false;
    return true;
  });

  const linkedQuestions = selectedReq 
    ? kit.questions.filter((q) => q.requirement_ids.includes(selectedReq.id))
    : [];

  const techCount = kit.questions.filter((q) => q.category === 'technical').length;
  const sysCount = kit.questions.filter((q) => q.category === 'system-design').length;
  const behCount = kit.questions.filter((q) => q.category === 'behavioural').length;
  const compCount = kit.questions.filter((q) => q.category === 'company-fit').length;

  const totalStudyMinutes = kit.schedule.days.reduce(
    (acc, day) => acc + (day.minutes || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* 5 Interactive Feature Launchers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Resume Matcher Launcher */}
        <button
          onClick={() => router.push(`/kit/${kitId}/resume`)}
          className="group relative rounded-3xl p-5 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 hover:border-emerald-400/60 transition-all duration-300 text-left flex flex-col justify-between gap-4 shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform" />
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 group-hover:scale-110 transition-transform">
              <FileCheck className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {kit.resume_match ? `${kit.resume_match.match_score}% Match` : 'AI Match'}
            </span>
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-base text-white group-hover:text-emerald-200 transition-colors">
              Resume Gap Match
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              Skill Matrix & Vulnerabilities
            </p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400 pt-2 border-t border-emerald-500/20">
            <span>STAR Answers</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Schedule Launcher */}
        <button
          onClick={() => router.push(`/kit/${kitId}/schedule`)}
          className="group relative rounded-3xl p-5 border border-violet-500/30 bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-950 hover:border-violet-400/60 transition-all duration-300 text-left flex flex-col justify-between gap-4 shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1 cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-violet-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform" />
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-violet-500/20 text-violet-300 border border-violet-500/30 group-hover:scale-110 transition-transform">
              <Calendar className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              {kit.schedule.days_available} Days Plan
            </span>
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-base text-white group-hover:text-violet-200 transition-colors">
              Study Schedule
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              Day 1: {kit.schedule.days[0]?.focus || 'Core Architecture'}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-violet-400 pt-2 border-t border-violet-500/20">
            <span>{totalStudyMinutes} mins total</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Flashcards Launcher */}
        <button
          onClick={() => router.push(`/kit/${kitId}/practice`)}
          className="group relative rounded-3xl p-5 border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 hover:border-amber-400/60 transition-all duration-300 text-left flex flex-col justify-between gap-4 shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform" />
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 group-hover:scale-110 transition-transform">
              <Flame className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {kit.flashcards.length} Cards
            </span>
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-base text-white group-hover:text-amber-200 transition-colors">
              Flashcard Practice
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              Interactive 3D Cards & Sorter
            </p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-amber-400 pt-2 border-t border-amber-500/20">
            <span>Spaced Repetition</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* AI Mock Simulator Launcher */}
        <button
          onClick={() => router.push(`/kit/${kitId}/mock`)}
          className="group relative rounded-3xl p-5 border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 hover:border-cyan-400/60 transition-all duration-300 text-left flex flex-col justify-between gap-4 shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform" />
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 group-hover:scale-110 transition-transform">
              <Bot className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Voice AI
            </span>
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-base text-white group-hover:text-cyan-200 transition-colors">
              AI Mock Simulator
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              Live Evaluation & Scoring (1-10)
            </p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-cyan-400 pt-2 border-t border-cyan-500/20">
            <span>Interview Mode</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Question Bank Builder Launcher */}
        <button
          onClick={() => router.push(`/kit/${kitId}/builder`)}
          className="group relative rounded-3xl p-5 border border-teal-500/30 bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-950 hover:border-teal-400/60 transition-all duration-300 text-left flex flex-col justify-between gap-4 shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1 cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-teal-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform" />
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 group-hover:scale-110 transition-transform">
              <Edit3 className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              {kit.questions.length} Items
            </span>
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-base text-white group-hover:text-teal-200 transition-colors">
              Reshapeable Builder
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              Edit, Pin & Regenerate
            </p>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-teal-400 pt-2 border-t border-teal-500/20">
            <span>Question Bank</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>


      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Company Brief & Role Requirements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Brief Card */}
          <div className="rounded-3xl p-6 sm:p-7 border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <h2 className="text-lg font-heading font-extrabold text-white flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
                  <Building2 className="h-4 w-4" />
                </div>
                Company Discovery & Cultural Brief
              </h2>
              <span className="text-xs font-mono text-slate-400">
                Researched: {new Date(kit.source.researched_at).toLocaleDateString()}
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" /> Executive Summary
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {kit.company_brief.summary}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <Target className="h-3 w-3" /> Core Mission & What They Do
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {kit.company_brief.what_they_do}
                </p>
              </div>

              {kit.company_brief.sources.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-400">Verified Web Sources:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {kit.company_brief.sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700/80 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 flex items-center gap-1.5 transition-all truncate max-w-xs shadow-sm"
                      >
                        <ExternalLink className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{src}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Role Breakdown & Interactive Requirement Explorer */}
          <div className="rounded-3xl p-6 sm:p-7 border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div>
                <h2 className="text-lg font-heading font-extrabold text-white flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-teal-500/20 to-cyan-500/20 text-teal-400 border border-teal-500/30">
                    <Layers className="h-4 w-4" />
                  </div>
                  Extracted Competencies & Requirements
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Click any competency card to inspect its verified questions and coverage trace.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-xs font-bold w-fit">
                Seniority: {kit.role.seniority}
              </span>
            </div>

            {/* Filter Toolbars */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Category Filter */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                {(['all', 'technical', 'behavioural', 'domain'] as const).map((kind) => (
                  <button
                    key={kind}
                    onClick={() => setFilterKind(kind)}
                    className={`px-3 py-1 rounded-xl font-bold capitalize transition-all ${
                      filterKind === kind
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {kind}
                  </button>
                ))}
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                {(['all', 'must', 'nice'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilterPriority(p)}
                    className={`px-3 py-1 rounded-xl font-bold uppercase text-[11px] transition-all ${
                      filterPriority === p
                        ? 'bg-teal-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {p === 'all' ? 'All Priorities' : p}
                  </button>
                ))}
              </div>
            </div>

            {/* Responsibilities */}
            {kit.role.responsibilities.length > 0 && (
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80">
                <h3 className="text-[11px] font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-cyan-400" /> Core Responsibilities
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  {kit.role.responsibilities.map((resp, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0 shadow-sm shadow-emerald-400" />
                      <span className="leading-relaxed">{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Showing {filteredRequirements.length} of {kit.role.requirements.length} Competencies:
                </span>
                {selectedReq && (
                  <button
                    onClick={() => setSelectedReq(null)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline"
                  >
                    Clear Active Selection
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredRequirements.map((req) => {
                  const isMust = req.priority === 'must';
                  const isSelected = selectedReq?.id === req.id;
                  const reqLinkedCount = kit.questions.filter((q) => q.requirement_ids.includes(req.id)).length;

                  return (
                    <button
                      key={req.id}
                      type="button"
                      onClick={() => setSelectedReq(isSelected ? null : req)}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/70 border-emerald-400 ring-2 ring-emerald-500/40 shadow-xl shadow-emerald-500/10'
                          : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/80 shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs w-full">
                        <span className="font-mono font-black text-slate-400 text-xs">
                          [{req.id}]
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              isMust
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {req.priority}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800/80 text-slate-300 uppercase font-semibold border border-slate-700/60">
                            {req.kind}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-100 font-semibold leading-relaxed">
                        {req.text}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <CheckCircle2 className="h-3 w-3" /> {reqLinkedCount} Linked Qs
                        </span>
                        <span className="text-[10px] text-slate-500 group-hover:text-slate-300">Inspect ➔</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Linked Questions Explorer Panel */}
            {selectedReq && (
              <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/40 space-y-4 animate-fade-in shadow-2xl">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-heading font-extrabold text-white flex items-center gap-2">
                      <Filter className="h-4 w-4 text-emerald-400" />
                      Targeted Questions for [{selectedReq.id}]
                    </h4>
                    <p className="text-xs text-slate-400">{selectedReq.text}</p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {linkedQuestions.length} Found
                  </span>
                </div>

                <div className="space-y-3">
                  {linkedQuestions.map((q) => (
                    <div key={q.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-sm">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-emerald-400 font-mono font-bold">
                          [{q.id}] • <span className="capitalize">{q.category}</span>
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono font-bold">
                          Difficulty: {q.difficulty}/3
                        </span>
                      </div>
                      <p className="text-sm text-slate-100 font-semibold leading-relaxed">{q.prompt}</p>
                      {q.answer_outline && (
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                          <span className="text-[10px] font-mono font-bold text-teal-400 uppercase">Answer Outline:</span>
                          <p className="text-slate-300 leading-relaxed">{q.answer_outline}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Coverage Status & Question Bank Breakdown */}
        <div className="space-y-6">
          {/* Coverage Pass Status Card */}
          <div className="rounded-3xl p-6 sm:p-7 border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950 shadow-2xl space-y-5 relative overflow-hidden">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner">
                <ShieldCheck className="h-7 w-7 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-white text-lg">100% Validated Coverage</h3>
                <p className="text-xs text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {kit.coverage.passes} Pass(es) Deterministically Executed
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              The deterministic coverage engine compared all generated questions against every extracted must-have requirement to verify complete coverage before finalizing.
            </p>

            <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Total Questions Bank:</span>
                <span className="font-mono font-bold text-white text-sm">{kit.questions.length} Items</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Study Flashcards:</span>
                <span className="font-mono font-bold text-white text-sm">{kit.flashcards.length} Cards</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Uncovered Must-Haves:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {kit.coverage.uncovered_requirement_ids.length === 0 ? '0 (100% Covered)' : `${kit.coverage.uncovered_requirement_ids.length} Remaining`}
                </span>
              </div>
            </div>
          </div>

          {/* Question Bank Mix Distribution */}
          <div className="rounded-3xl p-6 sm:p-7 border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-cyan-400" /> Question Bank Mix
            </h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950 border border-emerald-500/20 shadow-sm">
                <span className="text-slate-200 font-bold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Technical Core
                </span>
                <span className="font-mono font-extrabold text-emerald-400">{techCount} Questions</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950 border border-cyan-500/20 shadow-sm">
                <span className="text-slate-200 font-bold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" /> System Design
                </span>
                <span className="font-mono font-extrabold text-cyan-400">{sysCount} Questions</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950 border border-purple-500/20 shadow-sm">
                <span className="text-slate-200 font-bold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-400" /> Behavioural & STAR
                </span>
                <span className="font-mono font-extrabold text-purple-400">{behCount} Questions</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950 border border-amber-500/20 shadow-sm">
                <span className="text-slate-200 font-bold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" /> Company Fit
                </span>
                <span className="font-mono font-extrabold text-amber-400">{compCount} Questions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
