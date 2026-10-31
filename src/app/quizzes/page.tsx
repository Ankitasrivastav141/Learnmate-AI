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
  FileText,
  BookOpen,
  ArrowRight,
  Loader2,
  Play,
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

function QuizzesContent() {
  const searchParams = useSearchParams();
  const preselectedSubjectId = searchParams.get('subjectId');
  const preselectedDocId = searchParams.get('documentId');

  const [history, setHistory] = useState<QuizSessionItem[]>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [documents, setDocuments] = useState<Array<{ id: string; title: string; subjectId: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New quiz launcher configuration
  const [selectedSubjectId, setSelectedSubjectId] = useState(preselectedSubjectId || 'ALL');
  const [selectedDocId, setSelectedDocId] = useState(preselectedDocId || 'ALL');
  const [isLaunching, setIsLaunching] = useState(false);
  const [activeSession, setActiveSession] = useState<{
    sessionId: string;
    title: string;
    questions: any[];
  } | null>(null);

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/quizzes').then((res) => res.json()),
      fetch('/api/subjects').then((res) => res.json()),
      fetch('/api/documents').then((res) => res.json()),
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

  const handleStartQuiz = async () => {
    setIsLaunching(true);
    try {
      const payload: { subjectId?: string; documentId?: string; questionCount: number } = {
        questionCount: 10,
      };

      if (selectedDocId !== 'ALL') {
        payload.documentId = selectedDocId;
      } else if (selectedSubjectId !== 'ALL') {
        payload.subjectId = selectedSubjectId;
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

      setActiveSession({
        sessionId: data.sessionId,
        title: data.title,
        questions: data.questions,
      });
    } catch (err) {
      console.error('Quiz start failed:', err);
    } finally {
      setIsLaunching(false);
    }
  };

  // Filter documents by selected subject
  const availableDocs =
    selectedSubjectId === 'ALL'
      ? documents
      : documents.filter((d) => d.subjectId === selectedSubjectId);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#252222] tracking-tight">Quiz Assessment Center</h1>
        <p className="text-xs text-[#6E5D59] mt-1">
          Take 10-question practice sets, test your academic recall, and review grounded explanations
        </p>
      </div>

      {/* ACTIVE QUIZ RUNNER SCREEN */}
      {activeSession ? (
        <div className="space-y-4">
          <button
            onClick={() => {
              setActiveSession(null);
              loadData();
            }}
            className="text-xs text-[#6E5D59] hover:text-[#252222] flex items-center gap-1.5 cursor-pointer font-medium"
          >
            ← Exit Quiz Runner
          </button>
          <QuizRunner
            sessionId={activeSession.sessionId}
            quizTitle={activeSession.title}
            questions={activeSession.questions}
            onComplete={loadData}
          />
        </div>
      ) : (
        <>
          {/* Quick Quiz Launch Card */}
          <div className="bg-gradient-to-r from-[#F3EDE3] via-[#FAF7F2] to-white border border-[#E5DCD0] rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#652D3D]/10 border border-[#652D3D]/20 flex items-center justify-center text-[#652D3D]">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#252222]">Generate 10-Question Practice Set</h2>
                <p className="text-xs text-[#6E5D59]">
                  Select a specific document or entire subject to generate a fresh randomized exam
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#652D3D] mb-1.5">
                  Select Subject
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setSelectedDocId('ALL');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DED4C7] text-[#252222] text-xs focus:outline-none focus:border-[#652D3D] shadow-sm"
                >
                  <option value="ALL">All Subjects (Comprehensive Quiz)</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#652D3D] mb-1.5">
                  Select Specific Document (Optional)
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DED4C7] text-[#252222] text-xs focus:outline-none focus:border-[#652D3D] shadow-sm"
                >
                  <option value="ALL">All Documents in Selection</option>
                  {availableDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#E5DCD0]">
              <span className="text-xs text-[#6E5D59] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#652D3D]" />
                4 choices per MCQ with complete grounded source explanations
              </span>

              <button
                onClick={handleStartQuiz}
                disabled={isLaunching || (subjects.length === 0 && documents.length === 0)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#652D3D] hover:bg-[#7b374a] text-[#F3EDE3] font-semibold text-xs shadow-md shadow-[#652D3D]/20 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
              >
                {isLaunching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Preparing Questions...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-[#F3EDE3]" /> Start 10-Question Quiz
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quiz History Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#252222]">Quiz History & Review</h2>
                <p className="text-xs text-[#6E5D59]">Past attempts, scores, and completion times</p>
              </div>
            </div>

            {history.length > 0 ? (
              <div className="bg-white border border-[#E5DCD0] rounded-2xl divide-y divide-[#EFE7DD] overflow-hidden shadow-sm">
                {history.map((session) => (
                  <div
                    key={session.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF7F2]/60 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-sm text-[#252222]">
                          {session.title}
                        </span>
                        {session.subject && (
                          <span
                            className="text-[11px] px-2 py-0.5 rounded-full border"
                            style={{
                              borderColor: `${session.subject.color}40`,
                              color: session.subject.color,
                              backgroundColor: `${session.subject.color}15`,
                            }}
                          >
                            {session.subject.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-[#6E5D59]">
                        <span>
                          {session.correctAnswers} of {session.totalQuestions} correct
                        </span>
                        <span>•</span>
                        <span>
                          {Math.floor(session.timeSpentSeconds / 60)}m {session.timeSpentSeconds % 60}s
                        </span>
                        <span>•</span>
                        <span>{formatDate(session.completedAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <span
                        className={`text-base font-bold font-mono px-3 py-1 rounded-xl border ${
                          session.scorePercentage >= 70
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-[#652D3D] bg-[#652D3D]/10 border-[#652D3D]/20'
                        }`}
                      >
                        {Math.round(session.scorePercentage)}%
                      </span>

                      <button
                        onClick={handleStartQuiz}
                        className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EDE3] text-[#252222] border border-[#DED4C7] transition-colors cursor-pointer shadow-sm"
                        title="Retake fresh quiz"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-[#E5DCD0] rounded-2xl p-12 text-center space-y-3 shadow-sm">
                <GraduationCap className="w-10 h-10 text-[#B58B83] mx-auto" />
                <h3 className="text-sm font-semibold text-[#252222]">No Quizzes Taken Yet</h3>
                <p className="text-xs text-[#6E5D59] max-w-sm mx-auto">
                  Launch your first 10-question practice test above to evaluate your comprehension.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function QuizzesCenterPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          <span>Loading Quiz Assessment Center...</span>
        </div>
      }
    >
      <QuizzesContent />
    </Suspense>
  );
}
