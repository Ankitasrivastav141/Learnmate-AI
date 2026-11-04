'use client';

import { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Sparkles,
  Award,
  Layers,
  BrainCircuit,
  Filter,
} from 'lucide-react';

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  difficulty: string; // 'Easy' | 'Medium' | 'Hard'
  topic?: { title: string } | null | string;
  reviewCount?: number;
  correctCount?: number;
  documentTitle?: string;
}

interface FlashcardDeckProps {
  cards?: FlashcardItem[];
  flashcards?: FlashcardItem[];
  onRatingUpdate?: (cardId: string, rating: 'Easy' | 'Medium' | 'Hard') => void;
}

export function FlashcardDeck({ cards: initialCards, flashcards, onRatingUpdate }: FlashcardDeckProps) {
  const effectiveCards = initialCards || flashcards || [];
  const [cards, setCards] = useState<FlashcardItem[]>(effectiveCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | 'Hard' | 'Medium' | 'Easy'>('ALL');
  const [sessionRatings, setSessionRatings] = useState<Record<string, 'Easy' | 'Medium' | 'Hard'>>({});

  const activeCards = cards.filter((c) =>
    difficultyFilter === 'ALL' ? true : (c.difficulty || 'Medium') === difficultyFilter
  );

  if (!cards || cards.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
        <Sparkles className="w-8 h-8 text-blue-600 mx-auto mb-3" />
        <h4 className="text-base font-bold text-slate-800">No Flashcards Available</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Upload a lecture presentation or document to automatically extract terminology and concept flashcards.
        </p>
      </div>
    );
  }

  if (activeCards.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm space-y-3">
        <Layers className="w-8 h-8 text-slate-400 mx-auto" />
        <h4 className="text-sm font-bold text-slate-800">No {difficultyFilter} cards found</h4>
        <button
          onClick={() => setDifficultyFilter('ALL')}
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          View all cards ({cards.length})
        </button>
      </div>
    );
  }

  const safeIndex = Math.min(currentIndex, activeCards.length - 1);
  const currentCard = activeCards[safeIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % activeCards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + activeCards.length) % activeCards.length);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const shuffled = [...cards].sort(() => 0.5 - Math.random());
    setCards(shuffled);
    setCurrentIndex(0);
  };

  const handleRateDifficulty = async (rating: 'Easy' | 'Medium' | 'Hard') => {
    setSessionRatings((prev) => ({ ...prev, [currentCard.id]: rating }));

    // Update in local state
    setCards((prev) =>
      prev.map((c) => (c.id === currentCard.id ? { ...c, difficulty: rating } : c))
    );

    if (onRatingUpdate) {
      onRatingUpdate(currentCard.id, rating);
    }

    try {
      await fetch(`/api/flashcards/${currentCard.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remembered: rating !== 'Hard',
          difficulty: rating,
        }),
      });
    } catch (err) {
      console.error('Failed to log flashcard review:', err);
    }

    handleNext();
  };

  const masteredCount = cards.filter(
    (c) => (sessionRatings[c.id] || c.difficulty) === 'Easy'
  ).length;
  const reviewNeededCount = cards.filter(
    (c) => (sessionRatings[c.id] || c.difficulty) === 'Hard'
  ).length;

  const currentTopic =
    typeof currentCard.topic === 'string'
      ? currentCard.topic
      : currentCard.topic?.title || 'Key Concept';

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* 1. Deck Stats & Filter Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-xs">
            <span className="text-slate-500 font-medium">Card: </span>
            <span className="font-bold text-slate-900">
              {safeIndex + 1} of {activeCards.length}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
              <CheckCircle2 className="w-3 h-3" /> {masteredCount} Mastered
            </span>
            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">
              <RotateCcw className="w-3 h-3" /> {reviewNeededCount} Needs Review
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Difficulty Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            {(['ALL', 'Hard', 'Medium', 'Easy'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setDifficultyFilter(filter);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  difficultyFilter === filter
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filter === 'ALL' ? 'All' : filter}
              </button>
            ))}
          </div>

          <button
            onClick={handleShuffle}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Shuffle deck"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Interactive 3D Flashcard Flip Container */}
      <div
        onClick={handleFlip}
        className="w-full min-h-[300px] cursor-pointer perspective-1000 group"
      >
        <div
          className={`relative w-full min-h-[300px] transition-transform duration-500 transform-style-3d rounded-2xl border ${
            isFlipped
              ? 'bg-blue-50/40 border-blue-200 shadow-md'
              : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
          } p-8 flex flex-col justify-between`}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
            <span className="font-bold text-blue-600 uppercase tracking-wider text-[11px]">
              {currentTopic}
            </span>

            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  (currentCard.difficulty || 'Medium') === 'Easy'
                    ? 'bg-emerald-100 text-emerald-800'
                    : (currentCard.difficulty || 'Medium') === 'Hard'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {currentCard.difficulty || 'Medium'}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {isFlipped ? 'Back (Answer)' : 'Front (Question)'}
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="py-8 text-center flex-1 flex flex-col items-center justify-center">
            {isFlipped ? (
              <div className="space-y-2 animate-in fade-in duration-200 max-w-lg">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Concept & Explanation
                </span>
                <p className="text-base font-medium text-slate-800 leading-relaxed">
                  {currentCard.back}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-w-lg">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Term / Question
                </span>
                <p className="text-lg md:text-xl font-bold text-slate-900 leading-relaxed">
                  {currentCard.front}
                </p>
              </div>
            )}
          </div>

          {/* Card Footer prompt */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Click card or press space to flip</span>
            <span className="text-blue-600 font-semibold group-hover:underline">
              {isFlipped ? 'Show Question' : 'Show Answer'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Rating & Spaced Repetition Feedback Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={handlePrev}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Previous card"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Next card"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Rating Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium mr-1 hidden sm:inline">
            Rate Mastery:
          </span>
          <button
            onClick={() => handleRateDifficulty('Hard')}
            className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold border border-red-200 transition-colors cursor-pointer"
          >
            Hard (Review Soon)
          </button>
          <button
            onClick={() => handleRateDifficulty('Medium')}
            className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition-colors cursor-pointer"
          >
            Medium
          </button>
          <button
            onClick={() => handleRateDifficulty('Easy')}
            className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer"
          >
            Easy (Mastered)
          </button>
        </div>
      </div>
    </div>
  );
}
