'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { fetchKit, evaluateMockAnswer } from '../../../../lib/api';
import { Kit, Question } from '../../../../types/kit';
import { 
  Bot, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Award, 
  Sparkles,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  Check,
  Zap,
  Flame
} from 'lucide-react';
import { useKitContext } from '../KitContext';
import { GenericTabShimmerSkeleton } from '../../../components/KitShimmerSkeleton';

export default function KitMockInterviewPage() {
  const params = useParams();
  const kitId = params?.id as string;
  const { kit, loading } = useKitContext();

  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(kit?.questions[0] || null);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<{
    score: number;
    strengths: string[];
    blind_spots: string[];
    feedback_summary: string;
  } | null>(null);

  // Voice & Speech Recognition State
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Text to Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Benchmark Answer Toggle
  const [showOutline, setShowOutline] = useState(false);
  const [copiedAnswer, setCopiedAnswer] = useState(false);

  useEffect(() => {
    if (kit?.questions && kit.questions.length > 0 && !selectedQuestion) {
      setSelectedQuestion(kit.questions[0]);
    }
  }, [kit?.questions, selectedQuestion]);


  // Check Web Speech API Support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setCandidateAnswer((prev) => {
              const prefix = prev.trim() ? `${prev.trim()} ` : '';
              return prefix + transcript;
            });
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Timer Interval
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  const toggleSpeechRecognition = () => {
    if (!speechSupported || !recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        if (!timerActive && timerSeconds === 0) {
          setTimerActive(true);
        }
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  };

  const handleTextToSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (selectedQuestion) {
      const utterance = new SpeechSynthesisUtterance(selectedQuestion.prompt);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateAnswer.trim() || !selectedQuestion) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    setTimerActive(false);

    setEvaluating(true);
    setEvaluation(null);

    try {
      const result = await evaluateMockAnswer(
        kitId,
        selectedQuestion.prompt,
        selectedQuestion.answer_outline,
        candidateAnswer
      );
      setEvaluation(result);
    } catch (err: any) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  if (loading || !kit || !selectedQuestion) {
    return <GenericTabShimmerSkeleton />;
  }


  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="h-5 w-5 text-emerald-400" />
            AI Mock Interview Simulator & Feedback Radar
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate real interview pressure with voice dictation, answer timers, audio prompts, and instant evaluation.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors print:hidden"
        >
          <Printer className="h-4 w-4 text-cyan-400" />
          Export One-Pager Cheat Sheet
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Question Selector */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3 print:hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Question ({kit.questions.length})
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              Role: {kit.role.seniority}
            </span>
          </div>

          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {kit.questions.map((q) => {
              const isSelected = selectedQuestion.id === q.id;
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setSelectedQuestion(q);
                    setCandidateAnswer('');
                    setEvaluation(null);
                    setTimerSeconds(0);
                    setTimerActive(false);
                    setShowOutline(false);
                    if (isSpeaking && typeof window !== 'undefined') {
                      window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                    }
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                    isSelected
                      ? 'bg-emerald-950/50 border-emerald-500/40 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-emerald-400">[{q.id}]</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                        {q.category}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/20 font-mono">
                        D{q.difficulty}
                      </span>
                    </div>
                  </div>
                  <p className="line-clamp-2 font-medium leading-snug">{q.prompt}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Question Prompt, Candidate Answer Box, Controls, and Evaluation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Question Box */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Active Question [{selectedQuestion.id}] • {selectedQuestion.category.toUpperCase()}
              </span>

              <div className="flex items-center gap-2">
                {/* Audio TTS Button */}
                <button
                  type="button"
                  onClick={handleTextToSpeech}
                  title="Listen to interviewer speak this question"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                    isSpeaking 
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-cyan-400" />}
                  <span>{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
                </button>

                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                  Difficulty: {selectedQuestion.difficulty}/3
                </span>
              </div>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
              {selectedQuestion.prompt}
            </h3>

            {/* Benchmark Outline Toggle & Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setShowOutline(!showOutline)}
                  className="text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 font-medium transition-colors"
                >
                  {showOutline ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-emerald-400" />}
                  <span>{showOutline ? 'Hide Expected Coverage' : 'Reveal Expected Key Coverage'}</span>
                </button>

                {showOutline && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedQuestion.answer_outline)}
                    className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[11px]"
                  >
                    {copiedAnswer ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedAnswer ? 'Copied' : 'Copy Outline'}</span>
                  </button>
                )}
              </div>

              {showOutline && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-xs text-slate-300 animate-fade-in space-y-1">
                  <strong className="text-emerald-400 block font-semibold">Benchmark Talking Points:</strong>
                  <p className="leading-relaxed">{selectedQuestion.answer_outline}</p>
                </div>
              )}
            </div>

            {/* Answer Input Form & Toolbar */}
            <form onSubmit={handleEvaluate} className="space-y-4 pt-2 print:hidden">
              {/* Practice Toolbar (Timer + Voice Dictation) */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                {/* Timer Controls */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-slate-200">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{formatTimer(timerSeconds)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTimerActive(!timerActive)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    title={timerActive ? 'Pause Timer' : 'Start Timer'}
                  >
                    {timerActive ? <Pause className="h-3.5 w-3.5 text-amber-400" /> : <Play className="h-3.5 w-3.5 text-emerald-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTimerActive(false);
                      setTimerSeconds(0);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors"
                    title="Reset Timer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Voice Dictation (Speech-to-Text) Button */}
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all ${
                      isRecording
                        ? 'bg-red-500 text-white border-red-400 animate-pulse shadow-md shadow-red-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="h-3.5 w-3.5" />
                        <span>Recording Voice (Click to stop)</span>
                      </>
                    ) : (
                      <>
                        <Mic className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Voice Dictate Answer</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <label>Your Answer / STAR Response:</label>
                  <span className="text-slate-500 font-normal">
                    {candidateAnswer.trim() ? `${candidateAnswer.trim().split(/\s+/).length} words` : '0 words'}
                  </span>
                </div>
                <textarea
                  rows={6}
                  required
                  value={candidateAnswer}
                  onChange={(e) => setCandidateAnswer(e.target.value)}
                  placeholder="Type or dictate your response here (include STAR method: Situation, Task, Action, Result, trade-offs, architecture decisions)..."
                  className="w-full rounded-xl bg-slate-950/90 border border-slate-700/80 p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 leading-relaxed font-sans"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={evaluating || !candidateAnswer.trim()}
                  className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {evaluating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Evaluating Answer against Rubric...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Submit for AI Scoring & Feedback
                    </>
                  )}
                </button>

                {candidateAnswer.trim() && (
                  <button
                    type="button"
                    onClick={() => setCandidateAnswer('')}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Clear Input
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* AI Feedback Radar Card */}
          {evaluation && (
            <div className="glass-card rounded-2xl p-6 border border-emerald-500/30 space-y-5 animate-fade-in shadow-2xl">
              {/* Header with Score Gauge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">Evaluation Result & Radar Analysis</h4>
                    <p className="text-xs text-slate-400">Evaluated against senior engineering hiring benchmarks</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-extrabold text-base shadow-inner">
                    <span className="text-xs text-slate-400 font-semibold mr-1">Score:</span>
                    <span className="text-xl text-white font-mono">{evaluation.score}</span>
                    <span className="text-xs text-slate-400">/ 10</span>
                  </div>
                </div>
              </div>

              {/* Score Category Badge */}
              <div className="flex items-center gap-2">
                {evaluation.score >= 8 ? (
                  <div className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Outstanding Response • Staff Candidate Tier
                  </div>
                ) : evaluation.score >= 5 ? (
                  <div className="px-3 py-1 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Solid Foundation • Minor Gaps to Refine
                  </div>
                ) : (
                  <div className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Needs Expansion • Deepen Technical Trade-offs
                  </div>
                )}
              </div>

              {/* Feedback Summary */}
              <div className="text-sm text-slate-200 leading-relaxed bg-slate-900/80 p-4 rounded-xl border border-slate-800/80">
                <strong className="text-emerald-400 block mb-1 font-semibold">Executive Feedback:</strong>
                {evaluation.feedback_summary}
              </div>

              {/* Strengths & Blind Spots Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Strengths */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20 space-y-2.5">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> What You Nailed
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {evaluation.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold mt-0.5">•</span>
                        <span className="leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Blind Spots */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-amber-500/20 space-y-2.5">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> Key Blind Spots & Missing Points
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {evaluation.blind_spots.map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold mt-0.5">•</span>
                        <span className="leading-relaxed">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
