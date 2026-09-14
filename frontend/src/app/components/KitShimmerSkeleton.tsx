'use client';

import React from 'react';

/**
 * Modern, high-density glassmorphic shimmer skeleton loaders
 */

export function ShimmerBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`shimmer-effect rounded-2xl ${className}`} />
  );
}

export function OverviewShimmerSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* 5 Launcher Skeleton Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={`launcher-${i}`}
            className="rounded-3xl p-5 border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between gap-4 h-44 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <ShimmerBlock className="h-10 w-10 rounded-2xl" />
              <ShimmerBlock className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <ShimmerBlock className="h-5 w-28" />
              <ShimmerBlock className="h-3.5 w-full" />
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <ShimmerBlock className="h-3 w-16" />
              <ShimmerBlock className="h-3 w-3 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Brief Card */}
          <div className="rounded-3xl p-6 sm:p-7 border border-slate-800 bg-slate-900/60 backdrop-blur-xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <ShimmerBlock className="h-8 w-8 rounded-xl" />
                <ShimmerBlock className="h-5 w-48" />
              </div>
              <ShimmerBlock className="h-4 w-24 rounded-full" />
            </div>
            <div className="space-y-2.5">
              <ShimmerBlock className="h-4 w-full" />
              <ShimmerBlock className="h-4 w-5/6" />
              <ShimmerBlock className="h-4 w-4/6" />
            </div>
          </div>

          {/* Requirements Card */}
          <div className="rounded-3xl p-6 sm:p-7 border border-slate-800 bg-slate-900/60 backdrop-blur-xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <ShimmerBlock className="h-8 w-8 rounded-xl" />
                <ShimmerBlock className="h-5 w-52" />
              </div>
              <ShimmerBlock className="h-5 w-20 rounded-full" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={`req-${j}`} className="p-4 rounded-2xl border border-slate-800/80 bg-slate-950/40 flex items-start gap-3">
                  <ShimmerBlock className="h-5 w-5 rounded-full shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <ShimmerBlock className="h-4 w-full" />
                    <ShimmerBlock className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col */}
        <div className="space-y-6">
          <div className="rounded-3xl p-6 border border-slate-800 bg-slate-900/60 backdrop-blur-xl space-y-4">
            <ShimmerBlock className="h-5 w-36" />
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((k) => (
                <div key={`stat-${k}`} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex justify-between items-center">
                  <ShimmerBlock className="h-4 w-24" />
                  <ShimmerBlock className="h-4 w-8 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResumeMatchShimmerSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner Skeleton */}
      <div className="rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-3 flex-1">
          <ShimmerBlock className="h-5 w-32 rounded-full" />
          <ShimmerBlock className="h-8 w-3/4 max-w-md" />
          <ShimmerBlock className="h-4 w-full max-w-xl" />
        </div>
        <ShimmerBlock className="h-10 w-44 rounded-2xl shrink-0" />
      </div>

      {/* Input Box Skeleton */}
      <div className="rounded-3xl p-6 border border-slate-800 bg-slate-900/60 backdrop-blur-xl space-y-4">
        <div className="flex justify-between items-center">
          <ShimmerBlock className="h-5 w-44" />
          <ShimmerBlock className="h-4 w-20" />
        </div>
        <ShimmerBlock className="h-36 w-full rounded-2xl" />
        <div className="flex justify-between items-center pt-2">
          <ShimmerBlock className="h-4 w-48" />
          <ShimmerBlock className="h-11 w-56 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function GenericTabShimmerSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-3xl p-6 border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex justify-between items-center">
        <div className="space-y-2">
          <ShimmerBlock className="h-6 w-52" />
          <ShimmerBlock className="h-4 w-72" />
        </div>
        <ShimmerBlock className="h-10 w-36 rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={`tab-card-${i}`} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3">
            <div className="flex justify-between items-center">
              <ShimmerBlock className="h-4 w-28" />
              <ShimmerBlock className="h-4 w-12 rounded-full" />
            </div>
            <ShimmerBlock className="h-5 w-full" />
            <ShimmerBlock className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}
