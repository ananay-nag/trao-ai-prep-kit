'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchKit, updateKit, regenerateSection } from '../../../../lib/api';
import { Kit, Question, QuestionCategory } from '../../../../types/kit';
import { 
  Pin, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Save, 
  Check, 
  Sparkles, 
  ChevronUp, 
  ChevronDown,
  Lock,
  Search,
  Copy,
  CheckCheck,
  Filter,
  Download,
  FileCode,
  Unlock
} from 'lucide-react';
import { useKitContext } from '../KitContext';
import { GenericTabShimmerSkeleton } from '../../../components/KitShimmerSkeleton';

const CATEGORIES: { key: QuestionCategory; label: string; icon: string }[] = [
  { key: 'technical', label: 'Technical', icon: '💻' },
  { key: 'system-design', label: 'System Design', icon: '🏗️' },
  { key: 'behavioural', label: 'Behavioural', icon: '🤝' },
  { key: 'company-fit', label: 'Company Fit', icon: '🎯' }
];

export default function KitBuilderPage() {
  const params = useParams();
  const kitId = params?.id as string;
  const { kit, loading, setKit } = useKitContext();

  const [activeCategory, setActiveCategory] = useState<QuestionCategory>('technical');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pinned' | 'edited' | 'diff3'>('all');
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (loading || !kit) {
    return <GenericTabShimmerSkeleton />;
  }


  // Inline Question Updates
  const handleQuestionChange = (qId: string, field: keyof Question, value: any) => {
    const updatedQuestions = kit.questions.map((q) => {
      if (q.id === qId) {
        return {
          ...q,
          [field]: value,
          _origin: q._origin === 'user_created' ? 'user_created' : 'user_edited'
        };
      }
      return q;
    });

    setKit({ ...kit, questions: updatedQuestions as any });
  };

  // Pin Toggle
  const togglePin = (qId: string) => {
    const updatedQuestions = kit.questions.map((q) => {
      if (q.id === qId) {
        return { ...q, _isPinned: !q._isPinned };
      }
      return q;
    });
    setKit({ ...kit, questions: updatedQuestions });
  };

  // Pin All in Category
  const pinAllInCategory = (pinned: boolean) => {
    const updatedQuestions = kit.questions.map((q) => {
      if (q.category === activeCategory) {
        return { ...q, _isPinned: pinned };
      }
      return q;
    });
    setKit({ ...kit, questions: updatedQuestions });
  };

  // Move Question Up/Down within category
  const moveQuestion = (qId: string, direction: 'up' | 'down') => {
    const currentList = [...kit.questions];
    const index = currentList.findIndex((q) => q.id === qId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    const temp = currentList[index];
    currentList[index] = currentList[targetIndex];
    currentList[targetIndex] = temp;

    setKit({ ...kit, questions: currentList });
  };

  // Delete Question
  const deleteQuestion = (qId: string) => {
    const updated = kit.questions.filter((q) => q.id !== qId);
    setKit({ ...kit, questions: updated });
  };

  // Copy Question Text
  const copyQuestion = (q: Question) => {
    navigator.clipboard.writeText(`Question: ${q.prompt}\n\nOutline: ${q.answer_outline}`);
    setCopiedId(q.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Add Custom Question by Hand
  const addCustomQuestion = () => {
    const newId = `q_custom_${Date.now().toString().slice(-4)}`;
    const newQuestion: Question = {
      id: newId,
      requirement_ids: kit.role.requirements.length > 0 ? [kit.role.requirements[0].id] : ['r1'],
      category: activeCategory,
      prompt: 'New custom interview question...',
      answer_outline: 'Outline the core points and expected discussion points...',
      difficulty: 2,
      _origin: 'user_created',
      _isPinned: true
    };

    setKit({
      ...kit,
      questions: [newQuestion, ...kit.questions]
    });
  };

  // Export Section to Markdown
  const exportCategoryMarkdown = () => {
    const categoryQuestions = kit.questions.filter((q) => q.category === activeCategory);
    let md = `# ${kit.source.company} - ${activeCategory.toUpperCase()} Questions\n\n`;
    categoryQuestions.forEach((q, i) => {
      md += `### ${i + 1}. [${q.id}] ${q.prompt} (Diff: ${q.difficulty}/3)\n`;
      md += `**Linked Requirements:** ${q.requirement_ids.join(', ')}\n\n`;
      md += `**Answer Outline:**\n${q.answer_outline}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${kit.source.company}_${activeCategory}_questions.md`;
    a.click();
  };

  // Save All Changes to Server
  const handleSave = async () => {
    if (!kit) return;
    setSaving(true);
    try {
      await updateKit(kitId, kit);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  // Regenerate Specific Category while preserving user edits and pins
  const handleRegenerateCategory = async (cat: QuestionCategory) => {
    if (!kit) return;
    setRegenerating(true);
    try {
      const res = await regenerateSection(kitId, cat, kit);
      setKit(res.kit);
    } catch (err) {
      console.error('Regeneration failed:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const filteredQuestions = kit.questions.filter((q) => {
    const matchesCat = q.category === activeCategory;
    if (!matchesCat) return false;

    if (filterType === 'pinned' && !q._isPinned) return false;
    if (filterType === 'edited' && q._origin !== 'user_edited' && q._origin !== 'user_created') return false;
    if (filterType === 'diff3' && q.difficulty !== 3) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      q.prompt.toLowerCase().includes(query) || 
      q.answer_outline.toLowerCase().includes(query) ||
      q.id.toLowerCase().includes(query) ||
      q.requirement_ids.some(r => r.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="glass-card rounded-3xl p-5 border border-slate-800 flex flex-col gap-4">
        {/* Top Row: Category Tabs & Search Filter */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 w-full lg:w-auto">
            {CATEGORIES.map((cat) => {
              const count = kit.questions.filter((q) => q.category === cat.key).length;
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80 bg-slate-900/60 border border-slate-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-slate-950/20 text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Filter Bar */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by keyword or [r1]..."
              className="w-full rounded-xl bg-slate-950/80 border border-slate-800 pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Second Row: Filter Badges & Quick Bulk Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium mr-1">Filter:</span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'all' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-900 text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('pinned')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'pinned' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-900 text-slate-400'
              }`}
            >
              📌 Pinned Only
            </button>
            <button
              onClick={() => setFilterType('edited')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'edited' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-900 text-slate-400'
              }`}
            >
              ✏️ Edited Only
            </button>
            <button
              onClick={() => setFilterType('diff3')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'diff3' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-900 text-slate-400'
              }`}
            >
              ⚡ Hard (Diff 3)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => pinAllInCategory(true)}
              title="Pin all questions in this category"
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-800 transition-colors flex items-center gap-1"
            >
              <Pin className="h-3 w-3" /> Pin All
            </button>
            <button
              type="button"
              onClick={() => pinAllInCategory(false)}
              title="Unpin all questions in this category"
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-colors flex items-center gap-1"
            >
              <Unlock className="h-3 w-3" /> Unpin All
            </button>
            <button
              type="button"
              onClick={exportCategoryMarkdown}
              title="Export questions to markdown file"
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 transition-colors flex items-center gap-1"
            >
              <Download className="h-3 w-3" /> Export MD
            </button>
          </div>
        </div>

        {/* Bottom Row: Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <Lock className="h-3 w-3" /> State Engine Active:
            </span>
            <span>Pinned (<span className="text-emerald-400 font-bold">📌</span>) & manual edits survive regenerations</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRegenerateCategory(activeCategory)}
              disabled={regenerating}
              title="Regenerate this category without losing pinned or edited questions"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin text-emerald-400' : ''}`} />
              Regenerate {CATEGORIES.find((c) => c.key === activeCategory)?.label}
            </button>

            <button
              onClick={addCustomQuestion}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-400" />
              Add Question
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 text-slate-950" /> Saved!
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Question Cards List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center space-y-3 border border-slate-800">
            <p className="text-slate-400 text-sm">No questions matching current filter in this category.</p>
            <button
              onClick={addCustomQuestion}
              className="px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold"
            >
              Add a new question
            </button>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const isPinned = q._isPinned === true;
            const isUserCreated = q._origin === 'user_created';
            const isUserEdited = q._origin === 'user_edited';

            return (
              <div
                key={q.id}
                className={`glass-card rounded-3xl p-6 border transition-all ${
                  isPinned 
                    ? 'border-emerald-500/50 bg-slate-900/95 shadow-lg shadow-emerald-950/20' 
                    : 'border-slate-800/80 bg-slate-900/70'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800/70">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400">[{q.id}]</span>
                    {isPinned && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                        <Lock className="h-2.5 w-2.5" /> Pinned (Protected)
                      </span>
                    )}
                    {isUserCreated && (
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold border border-cyan-500/30">
                        ➕ Custom Added
                      </span>
                    )}
                    {isUserEdited && !isUserCreated && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30">
                        ✏️ User Edited
                      </span>
                    )}
                    {!isUserCreated && !isUserEdited && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-medium">
                        🤖 AI Generated
                      </span>
                    )}
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center gap-2">
                    {/* Category Selector */}
                    <select
                      value={q.category}
                      onChange={(e) => handleQuestionChange(q.id, 'category', e.target.value)}
                      className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>

                    {/* Difficulty Selector */}
                    <select
                      value={q.difficulty}
                      onChange={(e) => handleQuestionChange(q.id, 'difficulty', parseInt(e.target.value))}
                      className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
                    >
                      <option value={1}>Diff: 1 (Easy)</option>
                      <option value={2}>Diff: 2 (Mid)</option>
                      <option value={3}>Diff: 3 (Hard)</option>
                    </select>

                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => copyQuestion(q)}
                      title="Copy question text"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors cursor-pointer"
                    >
                      {copiedId === q.id ? <CheckCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>

                    {/* Pin Button */}
                    <button
                      type="button"
                      onClick={() => togglePin(q.id)}
                      title={isPinned ? 'Unpin question' : 'Pin question (protect against category regeneration)'}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isPinned
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                      }`}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>

                    {/* Reorder Buttons */}
                    <button
                      type="button"
                      onClick={() => moveQuestion(q.id, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-30 border border-slate-700"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveQuestion(q.id, 'down')}
                      disabled={idx === filteredQuestions.length - 1}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-30 border border-slate-700"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => deleteQuestion(q.id)}
                      title="Delete question"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/60 text-slate-400 hover:text-red-300 border border-slate-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inline Editable Question Prompt */}
                <div className="space-y-3 pt-3.5">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                      <span>Interviewer Prompt (Inline Editable)</span>
                      <span className="text-slate-500 font-normal">{q.prompt.length} chars</span>
                    </label>
                    <textarea
                      rows={2}
                      value={q.prompt}
                      onChange={(e) => handleQuestionChange(q.id, 'prompt', e.target.value)}
                      className="w-full mt-1.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-medium leading-relaxed"
                    />
                  </div>

                  {/* Inline Editable Answer Outline */}
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                      <span>Expected Answer Outline & Discussion Points</span>
                      <span className="text-slate-500 font-normal">{q.answer_outline.length} chars</span>
                    </label>
                    <textarea
                      rows={3}
                      value={q.answer_outline}
                      onChange={(e) => handleQuestionChange(q.id, 'answer_outline', e.target.value)}
                      className="w-full mt-1.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 leading-relaxed font-sans"
                    />
                  </div>

                  {/* Linked Requirement IDs */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
                    <span className="font-semibold text-slate-500">Linked Requirements:</span>
                    {q.requirement_ids.map((rId) => {
                      const matchingReq = kit.role.requirements.find((r) => r.id === rId);
                      return (
                        <span
                          key={rId}
                          title={matchingReq?.text}
                          className="px-2.5 py-0.5 rounded-lg bg-slate-950 text-emerald-300 text-[11px] font-mono border border-slate-800 cursor-help flex items-center gap-1"
                        >
                          {rId} {matchingReq?.priority === 'must' ? <span className="text-amber-400">★</span> : ''}
                          <span className="text-slate-500 text-[10px]">({matchingReq?.kind || 'tech'})</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
