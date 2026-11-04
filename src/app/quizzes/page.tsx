'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  GraduationCap,
  Sparkles,
  Award,
  Clock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileText,
  BookOpen,
  ArrowRight,
  Loader2,
  Play,
  Trash2,
  Filter,
  Eye,
  Sliders,
  X,
} from 'lucide-react';
import { QuizRunner } from '@/components/QuizRunner';
import { formatDate } from '@/lib/utils';

interface QuizSessionItem {
  id: string;
  title: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  timeSpentSeconds: number;
  completedAt: string;
  subject?: { id: string; name: string; color: string } | null;
  document?: { id: string; title: string } | null;
}

interface HistoricalReviewData {
  id: string;
  title: string;
  subjectName?: string;
  documentTitle?: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  timeSpentSeconds: number;
  completedAt: string;
  answers: Array<{
    id: string;
    questionId: string;
    questionText: string;
    options: string[];
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
    difficulty: string;
    topic: string;
    documentTitle: string;
  }>;
}

function QuizzesContent() {
  const searchParams = useSearchParams();
  const preselectedSubjectId = searchParams.get('subjectId');
  const preselectedDocId = searchParams.get('documentId');
  const urlReviewId = searchParams.get('reviewId');

  const [history, setHistory] = useState<QuizSessionItem[]>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [documents, setDocuments] = useState<Array<{ id: string; title: string; subjectId: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quiz Launcher configuration
  const [selectedSubjectId, setSelectedSubjectId] = useState(preselectedSubjectId || 'ALL');
  const [selectedDocId, setSelectedDocId] = useState(preselectedDocId || 'ALL');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<string>('Mixed');
  const [isLaunching, setIsLaunching] = useState(false);

  // Active quiz session runner
  const [activeSession, setActiveSession] = useState<{
    sessionId: string;
    title: string;
    questions: any[];
  } | null>(null);

  // Historical Quiz Review state
  const [reviewModalData, setReviewModalData] = useState<HistoricalReviewData | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [reviewMistakesOnly, setReviewMistakesOnly] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/quizzes', { cache: 'no-store' }).then((res) => res.json()),
      fetch('/api/subjects', { cache: 'no-store' }).then((res) => res.json()),
      fetch('/api/documents', { cache: 'no-store' }).then((res) => res.json()),
    ])
      .then(([historyData, subjectsData, docsData]) => {
        if (Array.isArray(historyData)) setHistory(historyData);
        if (Array.isArray(subjectsData)) setSubjects(subjectsData);
        if (Array.isArray(docsData)) setDocuments(docsData);
      })
      .catch((err) => console.error('Failed to load quiz center data:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open review if reviewId passed in query
  useEffect(() => {
    if (urlReviewId) {
      openHistoricalReview(urlReviewId);
    }
  }, [urlReviewId]);

  const handleStartQuiz = async (customSubjectId?: string, customDocId?: string) => {
    setIsLaunching(true);
    try {
      const targetSubId = customSubjectId || selectedSubjectId;
      const targetDocId = customDocId || selectedDocId;

      const payload: {
        subjectId?: string;
        documentId?: string;
        questionCount: number;
        difficulty: string;
      } = {
        questionCount,
        difficulty,
      };

      if (targetDocId && targetDocId !== 'ALL') {
        payload.documentId = targetDocId;
      } else if (targetSubId && targetSubId !== 'ALL') {
        payload.subjectId = targetSubId;
      }

      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to start quiz');
        return;
      }

      setReviewModalData(null);
      setActiveSession({
        sessionId: data.sessionId,
        title: data.title,
        questions: data.questions,
      });
    } catch (err) {
      console.error('Error starting quiz:', err);
      alert('Failed to launch practice quiz.');
    } finally {
      setIsLaunching(false);
    }
  };

  const openHistoricalReview = async (sessionId: string) => {
    setIsLoadingReview(true);
    try {
      const res = await fetch(`/api/quizzes/${sessionId}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load quiz review');
      }
      setReviewModalData(data);
      setReviewMistakesOnly(false);
    } catch (err) {
      console.error('Error fetching past quiz:', err);
      alert('Could not load historical review for this quiz.');
    } finally {
      setIsLoadingReview(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this quiz record?')) return;

    try {
      const res = await fetch(`/api/quizzes/${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== sessionId));
        if (reviewModalData?.id === sessionId) {
          setReviewModalData(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const filteredDocs =
    selectedSubjectId === 'ALL'
      ? documents
      : documents.filter((d) => d.subjectId === selectedSubjectId);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // If active quiz is running
  if (activeSession) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            if (confirm('Exit quiz? Any unsaved progress will be lost.')) {
              setActiveSession(null);
              loadData();
            }
          }}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
        >
          ← Exit to Quiz Center
        </button>

        <QuizRunner
          sessionId={activeSession.sessionId}
          quizTitle={activeSession.title}
          questions={activeSession.questions}
          onComplete={() => {
            loadData();
          }}
          onRetake={() => {
            handleStartQuiz();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            Practice & Quiz Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Grounded assessment system with question navigation, slide citations, and persistent mistake review.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/analytics"
            className="px-4 py-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Award className="w-4 h-4 text-amber-500" /> View Quiz Analytics
          </Link>
        </div>
      </div>

      {/* 2. Interactive Quiz Launcher Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Sliders className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Configure Practice Quiz</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Target Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Subject Filter
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedDocId('ALL');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
            >
              <option value="ALL">All Subjects (Comprehensive)</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Document */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Document Scope
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
            >
              <option value="ALL">All Documents in Scope</option>
              {filteredDocs.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title}
                </option>
              ))}
            </select>
          </div>

          {/* Question Count: 5, 10, 15, 20 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Number of Questions
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionCount(num)}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    questionCount === num
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty: Easy, Medium, Hard, Mixed */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Difficulty Level
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {['Easy', 'Medium', 'Hard', 'Mixed'].map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    difficulty === diff
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Questions are generated strictly from uploaded lecture slides and reference notes.
          </p>
          <button
            onClick={() => handleStartQuiz()}
            disabled={isLaunching}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
          >
            {isLaunching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Preparing Quiz...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Start Practice Quiz ({questionCount} Questions)
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Persistent Quiz History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Saved Quiz History
            </h2>
            <p className="text-xs text-slate-500">
              Permanent snapshot of all your past attempts and answer evaluations stored in database.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
            {history.length} Attempt{history.length === 1 ? '' : 's'}
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-xs">Loading past quiz attempts...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-10 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
            <GraduationCap className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="font-semibold text-sm text-slate-800">No Quiz Attempts Yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Configure and start a quiz above to begin tracking your exam readiness.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] bg-slate-50/50">
                  <th className="py-3 px-3 font-semibold">Quiz Title & Scope</th>
                  <th className="py-3 px-3 font-semibold">Subject</th>
                  <th className="py-3 px-3 font-semibold">Completed Date</th>
                  <th className="py-3 px-3 font-semibold">Score / Accuracy</th>
                  <th className="py-3 px-3 font-semibold">Time Spent</th>
                  <th className="py-3 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((session) => {
                  const isPassing = session.scorePercentage >= 70;
                  return (
                    <tr
                      key={session.id}
                      onClick={() => openHistoricalReview(session.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {session.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {session.document?.title || 'Comprehensive Subject Review'}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold text-white"
                          style={{ backgroundColor: session.subject?.color || '#2563EB' }}
                        >
                          {session.subject?.name || 'General'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        {formatDate(session.completedAt)}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              isPassing
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {session.scorePercentage}%
                          </span>
                          <span className="text-slate-500">
                            ({session.correctAnswers}/{session.totalQuestions})
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-600 font-mono">
                        {formatTimer(session.timeSpentSeconds)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openHistoricalReview(session.id);
                            }}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> Full Review
                          </button>
                          <button
                            onClick={(e) => handleDeleteSession(e, session.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete attempt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Full Historical Review Modal / Slide-out */}
      {reviewModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-bold">
                    Historical Snapshot (Zero AI Calls)
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDate(reviewModalData.completedAt)}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mt-1">
                  {reviewModalData.title}
                </h3>
              </div>

              <button
                onClick={() => setReviewModalData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Strip */}
            <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-xs text-slate-500">Score:</span>
                  <span
                    className={`ml-1.5 font-bold text-sm ${
                      reviewModalData.scorePercentage >= 70
                        ? 'text-emerald-700'
                        : 'text-red-700'
                    }`}
                  >
                    {reviewModalData.scorePercentage}% ({reviewModalData.correctAnswers}/
                    {reviewModalData.totalQuestions})
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Time Taken:</span>
                  <span className="ml-1.5 font-bold text-sm text-slate-800 font-mono">
                    {formatTimer(reviewModalData.timeSpentSeconds)}
                  </span>
                </div>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReviewMistakesOnly(false)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    !reviewMistakesOnly
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Questions ({reviewModalData.answers.length})
                </button>
                <button
                  onClick={() => setReviewMistakesOnly(true)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                    reviewMistakesOnly
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  <Filter className="w-3 h-3" /> Mistakes Only (
                  {reviewModalData.answers.filter((a) => !a.isCorrect).length})
                </button>
              </div>
            </div>

            {/* Questions Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {(reviewMistakesOnly
                ? reviewModalData.answers.filter((a) => !a.isCorrect)
                : reviewModalData.answers
              ).map((ans, idx) => (
                <div
                  key={ans.id}
                  className={`border rounded-xl p-4 space-y-3 ${
                    ans.isCorrect
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-red-200 bg-red-50/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200">
                        Q{idx + 1}
                      </span>
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {ans.topic}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Citation: {ans.documentTitle}
                      </span>
                    </div>

                    {ans.isCorrect ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {ans.questionText}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div
                      className={`p-3 rounded-lg border ${
                        ans.isCorrect
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-red-50 border-red-200 text-red-900'
                      }`}
                    >
                      <span className="font-bold block text-[10px] uppercase opacity-75">
                        Your Answer:
                      </span>
                      <span className="font-semibold text-sm">{ans.selectedAnswer || '(Blank)'}</span>
                    </div>

                    {!ans.isCorrect && (
                      <div className="p-3 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-900">
                        <span className="font-bold block text-[10px] uppercase opacity-75">
                          Correct Answer:
                        </span>
                        <span className="font-semibold text-sm">{ans.correctAnswer}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 space-y-1">
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      💡 Explanation & Concept Rationale:
                    </span>
                    <p className="leading-relaxed text-slate-700">{ans.explanation}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Quiz attempt stored permanently in your personal LMS.
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setReviewModalData(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleStartQuiz(
                      (reviewModalData as any).subjectId,
                      (reviewModalData as any).documentId
                    );
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retake This Quiz (New Attempt)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuizzesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-xs">Loading Quiz Center...</p>
        </div>
      }
    >
      <QuizzesContent />
    </Suspense>
  );
}
