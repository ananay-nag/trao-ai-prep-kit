'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, 
  Globe, 
  Calendar, 
  FileText, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  Compass, 
  Flame,
  FileCode2,
  HelpCircle,
  FolderLock
} from 'lucide-react';
import { generateKit } from '../../lib/api';

const SAMPLE_PRESETS = [
  {
    label: 'Senior Full-Stack Engineer',
    company: 'https://github.com',
    days: 5,
    jd: `Senior Full-Stack Engineer

About the role:
We are looking for a Senior Full-Stack Engineer with 5+ years of experience in React, TypeScript, and Node.js. You will lead the architecture of our real-time collaboration tools, build scalable microservices, and mentor junior developers. 

Requirements:
• 5+ years of experience with React, TypeScript, and modern state management.
• Strong backend experience with Node.js and distributed microservices.
• Deep understanding of database design, indexing, and PostgreSQL/Redis.
• Proven track record of mentoring junior engineers and leading architectural discussions.
• Bonus points for AWS/Kubernetes experience and WebSocket protocol knowledge.`
  },
  {
    label: 'Backend Python Engineer',
    company: 'https://stripe.com',
    days: 3,
    jd: `Backend Systems Engineer

We are seeking a Backend Developer to join our core payments infrastructure team.
Must have:
• 3+ years experience with Python and FastAPI or Django.
• Solid understanding of database indexing, ACID transactions, and SQL optimization.
• Familiarity with Docker and CI/CD pipelines.

Nice to have:
• GraphQL API development experience.
• High-throughput payment processing background.`
  },
  {
    label: '2-Line Stub (Edge Case)',
    company: 'https://nonexistent-company-404-domain-xyz.com',
    days: 1,
    jd: `Junior Frontend Engineer.
React and CSS basics required.`
  }
];

export default function GenerateKitPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [jd, setJd] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [days, setDays] = useState(5);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ step: string; percent: number; details?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchCases, setBatchCases] = useState<any[]>([]);

  // Word & Character count calculation
  const wordCount = jd.trim() ? jd.trim().split(/\s+/).length : 0;
  const charCount = jd.length;

  // Pace mode based on days
  const getPaceBadge = (d: number) => {
    if (d === 1) return { label: '⚡ High-Intensity Cram (1 Day)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    if (d <= 4) return { label: '🔥 Accelerated Sprint', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
    if (d <= 10) return { label: '🎯 Balanced Pace (Recommended)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    return { label: '📘 Deep Mastery Track', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
  };

  const paceInfo = getPaceBadge(days);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jd.trim() || !companyUrl.trim()) {
      setError('Please provide both the Job Description and the Company Website URL.');
      return;
    }

    setError(null);
    setLoading(true);
    setProgress({ step: 'INITIALIZING', percent: 5, details: 'Connecting to generation pipeline...' });

    try {
      const result = await generateKit(jd, companyUrl, days, (p) => {
        setProgress(p);
      });

      router.push(`/kit/${result.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating the prep kit.');
      setLoading(false);
      setProgress(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBatchFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setBatchCases(parsed);
          setError(null);
        } else {
          setError('Uploaded JSON file must contain an array of cases matching Appendix B.');
        }
      } catch (err: any) {
        setError(`Invalid JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const loadPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setJd(preset.jd);
    setCompanyUrl(preset.company);
    setDays(preset.days);
    setError(null);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider shadow-inner">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> Kit Generation Studio
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Generate Precision Interview Kit
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Paste your target Job Description and company website. Our multi-stage crawler and deterministic engine will synthesize your custom prep kit.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex justify-center">
        <div className="p-1 rounded-2xl bg-slate-900/90 border border-slate-800 inline-flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'single'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="h-4 w-4" /> Single Role Generator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'batch'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="h-4 w-4" /> Batch JSON Upload Mode
          </button>
        </div>
      </div>

      {/* Main Single Role Generator Form */}
      {activeTab === 'single' ? (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pb-2">
              <span className="text-xs font-semibold text-slate-400">Quick Test Presets:</span>
              {SAMPLE_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => loadPreset(p)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:border-emerald-500/40 transition-all font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  {p.label}
                </button>
              ))}
            </div>

            {/* Job Description Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-200">
                <label className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-400" />
                  Job Description
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                    {wordCount} words
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                    {charCount} chars
                  </span>
                </div>
              </div>
              <textarea
                required
                rows={8}
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the full job description text here (responsibilities, required qualifications, tech stack)..."
                className="w-full rounded-2xl bg-slate-950/80 border border-slate-700/80 p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-mono transition-all leading-relaxed"
              />
            </div>

            {/* Company URL & Days Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <Globe className="h-4 w-4 text-teal-400" />
                  Company Website Address
                </label>
                <input
                  required
                  type="text"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  placeholder="https://company.com"
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center justify-between text-sm font-semibold text-slate-200">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-cyan-400" />
                    Days to Interview
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={days}
                    onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-bold"
                  />
                  <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Days</span>
                </div>
              </div>
            </div>

            {/* Schedule Pace Indicator */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="text-slate-400">Planned Schedule Intensity:</span>
              <span className={`px-2.5 py-1 rounded-lg border font-semibold text-xs ${paceInfo.color}`}>
                {paceInfo.label}
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Generation Failed</p>
                  <p className="text-xs text-red-400/90 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-slate-950" />
                  Synthesizing Precision Prep Kit...
                </>
              ) : (
                <>
                  Generate Prep Kit
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* Batch Upload Mode Card */
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-400" />
              Prepare Multiple Roles at Once (Batch Mode)
            </h2>
            <p className="text-xs text-slate-400">
              Upload a JSON file containing description-and-company pairs matching Appendix B schema.
            </p>
          </div>

          <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center space-y-4 hover:border-emerald-500/50 transition-colors">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 inline-block">
              <FileCode2 className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                {batchFile ? batchFile.name : 'Drag & Drop your cases.json file here'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Supports JSON files with an array of cases</p>
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700 transition-colors">
              <Upload className="h-3.5 w-3.5 text-emerald-400" />
              Browse File
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {batchCases.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Discovered Cases ({batchCases.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {batchCases.map((c, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-300">
                      <span>[{c.id}]</span>
                      <span className="text-cyan-400">{c.days} Days</span>
                    </div>
                    <p className="text-slate-400 truncate">{c.company_url}</p>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>
                  Tip: You can also run batch evaluations headlessly via CLI: <code className="text-emerald-400 font-mono">npm run evaluate -- --input cases.json --output kits.json</code>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Generation Progress Modal */}
      {loading && progress && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/30 max-w-md w-full shadow-2xl space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Synthesizing Precision Kit</h3>
                <p className="text-xs text-slate-400">{progress.step}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-400">{progress.details || 'Processing pipeline step...'}</span>
                <span className="text-slate-400">{progress.percent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-3 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Checking 100% must-have requirement coverage & arithmetic day balance</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
