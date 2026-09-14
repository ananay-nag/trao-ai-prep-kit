'use client';

import React, { useState } from 'react';
import { Kit } from '../../types/kit';
import { downloadFile, generateAnkiCsv, generateIcsCalendar, triggerPrintPdf } from '../../lib/exportUtils';
import { 
  Download, 
  Calendar, 
  FileText, 
  Layers, 
  Code2, 
  Check, 
  X, 
  Printer, 
  ExternalLink,
  Sparkles,
  Zap
} from 'lucide-react';

interface ExportModalProps {
  kit: Kit;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({ kit, isOpen, onClose }: ExportModalProps) {
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const safeTitle = (kit.role.title || 'interview-kit')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  const companyTitle = (kit.source.company || 'company')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');

  const handleDownloadCalendar = () => {
    const icsContent = generateIcsCalendar(kit);
    downloadFile(`${companyTitle}_${safeTitle}_study_schedule.ics`, icsContent, 'text/calendar;charset=utf-8');
    notifySuccess('calendar');
  };

  const handleDownloadAnki = () => {
    const csvContent = generateAnkiCsv(kit);
    downloadFile(`${companyTitle}_${safeTitle}_anki_deck.csv`, csvContent, 'text/tab-separated-values;charset=utf-8');
    notifySuccess('anki');
  };

  const handleDownloadJson = () => {
    const jsonContent = JSON.stringify(kit, null, 2);
    downloadFile(`${companyTitle}_${safeTitle}_kit.json`, jsonContent, 'application/json;charset=utf-8');
    notifySuccess('json');
  };

  const handlePrintPdf = () => {
    onClose();
    setTimeout(() => {
      triggerPrintPdf(kit);
    }, 200);
  };

  const notifySuccess = (format: string) => {
    setDownloadedFormat(format);
    setTimeout(() => setDownloadedFormat(null), 3000);
  };

  const totalCards = (kit.flashcards?.length || 0) + (kit.questions?.length || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-xl rounded-3xl border border-slate-700/80 bg-slate-900/95 p-6 sm:p-8 shadow-2xl shadow-emerald-950/40 text-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 shadow-md">
              <Download className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
                1-Click Export Suite
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Take your {kit.source.company} prep kit offline into your favorite tools
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Export Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-6">
          {/* 1. Calendar (.ics) */}
          <button
            onClick={handleDownloadCalendar}
            className="group relative rounded-2xl p-4 border border-violet-500/30 bg-slate-950/60 hover:border-violet-400/60 hover:bg-violet-950/20 transition-all text-left flex flex-col justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30 group-hover:scale-110 transition-transform">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
                .ICS CALENDAR
              </span>
            </div>
            <div>
              <div className="font-bold text-sm text-white group-hover:text-violet-200">
                Calendar Study Sync
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {kit.schedule.days_available} days of calendar events for Google, Apple & Outlook
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-400">
              {downloadedFormat === 'calendar' ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Check className="h-3.5 w-3.5" /> Downloaded!
                </span>
              ) : (
                <>
                  <span>Download .ics</span>
                  <Download className="h-3.5 w-3.5 group-hover:translate-y-0.5 transition-transform" />
                </>
              )}
            </div>
          </button>

          {/* 2. Anki / CSV */}
          <button
            onClick={handleDownloadAnki}
            className="group relative rounded-2xl p-4 border border-amber-500/30 bg-slate-950/60 hover:border-amber-400/60 hover:bg-amber-950/20 transition-all text-left flex flex-col justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 group-hover:scale-110 transition-transform">
                <Layers className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                ANKI / QUIZLET
              </span>
            </div>
            <div>
              <div className="font-bold text-sm text-white group-hover:text-amber-200">
                Flashcard Deck (.csv)
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {totalCards} cards formatted with tags & spaced repetition
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              {downloadedFormat === 'anki' ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Check className="h-3.5 w-3.5" /> Downloaded!
                </span>
              ) : (
                <>
                  <span>Download Anki Deck</span>
                  <Download className="h-3.5 w-3.5 group-hover:translate-y-0.5 transition-transform" />
                </>
              )}
            </div>
          </button>

          {/* 3. Printable PDF / Cheat Sheet */}
          <button
            onClick={handlePrintPdf}
            className="group relative rounded-2xl p-4 border border-emerald-500/30 bg-slate-950/60 hover:border-emerald-400/60 hover:bg-emerald-950/20 transition-all text-left flex flex-col justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                <Printer className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                PRINT / PDF
              </span>
            </div>
            <div>
              <div className="font-bold text-sm text-white group-hover:text-emerald-200">
                Printable PDF Cheat Sheet
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Complete formatted study guide optimized for print & offline reading
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <span>Print / Save as PDF</span>
              <Printer className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
            </div>
          </button>

          {/* 4. Raw JSON Export */}
          <button
            onClick={handleDownloadJson}
            className="group relative rounded-2xl p-4 border border-cyan-500/30 bg-slate-950/60 hover:border-cyan-400/60 hover:bg-cyan-950/20 transition-all text-left flex flex-col justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 group-hover:scale-110 transition-transform">
                <Code2 className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                JSON DATA
              </span>
            </div>
            <div>
              <div className="font-bold text-sm text-white group-hover:text-cyan-200">
                Raw Kit Schema (.json)
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Standard JSON matching Appendix A & B schema format
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              {downloadedFormat === 'json' ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Check className="h-3.5 w-3.5" /> Downloaded!
                </span>
              ) : (
                <>
                  <span>Download .json</span>
                  <Download className="h-3.5 w-3.5 group-hover:translate-y-0.5 transition-transform" />
                </>
              )}
            </div>
          </button>
        </div>

        {/* Footer info note */}
        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>All exports are generated locally and client-side instantly.</span>
        </div>
      </div>
    </div>
  );
}
