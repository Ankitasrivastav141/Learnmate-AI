'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Award,
  AlertTriangle,
  BookOpen,
  FileText,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Loader2,
  Clock,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { MetricsCard } from '@/components/MetricsCard';

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
  scoreTrend: Array<{ date: string; score: number; title: string; subjectName: string }>;
  subjectPerformance: Array<{
    id: string;
    name: string;
    color: string;
    documentsCount: number;
    quizzesCompleted: number;
    averageScore: number;
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
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics', { cache: 'no-store' })
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
      })
      .catch((err) => console.error('Failed to load analytics:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="py-24 text-center text-xs text-slate-500 flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span>Calculating learning analytics & academic metrics...</span>
      </div>
    );
  }

  const summary = data?.summary || {
    totalSubjects: 0,
    totalDocuments: 0,
    totalFlashcards: 0,
    completedQuizzesCount: 0,
    averageScore: 0,
    totalStudySessions: 0,
    topicsCompleted: 0,
  };

  const scoreTrend = data?.scoreTrend || [];
  const subjectPerformance = data?.subjectPerformance || [];
  const recommendations = data?.recommendations || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Learning Analytics & Academic Progress
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Telemetry on quiz scores, subject-wise mastery, and weak topics identified from mistake analysis.
          </p>
        </div>

        <Link
          href="/quizzes"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <GraduationCap className="w-4 h-4" /> Practice Quiz
        </Link>
      </div>

      {/* 2. Top Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricsCard
          title="Average Score"
          value={summary.averageScore ? `${summary.averageScore}%` : 'N/A'}
          subtitle="Cumulative quiz accuracy"
          icon={<Award className="w-5 h-5" />}
          color={summary.averageScore >= 70 ? '#15803D' : '#2563EB'}
        />
        <MetricsCard
          title="Quizzes Completed"
          value={summary.completedQuizzesCount}
          subtitle="Recorded evaluation sessions"
          icon={<GraduationCap className="w-5 h-5" />}
          color="#2563EB"
        />
        <MetricsCard
          title="Subjects Tracked"
          value={summary.totalSubjects}
          subtitle="Active study courses"
          icon={<BookOpen className="w-5 h-5" />}
          color="#0F766E"
        />
        <MetricsCard
          title="Study Materials"
          value={summary.totalDocuments}
          subtitle="Uploaded presentations & docs"
          icon={<FileText className="w-5 h-5" />}
          color="#4F46E5"
        />
      </div>

      {/* 3. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Progression Trend */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Score Progression Over Time
              </h3>
              <p className="text-xs text-slate-500">Historical percentage scores per quiz</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {scoreTrend.length} Tests
            </span>
          </div>

          {scoreTrend.length > 0 ? (
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    stroke="#94A3B8"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#94A3B8"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const dataPoint = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg text-xs space-y-1">
                            <p className="font-bold">{dataPoint.title}</p>
                            <p className="text-slate-300">
                              Score: <strong className="text-emerald-400">{dataPoint.score}%</strong>
                            </p>
                            <p className="text-slate-400 text-[10px]">{dataPoint.date}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#2563EB"
                    strokeWidth={3}
                    dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <GraduationCap className="w-8 h-8 mb-2 opacity-50" />
              <span>Complete a practice quiz to view your score trend</span>
            </div>
          )}
        </div>

        {/* Subject-Wise Performance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-600" />
                Subject-Wise Accuracy Comparison
              </h3>
              <p className="text-xs text-slate-500">Average quiz score achieved per subject</p>
            </div>
          </div>

          {subjectPerformance.length > 0 ? (
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectPerformance}
                  margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="name"
                    stroke="#94A3B8"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#94A3B8"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const dataPoint = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg text-xs space-y-1">
                            <p className="font-bold">{dataPoint.name}</p>
                            <p className="text-slate-300">
                              Avg Score: <strong className="text-teal-400">{dataPoint.averageScore}%</strong>
                            </p>
                            <p className="text-slate-400 text-[10px]">
                              {dataPoint.quizzesCompleted} quizzes taken
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="averageScore" radius={[6, 6, 0, 0]}>
                    {subjectPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#2563EB'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <BookOpen className="w-8 h-8 mb-2 opacity-50" />
              <span>No subject performance records available yet</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Weak Topics Diagnostic & Recommendations Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Topic Weaknesses & Revision Recommendations
            </h3>
            <p className="text-xs text-slate-500">
              Identified through missed questions in quiz sessions. Prioritize these for exam readiness.
            </p>
          </div>
        </div>

        {recommendations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] bg-slate-50/50">
                  <th className="py-2.5 px-3 font-semibold">Concept / Topic</th>
                  <th className="py-2.5 px-3 font-semibold">Source Document</th>
                  <th className="py-2.5 px-3 font-semibold">Accuracy</th>
                  <th className="py-2.5 px-3 font-semibold">Diagnostic Reason</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recommendations.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">{rec.topicTitle}</td>
                    <td className="py-3 px-3 text-slate-600">{rec.documentTitle}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          rec.accuracy < 60
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rec.accuracy > 0 ? `${rec.accuracy}%` : 'Needs Practice'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{rec.reason}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {rec.documentId && (
                          <Link
                            href={`/documents/${rec.documentId}`}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                          >
                            Study Notes
                          </Link>
                        )}
                        <Link
                          href={
                            rec.documentId
                              ? `/quizzes?documentId=${rec.documentId}`
                              : `/quizzes?subjectId=${rec.subjectId}`
                          }
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                        >
                          Practice Quiz
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No topic weaknesses detected yet. Take quizzes to generate targeted study recommendations!
          </div>
        )}
      </div>
    </div>
  );
}
