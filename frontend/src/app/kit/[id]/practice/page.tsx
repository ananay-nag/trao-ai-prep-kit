'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { fetchKit, submitFlashcardFeedback } from '../../../../lib/api';
import { Kit, Flashcard } from '../../../../types/kit';
import { 
  Flame, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  SortAsc,
  Shuffle,
  Keyboard,
  Award,
  Volume2,
  VolumeX,
  Layers,
  Filter,
  Check,
  RotateCcw,
  Download
} from 'lucide-react';
import { generateAnkiCsv, downloadFile } from '../../../../lib/exportUtils';
import { useKitContext } from '../KitContext';
import { GenericTabShimmerSkeleton } from '../../../components/KitShimmerSkeleton';

export default function KitPracticePage() {
  const params = useParams();
  const kitId = params?.id as string;
  const { kit, loading } = useKitContext();

  const [cards, setCards] = useState<Flashcard[]>(kit?.flashcards || []);
  const [filterConfidence, setFilterConfidence] = useState<'all' | 1 | 2 | 3>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  useEffect(() => {
    if (kit?.flashcards) {
      setCards(kit.flashcards);
    }
  }, [kit?.flashcards]);


  // Filtered Cards
  const displayedCards = cards.filter((c) => {
    if (filterConfidence === 'all') return true;
    return c._confidence === filterConfidence;
  });

  const activeCards = displayedCards.length > 0 ? displayedCards : cards;
  const currentCard = activeCards[currentIndex] || activeCards[0];

  const handleFlip = useCallback(() => {
    setFlipped((prev) => !prev);
    if (isSpeaking && typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  const handleConfidence = useCallback(async (score: 1 | 2 | 3) => {
    if (!currentCard) return;

    const updatedCards = cards.map((c) => {
      if (c.id === currentCard.id) {
        return {
          ...c,
          _confidence: score,
          _lastReviewedAt: new Date().toISOString()
        };
      }
      return c;
    });
    setCards(updatedCards);

    submitFlashcardFeedback(kitId, currentCard.id, score).catch(console.error);

    if (currentIndex < activeCards.length - 1) {
      setFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  }, [cards, currentCard, currentIndex, kitId, activeCards.length]);

  // TTS audio playback
  const handleSpeakCard = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !currentCard) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = flipped ? currentCard.back : currentCard.front;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted || !currentCard) return;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === '1') {
        handleConfidence(1);
      } else if (e.key === '2') {
        handleConfidence(2);
      } else if (e.key === '3') {
        handleConfidence(3);
      } else if (e.key === 'ArrowRight' && currentIndex < activeCards.length - 1) {
        setFlipped(false);
        setCurrentIndex((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setFlipped(false);
        setCurrentIndex((prev) => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleConfidence, handleFlip, isCompleted, currentCard, currentIndex, activeCards.length]);

  // Shuffle Cards
  const shuffleCards = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setFlipped(false);
    setIsCompleted(false);
  };

  // Confidence-weighted Sort (lowest confidence cards first)
  const sortByConfidence = () => {
    const sorted = [...cards].sort((a, b) => {
      const confA = a._confidence ?? 1;
      const confB = b._confidence ?? 1;
      return confA - confB; // 1 (Hard) first, then 2, then 3
    });
    setCards(sorted);
    setFilterConfidence('all');
    setCurrentIndex(0);
    setFlipped(false);
    setIsCompleted(false);
  };

  const restartSession = () => {
    setCurrentIndex(0);
    setFlipped(false);
    setIsCompleted(false);
  };

  if (loading || !kit) {
    return <GenericTabShimmerSkeleton />;
  }


  // Stats calculation
  const masteredCount = cards.filter((c) => c._confidence === 3).length;
  const reviewCount = cards.filter((c) => c._confidence === 2).length;
  const hardCount = cards.filter((c) => c._confidence === 1).length;
  const masteryPercent = Math.round((masteredCount / cards.length) * 100);

  const handleDownloadAnki = () => {
    if (!kit) return;
    const csv = generateAnkiCsv(kit);
    const safeCompany = kit.source.company.toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadFile(`${safeCompany}_anki_deck.csv`, csv, 'text/tab-separated-values;charset=utf-8');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header & Mastery Gauge */}
      <div className="glass-card rounded-3xl p-5 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Practice Mode & Spaced Review
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {masteryPercent}% Mastered
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {masteredCount} Mastered • {reviewCount} In Review • {hardCount} Needs Work
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadAnki}
            title="Download Anki/Quizlet CSV Deck"
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white text-xs font-semibold border border-amber-500/40 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-amber-400" />
            <span>Export to Anki</span>
          </button>

          <button
            onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
            title="View keyboard shortcuts"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700/80 transition-colors"
          >
            <Keyboard className="h-4 w-4 text-cyan-400" />
          </button>

          <button
            onClick={shuffleCards}
            title="Randomize card order"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700/80 transition-colors"
          >
            <Shuffle className="h-4 w-4" />
          </button>

          <button
            onClick={sortByConfidence}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700/80 flex items-center gap-1.5 transition-colors"
          >
            <SortAsc className="h-3.5 w-3.5 text-emerald-400" />
            Weak Spots First
          </button>
        </div>
      </div>


      {/* Keyboard Shortcuts Helper Drawer */}
      {showKeyboardHelp && (
        <div className="glass-card rounded-2xl p-4 border border-cyan-500/30 text-xs space-y-2 animate-fade-in bg-slate-900/90">
          <h4 className="font-bold text-cyan-400 flex items-center gap-1.5">
            <Keyboard className="h-4 w-4" /> Keyboard Shortcuts for Speedy Practice
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 pt-1">
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="font-mono text-emerald-400 font-bold">Space / Enter</span>: Flip Card
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="font-mono text-red-400 font-bold">Key 1</span>: Mark Hard
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="font-mono text-amber-400 font-bold">Key 2</span>: Mark Medium
            </div>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="font-mono text-emerald-400 font-bold">Key 3</span>: Mark Mastered
            </div>
          </div>
        </div>
      )}

      {/* Main Flashcard Arena */}
      {!isCompleted && currentCard ? (
        <div className="space-y-6">
          {/* Progress Tracker Bar & Filter Pills */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-semibold text-slate-400 gap-2">
              <span>Card {currentIndex + 1} of {activeCards.length}</span>

              {/* Quick Mastery Filter Pills */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setFilterConfidence('all'); setCurrentIndex(0); }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    filterConfidence === 'all' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  All ({cards.length})
                </button>
                <button
                  onClick={() => { setFilterConfidence(1); setCurrentIndex(0); }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    filterConfidence === 1 ? 'bg-red-500 text-white font-bold' : 'bg-slate-800 text-red-400'
                  }`}
                >
                  Hard ({hardCount})
                </button>
                <button
                  onClick={() => { setFilterConfidence(2); setCurrentIndex(0); }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    filterConfidence === 2 ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-amber-400'
                  }`}
                >
                  Medium ({reviewCount})
                </button>
                <button
                  onClick={() => { setFilterConfidence(3); setCurrentIndex(0); }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    filterConfidence === 3 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-emerald-400'
                  }`}
                >
                  Mastered ({masteredCount})
                </button>
              </div>
            </div>
          </div>

          {/* 3D Flip Card Container */}
          <div
            onClick={handleFlip}
            className="cursor-pointer min-h-[340px] glass-card rounded-3xl p-8 border border-slate-700/80 shadow-2xl flex flex-col justify-between transition-all hover:border-emerald-500/40 relative group select-none"
          >
            {/* Top Row: Card ID, TTS & Flip Indicator */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                  [{currentCard.id}]
                </span>

                {/* Audio TTS */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeakCard();
                  }}
                  title="Read card aloud"
                  className={`p-1.5 rounded-lg border transition-colors ${
                    isSpeaking 
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse' 
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-cyan-400" />}
                </button>
              </div>

              <span className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-emerald-400 transition-colors">
                <RotateCw className="h-3.5 w-3.5" /> Click or press Space to reveal
              </span>
            </div>

            {/* Question / Answer Outline Center */}
            <div className="py-6 text-center space-y-4">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${flipped ? 'text-emerald-400' : 'text-slate-400'}`}>
                {flipped ? 'Key Outline & Discussion Takeaways' : 'Concept / Question Prompt'}
              </h3>
              <p className="text-lg sm:text-xl font-medium text-white leading-relaxed max-w-xl mx-auto">
                {flipped ? currentCard.back : currentCard.front}
              </p>
            </div>

            {/* Linked Requirements Bottom */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <span>Reinforces Requirement:</span>
              {currentCard.requirement_ids.map((rId) => (
                <span key={rId} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-300 font-mono font-semibold">
                  {rId}
                </span>
              ))}
            </div>
          </div>

          {/* Interactive Bottom Thumbnail Tray */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>Quick Card Strip (Click to Jump):</span>
              <span>{activeCards.length} Cards in Deck</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
              {activeCards.map((c, i) => {
                const isSelected = i === currentIndex;
                const conf = c._confidence;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCurrentIndex(i);
                      setFlipped(false);
                    }}
                    className={`h-7 px-2.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all shrink-0 ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400 shadow-md scale-105'
                        : conf === 3
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                        : conf === 1
                        ? 'bg-red-950/80 text-red-400 border border-red-800/60'
                        : conf === 2
                        ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    <span>{c.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Confidence Rating Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Rate Your Recall Confidence (Keys 1, 2, 3):</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (currentIndex > 0) {
                      setFlipped(false);
                      setCurrentIndex(currentIndex - 1);
                    }
                  }}
                  disabled={currentIndex === 0}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-30 border border-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (currentIndex < activeCards.length - 1) {
                      setFlipped(false);
                      setCurrentIndex(currentIndex + 1);
                    }
                  }}
                  disabled={currentIndex === activeCards.length - 1}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-30 border border-slate-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleConfidence(1)}
                className="py-3 px-4 rounded-2xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 font-bold text-xs transition-all flex flex-col items-center gap-0.5 hover:scale-[1.02] cursor-pointer"
              >
                <span>[1] Hard</span>
                <span className="text-[10px] font-normal text-red-400">Needs Review</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfidence(2)}
                className="py-3 px-4 rounded-2xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 font-bold text-xs transition-all flex flex-col items-center gap-0.5 hover:scale-[1.02] cursor-pointer"
              >
                <span>[2] Medium</span>
                <span className="text-[10px] font-normal text-amber-400">Good Grip</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfidence(3)}
                className="py-3 px-4 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 font-bold text-xs transition-all flex flex-col items-center gap-0.5 hover:scale-[1.02] cursor-pointer"
              >
                <span>[3] Easy</span>
                <span className="text-[10px] font-normal text-emerald-400">Mastered</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Completed State */
        <div className="glass-card rounded-3xl p-10 text-center space-y-6 border border-emerald-500/30 animate-fade-in shadow-2xl">
          <div className="inline-flex p-4 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            <Award className="h-12 w-12" />
          </div>
          <h3 className="text-2xl font-extrabold text-white">Practice Round Completed!</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            You reviewed all {activeCards.length} flashcards. Mastery score: <strong className="text-emerald-400">{masteryPercent}%</strong> ({masteredCount}/{cards.length} Mastered).
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={sortByConfidence}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
            >
              <SortAsc className="h-4 w-4" /> Start Next Round (Weak Spots First)
            </button>
            <button
              onClick={restartSession}
              className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" /> Restart Deck
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
