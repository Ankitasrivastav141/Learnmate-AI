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
  AlertTriangle,
  FileText,
  Filter,
} from 'lucide-react';

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  difficulty: string;
  topic: string;
  documentTitle?: string;
}

interface QuizRunnerProps {
  sessionId: string;
  quizTitle: string;
  questions: QuizQuestion[];
  onComplete?: () => void;
  onRetake?: () => void;
}

export interface AnswerResult {
  questionId: string;
  questionText: string;
  options?: string[];
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  difficulty?: string;
  topic: string;
  documentTitle?: string;
}

export function QuizRunner({
  sessionId,
  quizTitle,
  questions,
  onComplete,
  onRetake,
}: QuizRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [filterIncorrectOnly, setFilterIncorrectOnly] = useState(false);
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
  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim().length > 0).length;
  const unansweredCount = totalQuestions - answeredCount;
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

  const handleAttemptSubmit = () => {
    if (unansweredCount > 0) {
      setShowConfirmSubmit(true);
    } else {
      executeSubmit();
    }
  };

  const executeSubmit = async () => {
    setShowConfirmSubmit(false);
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
      alert('Could not submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ================= RESULTS VIEW =================
  if (results) {
    const isPassing = results.scorePercentage >= 70;
    const displayedDetails = filterIncorrectOnly
      ? results.details.filter((d) => !d.isCorrect)
      : results.details;

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Score Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 text-center shadow-sm">
          <div
            className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
              isPassing
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            <Award className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Quiz Results</h2>
          <p className="text-sm text-slate-600 mt-1">{quizTitle}</p>

          <div className="flex items-center justify-center gap-6 md:gap-12 my-6">
            <div className="text-center">
              <span
                className={`text-3xl font-extrabold ${
                  isPassing ? 'text-emerald-700' : 'text-slate-900'
                }`}
              >
                {results.scorePercentage}%
              </span>
              <p className="text-xs text-slate-500 uppercase font-medium mt-1">Accuracy</p>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div className="text-center">
              <span className="text-3xl font-extrabold text-slate-900">
                {results.correctAnswers} / {results.totalQuestions}
              </span>
              <p className="text-xs text-slate-500 uppercase font-medium mt-1">Correct Answers</p>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div className="text-center">
              <span className="text-3xl font-extrabold text-blue-600 font-mono">
                {formatTimer(results.timeSpentSeconds)}
              </span>
              <p className="text-xs text-slate-500 uppercase font-medium mt-1">Time Taken</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                if (onRetake) {
                  onRetake();
                } else {
                  window.location.reload();
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Retake Quiz (New Attempt)
            </button>
            <a
              href="/analytics"
              className="px-5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors"
            >
              View Performance Analytics
            </a>
          </div>
        </div>

        {/* Question Breakdown with Grounded Explanations */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Question-by-Question Review & Explanations
              </h3>
              <p className="text-xs text-slate-500">
                Review your answers with citations and rationales grounded in the source material.
              </p>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterIncorrectOnly(false)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  !filterIncorrectOnly
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({results.details.length})
              </button>
              <button
                onClick={() => setFilterIncorrectOnly(true)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  filterIncorrectOnly
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                <Filter className="w-3 h-3" />
                Review Mistakes ({results.details.filter((d) => !d.isCorrect).length})
              </button>
            </div>
          </div>

          {displayedDetails.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-800">Perfect Score! No Incorrect Answers</h4>
              <p className="text-xs text-slate-500 mt-1">You answered every question correctly in this session.</p>
            </div>
          ) : (
            displayedDetails.map((detail, idx) => (
              <div
                key={detail.questionId}
                className={`border rounded-xl p-5 space-y-3 bg-white ${
                  detail.isCorrect ? 'border-emerald-200 bg-emerald-50/20' : 'border-red-200 bg-red-50/20'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200">
                      Q{idx + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {detail.topic}
                    </span>
                    {detail.documentTitle && (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {detail.documentTitle}
                      </span>
                    )}
                  </div>
                  {detail.isCorrect ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
                      <XCircle className="w-3.5 h-3.5" /> Incorrect
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                  {detail.questionText}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                  <div
                    className={`p-3 rounded-lg border ${
                      detail.isCorrect
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-900'
                    }`}
                  >
                    <span className="font-bold block text-[11px] uppercase tracking-wider mb-1 opacity-75">
                      Your Answer:
                    </span>
                    <span className="font-semibold text-sm">
                      {detail.selectedAnswer || '(Left Blank)'}
                    </span>
                  </div>

                  {!detail.isCorrect && (
                    <div className="p-3 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-900">
                      <span className="font-bold block text-[11px] uppercase tracking-wider mb-1 opacity-75">
                        Correct Answer:
                      </span>
                      <span className="font-semibold text-sm">{detail.correctAnswer}</span>
                    </div>
                  )}
                </div>

                {/* Explanation */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-1">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    💡 Explanation & Concept Rationale:
                  </span>
                  <p className="leading-relaxed text-slate-700">{detail.explanation}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ================= ACTIVE QUIZ RUNNER VIEW =================
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Bar: Progress & Timer */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            {currentQ.topic || 'Academic Quiz'}
          </span>
          <h2 className="text-base font-bold text-slate-900">{quizTitle}</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl text-slate-700 text-xs font-mono font-bold">
            <Timer className="w-4 h-4 text-blue-600" />
            <span>{formatTimer(timerSeconds)}</span>
          </div>
          <button
            onClick={handleAttemptSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
              </span>
            ) : (
              'Submit Quiz'
            )}
          </button>
        </div>
      </div>

      {/* Question Navigation Bar (1 to N) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-semibold text-slate-700">
            Question Navigator: {currentIndex + 1} of {totalQuestions}
          </span>
          <span className="text-slate-500 font-medium">
            {answeredCount} of {totalQuestions} Answered
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {questions.map((q, idx) => {
            const hasAnswer = Boolean(answers[q.id]?.trim());
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-9 h-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2'
                    : hasAnswer
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
                title={`Question ${idx + 1}${hasAnswer ? ' (Answered)' : ' (Not answered)'}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Progress Line */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Active Question Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
          <span className="font-semibold text-slate-700">Question {currentIndex + 1}</span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
              Difficulty: {currentQ.difficulty || 'Medium'}
            </span>
            {currentQ.documentTitle && (
              <span className="truncate max-w-[200px] text-slate-400">
                {currentQ.documentTitle}
              </span>
            )}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 leading-relaxed">
          {currentQ.questionText}
        </h3>

        {/* Options */}
        <div className="space-y-3 pt-2">
          {currentQ.options.map((opt, oIdx) => {
            const isSelected = answers[currentQ.id] === opt;
            const optionLetter = String.fromCharCode(65 + oIdx);

            return (
              <button
                key={oIdx}
                onClick={() => handleSelectOption(opt)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600 shadow-sm'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 bg-white'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {optionLetter}
                </div>
                <span className="text-sm text-slate-800 leading-snug flex-1 font-medium">
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {/* Question Footer: Prev / Next / Submit */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:hover:text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Previous
          </button>

          <div className="flex items-center gap-2">
            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleAttemptSubmit}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                Finish & Submit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Unanswered Questions */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-base text-slate-900">Unanswered Questions</h4>
              <p className="text-xs text-slate-600 mt-1">
                You have <strong className="text-amber-600">{unansweredCount}</strong> unanswered question{unansweredCount > 1 ? 's' : ''}. Unanswered questions will be counted as incorrect.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Go Back
              </button>
              <button
                onClick={executeSubmit}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
