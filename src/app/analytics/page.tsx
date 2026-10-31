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
  weakTopics: Array<{
    topicTitle: string;
    documentTitle: string;
    documentId: string;
    accuracy: number;
    totalAnswers: number;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
      })
      .catch((err) => console.error('Failed to load analytics:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        <span>Calculating learning analytics & mastery metrics...</span>
      </div>
    );
  }

  const summary = data?.summary || {
    totalSubjects: 0,
    totalDocuments: 0,
    totalFlashcards: 0,
    completedQuizzesCount: 0,
    averageScore: 0,
  };

  const scoreTrend = data?.scoreTrend || [];
  const subjectPerformance = data?.subjectPerformance || [];
  const weakTopics = data?.weakTopics || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#252222] tracking-tight">Learning Analytics & Mastery</h1>
        <p className="text-xs text-[#6E5D59] mt-1">
          Detailed telemetry on exam scores, subject-wise retention, and weak conceptual topics
        </p>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricsCard
          title="Overall Mastery"
          value={`${summary.averageScore}%`}
          subtext="Cumulative average across all tests"
          icon={Award}
          color="#B58B83"
        />
        <MetricsCard
          title="Tests Completed"
          value={summary.completedQuizzesCount}
          subtext="10-question evaluation sets"
          icon={GraduationCap}
          color="#10b981"
        />
        <MetricsCard
          title="Subjects Tracked"
          value={summary.totalSubjects}
          subtext="Academic disciplines"
          icon={BookOpen}
          color="#652D3D"
        />
        <MetricsCard
          title="Documents Ingested"
          value={summary.totalDocuments}
          subtext="PPTX, PDF, DOCX, TXT"
          icon={FileText}
          color="#B58B83"
        />
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Score Progression Over Time */}
        <div className="bg-white border border-[#E5DCD0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#252222] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#652D3D]" />
                Score Progress Over Time
              </h2>
              <p className="text-xs text-[#6E5D59]">Trajectory of accuracy across quiz sessions</p>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            {scoreTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5DCD0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#6E5D59"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E5DCD0' }}
                  />
                  <YAxis
                    stroke="#6E5D59"
                    fontSize={11}
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={{ stroke: '#E5DCD0' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E5DCD0',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#252222',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    }}
                    formatter={(val: any) => [`${val}%`, 'Accuracy']}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#652D3D"
                    strokeWidth={3}
                    dot={{ fill: '#B58B83', r: 4 }}
                    activeDot={{ r: 6, fill: '#652D3D' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-[#6E5D59]">
                <GraduationCap className="w-8 h-8 mb-2 opacity-40 text-[#652D3D]" />
                Complete at least one quiz to view your score trajectory.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Subject-Wise Performance */}
        <div className="bg-white border border-[#E5DCD0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#252222] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#652D3D]" />
                Subject-Wise Performance
              </h2>
              <p className="text-xs text-[#6E5D59]">Average score comparison across disciplines</p>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            {subjectPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5DCD0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#6E5D59"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E5DCD0' }}
                  />
                  <YAxis
                    stroke="#6E5D59"
                    fontSize={11}
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={{ stroke: '#E5DCD0' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E5DCD0',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#252222',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    }}
                    formatter={(val: any) => [`${val}%`, 'Avg Score']}
                  />
                  <Bar dataKey="averageScore" radius={[6, 6, 0, 0]}>
                    {subjectPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#652D3D'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-[#6E5D59]">
                <BookOpen className="w-8 h-8 mb-2 opacity-40 text-[#652D3D]" />
                Create subjects to populate performance comparisons.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weak Topics Diagnostic Matrix */}
      <div className="bg-white border border-[#E5DCD0] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#252222] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#652D3D]" />
              Weak Topics & Remediation Recommendations
            </h2>
            <p className="text-xs text-[#6E5D59]">
              Topics where your accuracy is under 70% based on submitted quiz questions
            </p>
          </div>
        </div>

        {weakTopics.length > 0 ? (
          <div className="divide-y divide-[#EFE7DD] border border-[#E5DCD0] rounded-xl overflow-hidden">
            {weakTopics.map((topic, idx) => (
              <div
                key={idx}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF7F2]/60 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#252222]">{topic.topicTitle}</span>
                    <span className="text-[11px] text-[#6E5D59]">({topic.documentTitle})</span>
                  </div>
                  <p className="text-xs text-[#6E5D59]">
                    Tested across {topic.totalAnswers} question attempts
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                    {topic.accuracy}% Accuracy
                  </span>

                  <Link
                    href={`/documents/${topic.documentId}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#652D3D] hover:bg-[#7b374a] text-[#F3EDE3] text-xs font-semibold transition-colors shadow-sm"
                  >
                    Review Notes <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#6E5D59] bg-[#FAF7F2] rounded-xl border border-[#E5DCD0]">
            {summary.completedQuizzesCount === 0
              ? 'Complete a quiz to identify areas requiring review.'
              : '🎉 Great job! No weak topics detected. Your accuracy is 70% or higher across all tested areas!'}
          </div>
        )}
      </div>
    </div>
  );
}
