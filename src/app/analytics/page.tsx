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
      <div className="py-24 text-center text-xs text-[#64748B] flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
        <span>Loading academic progress...</span>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#1E3A8A]" />
            Academic Progress
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Track quiz scores, subject-wise mastery, and topics requiring revision.
          </p>
        </div>

        <Link
          href="/quizzes"
          className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1e40af] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <GraduationCap className="w-4 h-4" /> Practice Quiz
        </Link>
      </div>

      {/* 2. Top Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <MetricsCard
          title="Average Quiz Score"
          value={summary.averageScore ? `${summary.averageScore}%` : 'N/A'}
          subtitle={summary.averageScore >= 70 ? 'Strong standing' : 'Needs practice'}
          icon={<Award className="w-5 h-5" />}
          color={summary.averageScore >= 70 ? '#15803D' : '#1E3A8A'}
        />
        <MetricsCard
          title="Total Quizzes Completed"
          value={summary.completedQuizzesCount}
          subtitle="Evaluation sessions"
          icon={<GraduationCap className="w-5 h-5" />}
          color="#2563EB"
        />
        <MetricsCard
          title="Total Subjects"
          value={summary.totalSubjects}
          subtitle="Enrolled courses"
          icon={<BookOpen className="w-5 h-5" />}
          color="#0F766E"
        />
        <MetricsCard
          title="Study Materials"
          value={summary.totalDocuments}
          subtitle="Uploaded presentations & docs"
          icon={<FileText className="w-5 h-5" />}
          color="#475569"
        />
      </div>

      {/* 3. Performance Trend & Subject Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Progression Trend */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-[#111827] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#2563EB]" />
                Recent Quiz Performance
              </h3>
              <p className="text-xs text-[#64748B]">Score progression over completed quiz sessions</p>
            </div>
            <span className="text-[11px] font-semibold text-[#64748B] bg-slate-100 px-2.5 py-0.5 rounded-full">
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
                    stroke="#1E3A8A"
                    strokeWidth={3}
                    dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-[#94A3B8] text-xs">
              <GraduationCap className="w-8 h-8 mb-2 opacity-50" />
              <span>Complete at least one practice quiz to view your performance trend</span>
            </div>
          )}
        </div>

        {/* Subject-Wise Performance */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-[#111827] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#0F766E]" />
                Subject-Wise Performance
              </h3>
              <p className="text-xs text-[#64748B]">Average quiz score achieved per subject</p>
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
            <div className="h-64 flex flex-col items-center justify-center text-[#94A3B8] text-xs">
              <BookOpen className="w-8 h-8 mb-2 opacity-50" />
              <span>No subject performance records available yet</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Topics Requiring Revision Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-[#111827] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Topics Requiring Revision
            </h3>
            <p className="text-xs text-[#64748B]">
              Identified through missed questions in quiz sessions. Prioritize these for exam readiness.
            </p>
          </div>
        </div>

        {recommendations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase tracking-wider text-[11px] bg-[#F8FAFC]">
                  <th className="py-2.5 px-3.5 font-semibold">Topic / Concept</th>
                  <th className="py-2.5 px-3.5 font-semibold">Accuracy</th>
                  <th className="py-2.5 px-3.5 font-semibold">Recommendation</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {recommendations.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-semibold text-[#111827]">{rec.topicTitle}</td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          rec.accuracy < 60
                            ? 'bg-red-100 text-[#DC2626]'
                            : 'bg-amber-100 text-[#D97706]'
                        }`}
                      >
                        {rec.accuracy}%
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-700">{rec.reason}</td>
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {rec.documentId && (
                          <Link
                            href={`/documents/${rec.documentId}`}
                            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-[#111827] border border-[#E2E8F0] font-semibold rounded-lg"
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
                          className="px-2.5 py-1 bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-semibold rounded-lg shadow-sm"
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
          <div className="p-8 text-center text-[#64748B] text-xs">
            No topic weaknesses detected yet. Complete practice quizzes to generate targeted study recommendations!
          </div>
        )}
      </div>
    </div>
  );
}
