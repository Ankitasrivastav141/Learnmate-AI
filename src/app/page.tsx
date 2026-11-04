'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  FileText,
  GraduationCap,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  Layers,
  Plus,
  Upload,
  BrainCircuit,
  CheckCircle2,
  Calendar,
  BarChart3,
  Flame,
} from 'lucide-react';
import { MetricsCard } from '@/components/MetricsCard';
import { DocumentUploadModal } from '@/components/DocumentUploadModal';
import { CreateSubjectModal } from '@/components/CreateSubjectModal';
import { formatRelativeTime } from '@/lib/utils';

interface AnalyticsData {
  summary: {
    totalSubjects: number;
    totalDocuments: number;
    totalFlashcards: number;
    completedQuizzesCount: number;
    averageScore: number;
    totalStudySessions: number;
    topicsCompleted: number;
  };
  continueLearning: Array<{
    id: string;
    name: string;
    color: string;
    description: string | null;
    documentsCount: number;
    quizzesCompleted: number;
    averageScore: number;
    latestDocument: string | null;
    lastActivity: string | null;
  }>;
  recommendations: Array<{
    topicId: string;
    topicTitle: string;
    subjectId: string;
    documentId: string;
    documentTitle: string;
    accuracy: number;
    reason: string;
  }>;
  weeklyProgress: Array<{
    day: string;
    minutes: number;
    quizzes: number;
  }>;
  scoreTrend: Array<{ date: string; score: number; title: string }>;
  subjectPerformance: Array<{
    id: string;
    name: string;
    color: string;
    documentsCount: number;
    quizzesCompleted: number;
    averageScore: number;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
    subject?: { name: string; color: string } | null;
  }>;
  recentDocuments: Array<{
    id: string;
    title: string;
    subjectName?: string;
    subjectColor?: string;
    createdAt: string;
  }>;
  recentNotes: Array<{
    id: string;
    title: string;
    documentTitle?: string;
    createdAt: string;
  }>;
  recentQuizzes: Array<{
    id: string;
    title: string;
    scorePercentage: number;
    subjectName?: string;
    completedAt: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);

  const fetchDashboardData = () => {
    setIsLoading(true);
    fetch('/api/analytics', { cache: 'no-store' })
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
      })
      .catch((err) => console.error('Failed to load dashboard data:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const summary = data?.summary || {
    totalSubjects: 0,
    totalDocuments: 0,
    totalFlashcards: 0,
    completedQuizzesCount: 0,
    averageScore: 0,
    totalStudySessions: 0,
    topicsCompleted: 0,
  };

  const maxWeeklyMinutes = Math.max(
    ...(data?.weeklyProgress?.map((w) => w.minutes) || [30]),
    30
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Header & Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-navy to-slate-900 p-6 md:p-8 text-white shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            AI-Powered Academic Intelligence
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome to LearnMate AI
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Your personal learning workspace. Organize subjects, convert lecture presentations into comprehensive study packs, master key concepts, and practise grounded quizzes with mistake analysis.
          </p>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-900/30 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload Study Material
            </button>
            <button
              onClick={() => setIsCreateSubjectOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Subject
            </button>
            <Link
              href="/quizzes"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-all"
            >
              <GraduationCap className="w-4 h-4" />
              Start Practice Quiz
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* 2. Overview Statistics (6 metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricsCard
          title="Total Subjects"
          value={summary.totalSubjects}
          subtitle="Enrolled courses"
          icon={<BookOpen className="w-5 h-5" />}
          color="#2563EB"
        />
        <MetricsCard
          title="Study Documents"
          value={summary.totalDocuments}
          subtitle="Processed slides & docs"
          icon={<FileText className="w-5 h-5" />}
          color="#0F766E"
        />
        <MetricsCard
          title="Quizzes Done"
          value={summary.completedQuizzesCount}
          subtitle="Completed sessions"
          icon={<GraduationCap className="w-5 h-5" />}
          color="#4F46E5"
        />
        <MetricsCard
          title="Average Score"
          value={summary.averageScore ? `${summary.averageScore}%` : 'N/A'}
          subtitle={summary.averageScore >= 75 ? 'Strong standing' : 'Needs practice'}
          icon={<Award className="w-5 h-5" />}
          color={summary.averageScore >= 75 ? '#15803D' : '#D97706'}
        />
        <MetricsCard
          title="Study Sessions"
          value={summary.totalStudySessions}
          subtitle="Recorded learning"
          icon={<Clock className="w-5 h-5" />}
          color="#0284C7"
        />
        <MetricsCard
          title="Topics Mastered"
          value={summary.topicsCompleted}
          subtitle="Document units"
          icon={<Layers className="w-5 h-5" />}
          color="#7C3AED"
        />
      </div>

      {/* 3. Continue Learning Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">Continue Learning</h2>
          </div>
          <Link
            href="/subjects"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View all subjects <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data?.continueLearning && data.continueLearning.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.continueLearning.map((sub) => (
              <div
                key={sub.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: sub.color || '#2563EB' }}
                    >
                      {sub.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-slate-900 truncate">
                        {sub.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate">
                        {sub.latestDocument ? `Latest: ${sub.latestDocument}` : 'No materials yet'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600 my-3 py-2 border-y border-slate-100">
                    <span>
                      <strong className="text-slate-900 font-semibold">{sub.documentsCount}</strong> docs
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-900 font-semibold">{sub.quizzesCompleted}</strong> quizzes
                    </span>
                    {sub.averageScore > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">{sub.averageScore}% avg</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={`/subjects/${sub.id}`}
                    className="flex-1 text-center py-2 bg-slate-50 hover:bg-blue-50 text-blue-700 hover:text-blue-800 text-xs font-semibold rounded-lg border border-slate-200 hover:border-blue-200 transition-colors"
                  >
                    Open Workspace
                  </Link>
                  <Link
                    href={`/quizzes?subjectId=${sub.id}`}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    title="Take Subject Quiz"
                  >
                    <GraduationCap className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No active subjects yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create your first subject or upload a lecture document to kick off your personalized study workspace.
            </p>
            <button
              onClick={() => setIsCreateSubjectOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Create Subject
            </button>
          </div>
        )}
      </div>

      {/* 4. Recommendations & Weekly Progress Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* "What Should I Study Next?" */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-teal-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">What Should I Study Next?</h3>
                <p className="text-xs text-slate-500">
                  Targeted recommendations based on quiz mistakes and topic weaknesses
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-md">
              AI Diagnostic
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {data?.recommendations && data.recommendations.length > 0 ? (
              data.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {rec.topicTitle}
                      </span>
                      {rec.accuracy > 0 && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            rec.accuracy < 60
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {rec.accuracy}% Accuracy
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{rec.reason}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Source Document: {rec.documentTitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {rec.documentId && (
                      <Link
                        href={`/documents/${rec.documentId}`}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Notes
                      </Link>
                    )}
                    <Link
                      href={
                        rec.documentId
                          ? `/quizzes?documentId=${rec.documentId}`
                          : `/quizzes?subjectId=${rec.subjectId}`
                      }
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      Practice
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs">
                Complete a quiz session to unlock AI-powered topic recommendations!
              </div>
            )}
          </div>
        </div>

        {/* Weekly Progress Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Weekly Progress</h3>
              </div>
              <span className="text-[11px] text-slate-500">Last 7 Days</span>
            </div>

            <div className="pt-4">
              <p className="text-xs text-slate-500 mb-4">
                Actual recorded learning time and quiz attempts:
              </p>

              {/* Simple pure CSS bar chart */}
              <div className="flex items-end justify-between gap-2 h-36 pt-2">
                {data?.weeklyProgress?.map((item, idx) => {
                  const heightPercent =
                    item.minutes > 0
                      ? Math.min(100, Math.max(15, (item.minutes / maxWeeklyMinutes) * 100))
                      : 6;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="text-[10px] text-slate-500 font-semibold">
                        {item.minutes > 0 ? `${item.minutes}m` : ''}
                      </div>
                      <div className="w-full bg-slate-100 rounded-t-md h-24 flex items-end">
                        <div
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            item.minutes > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-200'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                          title={`${item.day}: ${item.minutes} mins, ${item.quizzes} quizzes`}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-slate-600">{item.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total weekly study:</span>
            <span className="font-bold text-slate-800">
              {data?.weeklyProgress?.reduce((acc, curr) => acc + curr.minutes, 0) || 0} minutes
            </span>
          </div>
        </div>
      </div>

      {/* 5. Recent Activity Feed */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">Recent Academic Activity</h3>
          </div>
          <Link
            href="/analytics"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Full Analytics <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recent Uploads */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" /> Recent Documents
            </h4>
            <div className="space-y-2">
              {data?.recentDocuments && data.recentDocuments.length > 0 ? (
                data.recentDocuments.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className="block p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 transition-colors"
                  >
                    <p className="text-xs font-semibold text-slate-800 truncate">{doc.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {doc.subjectName || 'Document'} • {formatRelativeTime(doc.createdAt)}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-slate-400 p-2">No documents uploaded yet</p>
              )}
            </div>
          </div>

          {/* Recent Notes */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Generated Study Notes
            </h4>
            <div className="space-y-2">
              {data?.recentNotes && data.recentNotes.length > 0 ? (
                data.recentNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-2 rounded-lg bg-white border border-slate-200"
                  >
                    <p className="text-xs font-semibold text-slate-800 truncate">{note.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                      {note.documentTitle} • {formatRelativeTime(note.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 p-2">No study notes generated yet</p>
              )}
            </div>
          </div>

          {/* Recent Quizzes */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" /> Completed Quizzes
            </h4>
            <div className="space-y-2">
              {data?.recentQuizzes && data.recentQuizzes.length > 0 ? (
                data.recentQuizzes.map((quiz) => (
                  <Link
                    key={quiz.id}
                    href={`/quizzes?reviewId=${quiz.id}`}
                    className="block p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-800 truncate">{quiz.title}</p>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                          quiz.scorePercentage >= 70
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {quiz.scorePercentage}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {quiz.subjectName || 'Quiz'} • {formatRelativeTime(quiz.completedAt)}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-slate-400 p-2">No quizzes completed yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(newDocId) => {
          setIsUploadOpen(false);
          fetchDashboardData();
          if (newDocId) {
            window.location.href = `/documents/${newDocId}`;
          }
        }}
      />

      {/* Create Subject Modal */}
      <CreateSubjectModal
        isOpen={isCreateSubjectOpen}
        onClose={() => setIsCreateSubjectOpen(false)}
        onSuccess={(newSubjectId) => {
          setIsCreateSubjectOpen(false);
          fetchDashboardData();
          if (newSubjectId) {
            window.location.href = `/subjects/${newSubjectId}`;
          }
        }}
      />
    </div>
  );
}
