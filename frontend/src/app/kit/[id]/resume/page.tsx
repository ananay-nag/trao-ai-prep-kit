'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchKit, analyzeResume } from '../../../../lib/api';
import { Kit, ResumeMatchResult } from '../../../../types/kit';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  HelpCircle, 
  ArrowRight, 
  Copy, 
  Check, 
  Zap, 
  Flame, 
  ChevronDown, 
  ChevronUp, 
  Target,
  RefreshCw,
  Award,
  Layers,
  Search
} from 'lucide-react';
import { useKitContext } from '../KitContext';
import { ResumeMatchShimmerSkeleton } from '../../../components/KitShimmerSkeleton';

export default function ResumeMatchPage() {
  const params = useParams();
  const kitId = params?.id as string;
  const { kit, loading: loadingKit, setKit } = useKitContext();

  const [resumeText, setResumeText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [matchResult, setMatchResult] = useState<ResumeMatchResult | null>(kit?.resume_match || null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'matches' | 'gaps'>('all');
  const [expandedStar, setExpandedStar] = useState<number | null>(0);

  useEffect(() => {
    if (kit?.resume_match) {
      setMatchResult(kit.resume_match);
    }
  }, [kit?.resume_match]);


  const handleLoadSampleResume = () => {
    if (!kit) return;
    const sample = `Jane Doe
Senior Software Engineer | Distributed Systems & Backend
Email: jane.doe@example.com | GitHub: github.com/janedoe | LinkedIn: linkedin.com/in/janedoe

PROFESSIONAL SUMMARY:
Results-driven backend software engineer with 6+ years of experience designing high-throughput distributed microservices, cloud architectures, and database optimizations. Passionate about system reliability, concurrency, and clean API design.

WORK EXPERIENCE:
Senior Backend Engineer — Nexus Cloud Systems (2022 – Present)
- Engineered scalable microservices in TypeScript, Node.js, and Go serving 45,000+ requests/second with p99 latency < 25ms.
- Designed distributed caching layer with Redis Cluster and asynchronous job queues via RabbitMQ, cutting database load by 60%.
- Led database sharding and migration for PostgreSQL instances storing 10TB+ relational records.
- Spearheaded team-wide migration to automated CI/CD pipelines with GitHub Actions and Docker.
- Mentored 5 mid-level and junior engineers on distributed debugging and concurrency best practices.

Software Engineer — Apex Fintech (2019 – 2022)
- Built real-time payment webhook consumers processing $2M+ in daily transaction volume.
- Implemented idempotent payment APIs, distributed locking mechanisms, and automated reconciliation workflows.
- Collaborated with product managers to deliver SOC2 compliant audit logging and role-based access control (RBAC).

SKILLS & TECHNOLOGIES:
- Languages: TypeScript, JavaScript, Go, Python, SQL
- Architecture & Infrastructure: Microservices, REST, gRPC, Docker, AWS (ECS, RDS, S3, SQS), CI/CD
- Databases: PostgreSQL, Redis, MongoDB
- Methodologies: Agile/Scrum, System Design, Unit/Integration Testing (Jest, Playwright)`;

    setResumeText(sample);
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim() || analyzing) return;
    setAnalyzing(true);
    try {
      const res = await analyzeResume(kitId, resumeText);
      if (res.resume_match) {
        setMatchResult(res.resume_match);
        setKit((prev) => (prev ? { ...prev, resume_match: res.resume_match } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to analyze resume');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyStar = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  if (loadingKit || !kit) {
    return <ResumeMatchShimmerSkeleton />;
  }


  const score = matchResult?.match_score ?? 0;
  const scoreColor = 
    score >= 80 ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' :
    score >= 60 ? 'text-amber-400 border-amber-500/40 bg-amber-500/10' :
    'text-rose-400 border-rose-500/40 bg-rose-500/10';

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Resume-to-JD Matcher</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
              Skill Gap & Vulnerability Analysis
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Compare your resume directly against {kit.source.company}’s requirements for {kit.role.title}. 
              Identify hidden blind spots, predicted grilling questions, and generated STAR answers.
            </p>
          </div>

          <button
            onClick={handleLoadSampleResume}
            className="self-start md:self-auto px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all flex items-center gap-2 shadow-sm"
          >
            <FileText className="h-4 w-4 text-cyan-400" />
            <span>Load Sample Resume</span>
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="rounded-3xl p-6 border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <label className="font-heading font-bold text-sm text-slate-200 flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-400" />
            <span>Paste Candidate Resume / CV Text</span>
          </label>
          <span className="text-xs text-slate-500 font-mono">
            {resumeText.length} characters
          </span>
        </div>

        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your plain text resume or LinkedIn summary here to evaluate your match and discover interview blind spots..."
          rows={6}
          className="w-full rounded-2xl bg-slate-950/80 border border-slate-800 p-4 text-xs sm:text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono resize-y transition-colors"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Analyzed securely against all {kit.role.requirements.length} JD requirements.</span>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!resumeText.trim() || analyzing}
            className={`px-6 py-3 rounded-2xl font-heading font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
              !resumeText.trim() || analyzing
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 hover:opacity-95 shadow-emerald-500/20 scale-[1.01]'
            }`}
          >
            {analyzing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Scanning Resume & JD Matrix...</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 stroke-[2.5]" />
                <span>Run Gap & Vulnerability Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {matchResult && (
        <div className="space-y-8 animate-fade-in">
          {/* Top Scorecard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Match Score Card */}
            <div className={`rounded-3xl p-6 border ${scoreColor} flex flex-col justify-between gap-4 shadow-xl backdrop-blur-xl`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider uppercase">Match Score</span>
                <Award className="h-5 w-5 opacity-80" />
              </div>
              <div>
                <div className="text-5xl sm:text-6xl font-heading font-black tracking-tight">
                  {matchResult.match_score}%
                </div>
                <div className="text-xs font-semibold mt-1 opacity-90">
                  {matchResult.seniority_alignment}
                </div>
              </div>
              <div className="w-full bg-slate-950/60 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-current h-full transition-all duration-1000"
                  style={{ width: `${matchResult.match_score}%` }}
                />
              </div>
            </div>

            {/* Executive Summary */}
            <div className="md:col-span-2 rounded-3xl p-6 border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-cyan-400" />
                  Executive Recruiter Evaluation
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  AI Evaluator
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {matchResult.summary}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-3 border-t border-slate-800">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {matchResult.matching_skills?.length || 0} Verified Strengths
                </span>
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <AlertTriangle className="h-3.5 w-3.5" /> {matchResult.gaps?.length || 0} Skill Gaps
                </span>
                <span className="flex items-center gap-1 text-rose-400 font-semibold">
                  <Flame className="h-3.5 w-3.5" /> {matchResult.vulnerabilities?.length || 0} Vulnerability Hotspots
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Skill Match Matrix */}
          <div className="rounded-3xl p-6 border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading font-extrabold text-lg text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-emerald-400" />
                  Skill Gap & Verification Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct breakdown of candidate claims vs role expectations
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800 self-start sm:self-auto">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({ (matchResult.matching_skills?.length || 0) + (matchResult.gaps?.length || 0) })
                </button>
                <button
                  onClick={() => setFilterType('matches')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterType === 'matches' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Matches ({ matchResult.matching_skills?.length || 0 })
                </button>
                <button
                  onClick={() => setFilterType('gaps')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterType === 'gaps' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Gaps ({ matchResult.gaps?.length || 0 })
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Verified Matches */}
              {(filterType === 'all' || filterType === 'matches') &&
                matchResult.matching_skills?.map((item, idx) => (
                  <div 
                    key={`match-${idx}`}
                    className="rounded-2xl p-4 border border-emerald-500/20 bg-emerald-950/10 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{item.skill}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 shrink-0">
                        VERIFIED MATCH
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 pl-6 leading-relaxed">
                      {item.evidence}
                    </p>
                  </div>
                ))}

              {/* Skill Gaps */}
              {(filterType === 'all' || filterType === 'gaps') &&
                matchResult.gaps?.map((item, idx) => (
                  <div 
                    key={`gap-${idx}`}
                    className="rounded-2xl p-4 border border-amber-500/20 bg-amber-950/10 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-sm text-amber-300 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        <span>{item.skill}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 shrink-0">
                        SKILL GAP
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 pl-6 leading-relaxed">
                      {item.impact}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Section 3: Interview Vulnerability Predictor */}
          <div className="rounded-3xl p-6 border border-rose-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-rose-950/20 shadow-xl space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400 mb-2">
                <Flame className="h-3.5 w-3.5" />
                <span>Interviewer Pressure Points</span>
              </div>
              <h3 className="font-heading font-extrabold text-lg text-white">
                Predicted Interview Vulnerabilities & Grilling Questions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                These are the exact areas where interviewers will scrutinize candidate depth based on resume gaps
              </p>
            </div>

            <div className="space-y-4">
              {matchResult.vulnerabilities?.map((vuln, idx) => {
                const riskBadge = 
                  vuln.risk_level === 'high' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                  vuln.risk_level === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';

                return (
                  <div
                    key={`vuln-${idx}`}
                    className="rounded-2xl p-5 border border-slate-800 bg-slate-950/70 space-y-3 hover:border-rose-500/40 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-400" />
                        <span>{vuln.area}</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border ${riskBadge}`}>
                        {vuln.risk_level} Risk
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                      <span className="font-bold text-slate-400">Why they will challenge you: </span>
                      {vuln.reasoning}
                    </div>

                    <div className="rounded-xl p-3.5 bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-900 border border-rose-500/20 flex items-start gap-2.5">
                      <HelpCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-300">
                          Predicted Question:
                        </div>
                        <div className="text-xs font-semibold text-slate-100">
                          "{vuln.predicted_question}"
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Tailored STAR Bridging Answers */}
          <div className="rounded-3xl p-6 border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400 mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Personalized Talking Points</span>
              </div>
              <h3 className="font-heading font-extrabold text-lg text-white">
                Tailored STAR Bridging Answers
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pre-formatted STAR narratives framing your real past experience to cover high-stakes requirements
              </p>
            </div>

            <div className="space-y-4">
              {matchResult.bridging_star_answers?.map((star, idx) => {
                const isExpanded = expandedStar === idx;
                const fullStarText = `Requirement: ${star.requirement_text}\nSituation: ${star.situation}\nTask: ${star.task}\nAction: ${star.action}\nResult: ${star.result}`;

                return (
                  <div
                    key={`star-${idx}`}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden transition-all"
                  >
                    {/* Header */}
                    <div 
                      onClick={() => setExpandedStar(isExpanded ? null : idx)}
                      className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                          <Target className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white">
                            Bridging: {star.requirement_text}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                            {star.situation}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyStar(fullStarText, idx);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy STAR</span>
                            </>
                          )}
                        </button>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded STAR Details */}
                    {isExpanded && (
                      <div className="p-5 pt-0 border-t border-slate-800/80 space-y-3 bg-slate-900/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                              [S] Situation
                            </span>
                            <p className="text-xs text-slate-300">{star.situation}</p>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                              [T] Task
                            </span>
                            <p className="text-xs text-slate-300">{star.task}</p>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                              [A] Action
                            </span>
                            <p className="text-xs text-slate-300">{star.action}</p>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
                              [R] Result & Metric
                            </span>
                            <p className="text-xs text-slate-300">{star.result}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
