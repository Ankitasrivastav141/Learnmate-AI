'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Timer,
  Award,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ChevronRight,
} from 'lucide-react';

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  difficulty: string;
  topic: string;
}

interface QuizRunnerProps {
  sessionId: string;
  quizTitle: string;
  questions: QuizQuestion[];
  onComplete?: () => void;
}

interface AnswerResult {
  questionId: string;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  topic: string;
}

export function QuizRunner({ sessionId, quizTitle, questions, onComplete }: QuizRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{
    scorePercentage: number;
    correctAnswers: number;
    totalQuestions: number;
    timeSpentSeconds: number;
    details: AnswerResult[];
  } | null>(null);

  // Timer
  useEffect(() => {
    if (results) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [results]);

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const handleSelectOption = (option: string) => {
    if (results) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: option,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/quizzes/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          timeSpentSeconds: timerSeconds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setResults({
        scorePercentage: data.score.percentage,
        correctAnswers: data.score.correct,
        totalQuestions: data.score.total,
        timeSpentSeconds: data.score.timeSpentSeconds,
        details: data.results,
      });

      if (onComplete) onComplete();
    } catch (err) {
      console.error('Error submitting quiz:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // RESULTS VIEW
  if (results) {
    const isPassing = results.scorePercentage >= 70;
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Score Card */}
        <div className="bg-white border border-[#E5DCD0] rounded-2xl p-8 text-center shadow-sm">
          <div
            className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
              isPassing
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-[#652D3D]/10 text-[#652D3D] border border-[#652D3D]/20'
            }`}
          >
            <Award className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-[#252222] tracking-tight">Quiz Completed!</h2>
          <p className="text-sm text-[#6E5D59] mt-1">{quizTitle}</p>

          <div className="flex items-center justify-center gap-8 my-6">
            <div className="text-center">
              <span className="text-3xl font-extrabold text-[#252222]">
                {results.scorePercentage}%
              </span>
              <p className="text-xs text-[#6E5D59] uppercase font-medium mt-1">Accuracy</p>
            </div>
            <div className="h-10 w-px bg-[#E5DCD0]" />
            <div className="text-center">
              <span className="text-3xl font-extrabold text-[#252222]">
                {results.correctAnswers} / {results.totalQuestions}
              </span>
              <p className="text-xs text-[#6E5D59] uppercase font-medium mt-1">Correct Answers</p>
            </div>
            <div className="h-10 w-px bg-[#E5DCD0]" />
            <div className="text-center">
              <span className="text-3xl font-extrabold text-[#652D3D] font-mono">
                {formatTimer(results.timeSpentSeconds)}
              </span>
              <p className="text-xs text-[#6E5D59] uppercase font-medium mt-1">Time Taken</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-[#652D3D] hover:bg-[#7b374a] text-[#F3EDE3] font-semibold text-xs flex items-center gap-2 shadow-md shadow-[#652D3D]/20 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Retake / New Quiz
            </button>
            <a
              href="/analytics"
              className="px-5 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EDE3] text-[#252222] font-semibold text-xs border border-[#DED4C7] transition-colors"
            >
              View Analytics
            </a>
          </div>
        </div>

        {/* Question Breakdown with Grounded Explanations */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-[#252222] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#B58B83]" />
            Detailed Review & Explanations
          </h3>

          {results.details.map((detail, idx) => (
            <div
              key={detail.questionId}
              className={`border rounded-xl p-5 space-y-3 ${
                detail.isCorrect
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-[#652D3D]/5 border-[#652D3D]/20'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white text-[#252222] border border-[#E5DCD0]">
                    Q{idx + 1}
                  </span>
                  <span className="text-xs text-[#6E5D59]">{detail.topic}</span>
                </div>
                {detail.isCorrect ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" /> Correct (+1)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-semibold text-[#652D3D]">
                    <XCircle className="w-4 h-4" /> Incorrect
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-[#252222]">{detail.questionText}</p>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[#6E5D59]">Your Answer:</span>
                  <span
                    className={`font-semibold ${
                      detail.isCorrect ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {detail.selectedAnswer || '(Unanswered)'}
                  </span>
                </div>
                {!detail.isCorrect && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#6E5D59]">Correct Answer:</span>
                    <span className="font-semibold text-emerald-700">{detail.correctAnswer}</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#E5DCD0] text-xs text-[#252222] space-y-1">
                <span className="font-semibold text-[#652D3D] flex items-center gap-1">
                  💡 Explanation & Source Rationale:
                </span>
                <p className="leading-relaxed text-[#4F4240]">{detail.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ACTIVE QUIZ RUNNER
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Quiz Header */}
      <div className="bg-white border border-[#E5DCD0] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#252222]">{quizTitle}</h2>
            <p className="text-xs text-[#6E5D59]">
              Question {currentIndex + 1} of {totalQuestions}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E5DCD0] text-xs font-mono text-[#252222]">
              <Timer className="w-3.5 h-3.5 text-[#652D3D]" />
              {formatTimer(timerSeconds)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#F3EDE3] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#652D3D] h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Active Question Box */}
      <div className="bg-white border border-[#E5DCD0] rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs px-2.5 py-1 rounded-md bg-[#652D3D]/10 text-[#652D3D] border border-[#652D3D]/20 font-medium">
            {currentQ.topic || 'Core Subject'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-[#FAF7F2] text-[#6E5D59] font-mono border border-[#E5DCD0]">
            {currentQ.difficulty || 'Medium'}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-[#252222] leading-relaxed">
          {currentQ.questionText}
        </h3>

        {/* 4 Options Grid */}
        <div className="space-y-3">
          {currentQ.options.map((option, idx) => {
            const isSelected = answers[currentQ.id] === option;
            const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(option)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#652D3D]/10 border-[#652D3D] text-[#652D3D] font-medium shadow-sm'
                    : 'bg-[#FAF7F2] border-[#E5DCD0] text-[#252222] hover:border-[#B58B83] hover:bg-white'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-[#652D3D] text-[#F3EDE3]'
                      : 'bg-white text-[#6E5D59] border border-[#DED4C7]'
                  }`}
                >
                  {optionLetter}
                </span>
                <span className="text-sm font-normal pt-0.5 leading-snug">{option}</span>
              </button>
            );
          })}
        </div>

        {/* Navigation & Submit */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E5DCD0]">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-[#6E5D59] hover:text-[#252222] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Previous
          </button>

          <div className="flex items-center gap-3">
            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-[#FAF7F2] hover:bg-[#F3EDE3] text-[#252222] border border-[#DED4C7] transition-colors cursor-pointer"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting || answeredCount === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold bg-[#652D3D] hover:bg-[#7b374a] text-[#F3EDE3] shadow-md shadow-[#652D3D]/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Submit Quiz ({answeredCount}/{totalQuestions})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
