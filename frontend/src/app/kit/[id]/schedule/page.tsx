'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchKit } from '../../../../lib/api';
import { Kit, Question } from '../../../../types/kit';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  BookOpen, 
  Layers, 
  ChevronDown, 
  ChevronUp,
  CheckSquare,
  Square,
  Copy,
  Check,
  Sparkles,
  Download,
  Info,
  X
} from 'lucide-react';
import { generateIcsCalendar, downloadFile } from '../../../../lib/exportUtils';
import { useKitContext } from '../KitContext';
import { GenericTabShimmerSkeleton } from '../../../components/KitShimmerSkeleton';


function ScheduleQuestionCard({ 
  question, 
  isCompleted, 
  onToggleComplete,
  onOpenDetail
}: { 
  question: Question;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onOpenDetail: (q: Question) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isPromptLong = question.prompt.length > 130;
  const isOutlineLong = question.answer_outline.length > 120;

  return (
    <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
      isCompleted
        ? 'bg-slate-950/60 border-emerald-500/40 opacity-80'
        : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/30'
    }`}>
      {/* Top Meta */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {/* Checkbox */}
          <button
            type="button"
            onClick={onToggleComplete}
            title={isCompleted ? 'Mark uncompleted' : 'Mark as studied'}
            className="text-slate-400 hover:text-emerald-400 transition-colors"
          >
            {isCompleted ? (
              <CheckSquare className="h-4 w-4 text-emerald-400" />
            ) : (
              <Square className="h-4 w-4 text-slate-500" />
            )}
          </button>
          <span className="font-mono font-bold text-emerald-400">[{question.id}]</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 uppercase font-medium">
            {question.category}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-500/20 font-bold">
            Diff: {question.difficulty}
          </span>
        </div>
      </div>

      {/* Question Prompt */}
      <div>
        <p className={`text-xs sm:text-sm font-medium leading-relaxed ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
          {isExpanded || !isPromptLong ? question.prompt : `${question.prompt.slice(0, 130)} `}
          {isPromptLong && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs ml-1 inline-flex items-center gap-0.5 underline decoration-emerald-500/40 underline-offset-2 no-underline"
            >
              {isExpanded ? '(less)' : '(more)'}
            </button>
          )}
        </p>
      </div>

      {/* Answer Outline & Key Focus */}
      <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-2.5 space-y-1.5">
        <div className="font-semibold text-slate-300 flex items-center justify-between">
          <span>Key Outline & Discussion Points:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenDetail(question)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5 transition-colors"
            >
              <Info className="h-3 w-3" /> Focus View
            </button>

            {(isPromptLong || isOutlineLong) && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-0.5 transition-colors"
              >
                {isExpanded ? (
                  <>Collapse <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>Expand <ChevronDown className="h-3 w-3" /></>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
          {isExpanded || !isOutlineLong ? question.answer_outline : `${question.answer_outline.slice(0, 120)}...`}
        </p>
      </div>
    </div>
  );
}

export default function KitSchedulePage() {
  const params = useParams();
  const kitId = params?.id as string;
  const { kit, loading } = useKitContext();
  const [completedQuestions, setCompletedQuestions] = useState<string[]>([]);
  const [copiedSchedule, setCopiedSchedule] = useState(false);
  const [selectedModalQuestion, setSelectedModalQuestion] = useState<Question | null>(null);

  // Load saved completion state from localStorage
  useEffect(() => {
    if (kitId && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`trao_schedule_completed_${kitId}`);
      if (saved) {
        try {
          setCompletedQuestions(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse saved schedule state', e);
        }
      }
    }
  }, [kitId]);

  const toggleQuestionComplete = (qId: string) => {
    let updated: string[];
    if (completedQuestions.includes(qId)) {
      updated = completedQuestions.filter((id) => id !== qId);
    } else {
      updated = [...completedQuestions, qId];
    }
    setCompletedQuestions(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`trao_schedule_completed_${kitId}`, JSON.stringify(updated));
    }
  };

  const copyScheduleText = () => {
    if (!kit) return;
    let text = `# ${kit.source.company} - ${kit.role.title} (${kit.schedule.days_available}-Day Prep Schedule)\n\n`;
    kit.schedule.days.forEach((d) => {
      text += `## Day ${d.day}: ${d.focus} (${d.minutes} mins)\n`;
      d.question_ids.forEach((qId) => {
        const q = kit.questions.find((item) => item.id === qId);
        if (q) {
          text += `- [${q.id}] ${q.prompt} (Diff: ${q.difficulty})\n  Outline: ${q.answer_outline}\n`;
        }
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedSchedule(true);
    setTimeout(() => setCopiedSchedule(false), 2000);
  };

  if (loading || !kit) {
    return <GenericTabShimmerSkeleton />;
  }


  const totalMinutes = kit.schedule.days.reduce((acc, d) => acc + d.minutes, 0);
  const totalQuestionsCount = kit.questions.length;
  const completedCount = completedQuestions.length;
  const completionPercentage = totalQuestionsCount > 0 ? Math.round((completedCount / totalQuestionsCount) * 100) : 0;

  const downloadCalendarIcs = () => {
    if (!kit) return;
    const ics = generateIcsCalendar(kit);
    const safeCompany = kit.source.company.toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadFile(`${safeCompany}_study_schedule.ics`, ics, 'text/calendar;charset=utf-8');
  };


  return (
    <div className="space-y-6">
      {/* Top Summary Bar */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-400" />
            {kit.schedule.days_available}-Day Tailored Study Schedule
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              {completionPercentage}% Done
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Prioritizes foundational & harder topics early, wrapping up with behavioural reviews and mock drills.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Total: </span>
            <span className="font-bold text-emerald-400">{totalMinutes} Mins</span>
          </div>

          <button
            onClick={downloadCalendarIcs}
            className="px-3.5 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 hover:text-white text-xs font-semibold border border-violet-500/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-violet-400" />
            <span>Add to Calendar (.ics)</span>
          </button>

          <button
            onClick={copyScheduleText}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedSchedule ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedSchedule ? 'Copied' : 'Copy Plan'}</span>
          </button>
        </div>
      </div>


      {/* Overall Progress Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Study Completion Roadmap
          </span>
          <span className="text-emerald-400 font-mono font-bold">
            {completedCount} of {totalQuestionsCount} Questions Studied ({completionPercentage}%)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Days Timeline */}
      <div className="space-y-4">
        {kit.schedule.days.map((day) => {
          const dayQuestions = day.question_ids
            .map((qId) => kit.questions.find((item) => item.id === qId))
            .filter(Boolean) as Question[];

          const dayCompletedCount = dayQuestions.filter((q) => completedQuestions.includes(q.id)).length;
          const isDayFullyComplete = dayQuestions.length > 0 && dayCompletedCount === dayQuestions.length;

          return (
            <div
              key={day.day}
              className={`glass-card rounded-2xl p-6 border transition-all space-y-4 ${
                isDayFullyComplete 
                  ? 'border-emerald-500/40 bg-slate-900/90 shadow-lg shadow-emerald-950/20' 
                  : 'border-slate-800/80 hover:border-emerald-500/30'
              }`}
            >
              {/* Day Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-xl font-bold text-xs flex items-center justify-center border ${
                    isDayFullyComplete 
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400' 
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    {isDayFullyComplete ? '✓' : `D${day.day}`}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      Day {day.day}: {day.focus}
                      {isDayFullyComplete && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          Day Completed
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    {day.minutes} Minutes Target
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 font-medium">
                    {dayCompletedCount}/{day.question_ids.length} Done
                  </span>
                </div>
              </div>

              {/* Day Questions List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {day.question_ids.map((qId) => {
                  const q = kit.questions.find((item) => item.id === qId);
                  if (!q) return null;
                  return (
                    <ScheduleQuestionCard 
                      key={qId} 
                      question={q} 
                      isCompleted={completedQuestions.includes(q.id)}
                      onToggleComplete={() => toggleQuestionComplete(q.id)}
                      onOpenDetail={(question) => setSelectedModalQuestion(question)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Focus View Modal */}
      {selectedModalQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/40 max-w-2xl w-full shadow-2xl space-y-5 animate-fade-in relative">
            <button
              onClick={() => setSelectedModalQuestion(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                [{selectedModalQuestion.id}]
              </span>
              <span className="text-xs uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                {selectedModalQuestion.category}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                Difficulty: {selectedModalQuestion.difficulty}/3
              </span>
            </div>

            <h3 className="text-lg font-bold text-white leading-snug">
              {selectedModalQuestion.prompt}
            </h3>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs text-slate-300">
              <strong className="text-emerald-400 block font-semibold text-sm">Key Outline & Discussion Blueprint:</strong>
              <p className="leading-relaxed whitespace-pre-wrap">{selectedModalQuestion.answer_outline}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Linked Requirements: {selectedModalQuestion.requirement_ids.join(', ')}
              </span>
              <button
                type="button"
                onClick={() => {
                  toggleQuestionComplete(selectedModalQuestion.id);
                  setSelectedModalQuestion(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
              >
                {completedQuestions.includes(selectedModalQuestion.id) ? 'Mark Incomplete' : 'Mark as Studied ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
