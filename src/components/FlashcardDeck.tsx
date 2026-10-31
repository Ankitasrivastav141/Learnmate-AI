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
} from 'lucide-react';

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  difficulty: string;
  topic?: { title: string } | null;
  reviewCount?: number;
  correctCount?: number;
}

interface FlashcardDeckProps {
  cards: FlashcardItem[];
}

export function FlashcardDeck({ cards: initialCards }: FlashcardDeckProps) {
  const [cards, setCards] = useState<FlashcardItem[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);

  if (!cards || cards.length === 0) {
    return (
      <div className="bg-white border border-[#E5DCD0] rounded-2xl p-12 text-center shadow-sm">
        <Sparkles className="w-8 h-8 text-[#B58B83] mx-auto mb-3" />
        <h4 className="text-base font-semibold text-[#252222]">No Flashcards Available</h4>
        <p className="text-xs text-[#6E5D59] mt-1 max-w-sm mx-auto">
          Upload a study document to automatically generate topic-wise flashcards.
        </p>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const shuffled = [...cards].sort(() => 0.5 - Math.random());
    setCards(shuffled);
    setCurrentIndex(0);
  };

  const handleReview = async (remembered: boolean) => {
    if (remembered) {
      setMasteredCount((prev) => prev + 1);
    }

    try {
      await fetch(`/api/flashcards/${currentCard.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remembered }),
      });
    } catch (err) {
      console.error('Failed to log flashcard review:', err);
    }

    handleNext();
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'hard':
        return 'bg-[#652D3D]/10 text-[#652D3D] border-[#652D3D]/20';
      default:
        return 'bg-[#FAF7F2] text-[#6E5D59] border-[#E5DCD0]';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Deck Stats & Controls */}
      <div className="flex items-center justify-between text-xs text-[#6E5D59]">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#252222]">
            Card {currentIndex + 1} of {cards.length}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E5DCD0] text-[#252222] font-mono">
            {masteredCount} Mastered
          </span>
        </div>
        <button
          onClick={handleShuffle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF7F2] text-[#252222] border border-[#DED4C7] transition-colors cursor-pointer shadow-sm"
        >
          <Shuffle className="w-3.5 h-3.5 text-[#652D3D]" />
          Shuffle
        </button>
      </div>

      {/* 3D Flip Card */}
      <div
        onClick={handleFlip}
        className="w-full h-80 cursor-pointer select-none perspective-1000 group"
      >
        <div
          className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT */}
          <div className="absolute inset-0 backface-hidden bg-white border-2 border-[#E5DCD0] rounded-2xl p-8 flex flex-col justify-between shadow-sm group-hover:border-[#B58B83] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold tracking-wider text-[#652D3D] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#B58B83]" />
                Prompt / Question
              </span>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${getDifficultyBadge(
                  currentCard.difficulty
                )}`}
              >
                {currentCard.difficulty}
              </span>
            </div>

            <div className="my-auto text-center px-4">
              <h3 className="text-lg md:text-xl font-bold text-[#252222] leading-relaxed">
                {currentCard.front}
              </h3>
            </div>

            <div className="flex items-center justify-between text-xs text-[#6E5D59] pt-4 border-t border-[#E5DCD0]">
              <span>{currentCard.topic?.title || 'General Concept'}</span>
              <span className="flex items-center gap-1 text-[#652D3D] font-medium">
                <RotateCcw className="w-3 h-3" /> Click card to flip
              </span>
            </div>
          </div>

          {/* BACK */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-[#FFFDF9] to-[#FAF7F2] border-2 border-[#652D3D]/50 rounded-2xl p-8 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold tracking-wider text-[#652D3D] flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Explanation / Answer
              </span>
              <span className="text-[11px] text-[#6E5D59]">Grounded in material</span>
            </div>

            <div className="my-auto text-center px-4 overflow-y-auto max-h-44">
              <p className="text-base md:text-lg font-medium text-[#252222] leading-relaxed">
                {currentCard.back}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-[#6E5D59] pt-4 border-t border-[#E5DCD0]">
              <span>Tap again to flip back</span>
              <span className="text-[#652D3D] font-semibold">Verify your memory</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spaced-Repetition Feedback Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleReview(false)}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-all font-semibold text-sm cursor-pointer shadow-sm"
        >
          <XCircle className="w-4 h-4 text-rose-600" />
          Need Practice
        </button>

        <button
          onClick={() => handleReview(true)}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all font-semibold text-sm cursor-pointer shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Mastered It
        </button>
      </div>

      {/* Navigation Arrow Controls */}
      <div className="flex items-center justify-center gap-6 pt-2">
        <button
          onClick={handlePrev}
          className="p-2.5 rounded-full bg-white hover:bg-[#FAF7F2] text-[#252222] border border-[#DED4C7] transition-colors cursor-pointer shadow-sm"
          aria-label="Previous card"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-xs text-[#6E5D59] font-medium">
          Use buttons or click card to flip
        </span>

        <button
          onClick={handleNext}
          className="p-2.5 rounded-full bg-white hover:bg-[#FAF7F2] text-[#252222] border border-[#DED4C7] transition-colors cursor-pointer shadow-sm"
          aria-label="Next card"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
