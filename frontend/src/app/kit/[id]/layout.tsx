'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { fetchKit } from '../../../lib/api';
import { Kit } from '../../../types/kit';
import { 
  Building2, 
  Briefcase, 
  Calendar, 
  Layers, 
  Edit3, 
  Flame, 
  Clock, 
  Bot, 
  CheckCircle2, 
  ExternalLink,
  ChevronLeft,
  Download,
  FileCheck,
  FolderLock
} from 'lucide-react';
import ExportModal from '../../components/ExportModal';

import { KitContext } from './KitContext';
import { ShimmerBlock } from '../../components/KitShimmerSkeleton';

function getSafeHostname(urlStr?: string): string {
  if (!urlStr) return 'website';
  try {
    const formatted = urlStr.startsWith('http://') || urlStr.startsWith('https://') ? urlStr : `https://${urlStr}`;
    return new URL(formatted).hostname || urlStr;
  } catch {
    return urlStr;
  }
}

function getSafeHref(urlStr?: string): string {
  if (!urlStr) return '#';
  if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) return urlStr;
  return `https://${urlStr}`;
}

export default function KitLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const kitId = params?.id as string;

  const [kit, setKit] = useState<Kit | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const refreshKit = React.useCallback(async () => {
    if (!kitId) return;
    try {
      setErrorMsg(null);
      const res = await fetchKit(kitId);
      setKit(res.kit);
    } catch (err: any) {
      console.error('Failed to refresh kit:', err);
      setErrorMsg(err.message || 'Access denied or kit not found');
      setKit(null);
    } finally {
      setLoading(false);
    }
  }, [kitId]);

  useEffect(() => {
    setLoading(true);
    refreshKit();

    const handleAuthChange = () => {
      refreshKit();
    };

    window.addEventListener('trao-auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('trao-auth-change', handleAuthChange);
    };
  }, [refreshKit]);

  const navTabs = [
    { name: 'Overview & Brief', href: `/kit/${kitId}`, icon: Building2 },
    { name: 'Resume Match', href: `/kit/${kitId}/resume`, icon: FileCheck },
    { name: 'Reshapeable Builder', href: `/kit/${kitId}/builder`, icon: Edit3 },
    { name: 'Study Schedule', href: `/kit/${kitId}/schedule`, icon: Calendar },
    { name: 'Practice Mode', href: `/kit/${kitId}/practice`, icon: Flame },
    { name: 'AI Mock Interview', href: `/kit/${kitId}/mock`, icon: Bot }
  ];

  if (loading) {
    return (
      <KitContext.Provider value={{ kit: null, setKit, loading: true, refreshKit }}>
        <div className="space-y-6 animate-fade-in">
          {/* Header Banner Shimmer Skeleton */}
          <div className="relative rounded-3xl p-6 sm:p-8 border border-slate-800/80 bg-slate-900/60 backdrop-blur-2xl shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <ShimmerBlock className="h-14 w-14 rounded-2xl shrink-0" />
                <div className="space-y-2.5 flex-1">
                  <div className="flex gap-2">
                    <ShimmerBlock className="h-5 w-28 rounded-full" />
                    <ShimmerBlock className="h-5 w-20 rounded-full" />
                  </div>
                  <ShimmerBlock className="h-8 w-64 max-w-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                <ShimmerBlock className="h-9 w-40 rounded-xl" />
                <ShimmerBlock className="h-9 w-28 rounded-xl" />
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-800 pt-5">
              {[1, 2, 3, 4, 5, 6].map((tabIdx) => (
                <ShimmerBlock key={`tab-shimmer-${tabIdx}`} className="h-10 w-28 rounded-2xl" />
              ))}
            </div>
          </div>

          <div>{children}</div>
        </div>
      </KitContext.Provider>
    );
  }

  if (!kit) {
    const isAccessDenied = errorMsg?.toLowerCase().includes('access denied') || errorMsg?.toLowerCase().includes('private') || errorMsg?.toLowerCase().includes('log in');
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6 animate-fade-in">
        <div className="glass-card rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-5">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <FolderLock className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">
              {isAccessDenied ? 'Private Interview Kit' : 'Kit Not Found'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAccessDenied
                ? 'This interview prep kit is private. Please log in with the account that created it to access this workspace.'
                : 'The requested interview prep kit could not be loaded.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {isAccessDenied && (
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all"
              >
                Log In / Sign In
              </Link>
            )}
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-all"
            >
              <ChevronLeft className="h-4 w-4" /> Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const mustCount = kit.role.requirements.filter((r) => r.priority === 'must').length;
  const niceCount = kit.role.requirements.filter((r) => r.priority === 'nice').length;
  const companyInitials = (kit.source.company || 'Co').slice(0, 2).toUpperCase();

  return (
    <KitContext.Provider value={{ kit, setKit, loading: false, refreshKit }}>
      <div className="space-y-6">

      {/* Kit Top Banner with Radiant Aura */}
      <div className="relative rounded-3xl p-6 sm:p-8 border border-slate-800/80 bg-slate-900/80 backdrop-blur-2xl shadow-2xl overflow-hidden">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Company Monogram Avatar */}
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-[1.5px] shadow-lg shadow-emerald-500/20 shrink-0">
              <div className="h-full w-full rounded-2xl bg-slate-950/90 backdrop-blur-md flex items-center justify-center">
                <span className="font-heading font-black text-lg text-transparent bg-gradient-to-br from-emerald-400 to-cyan-300 bg-clip-text">
                  {companyInitials}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <Building2 className="h-3 w-3" />
                  {kit.source.company}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300 font-medium">{kit.source.location || 'Remote'}</span>
                <span className="text-slate-500">•</span>
                <a
                  href={getSafeHref(kit.source.company_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] flex items-center gap-1 transition-colors underline-offset-2 hover:underline"
                >
                  {getSafeHostname(kit.source.company_url)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight leading-tight">
                {kit.role.title}
              </h1>
            </div>
          </div>

          {/* Quick Metrics Chips & Export Action */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              {mustCount} Must-Haves (100% Covered)
            </span>
            {niceCount > 0 && (
              <span className="px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 font-semibold">
                {niceCount} Nice-to-Have
              </span>
            )}
            <span className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-slate-200 font-semibold flex items-center gap-1.5 shadow-sm">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              {kit.schedule.days_available} Days Prep
            </span>

            {/* 1-Click Export Suite Trigger */}
            <button
              onClick={() => setIsExportOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/20 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export Kit</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="relative z-10 flex overflow-x-auto gap-2 border-t border-slate-800/80 pt-5 mt-6 -mb-2 scrollbar-none">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/25 scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`} />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Child Tab Page Content */}
      <div className="animate-fade-in">{children}</div>

      {/* 1-Click Export Modal */}
      {kit && (
        <ExportModal
          kit={kit}
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
        />
      )}
      </div>
    </KitContext.Provider>
  );
}


