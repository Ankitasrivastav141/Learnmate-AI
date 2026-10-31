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
  };
  scoreTrend: Array<{ date: string; score: number; title: string }>;
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
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
    subject?: { name: string; color: string } | null;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
      })
      .catch((err) => console.error('Failed to load dashboard data:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const summary = data?.summary || {
    totalSubjects: 0,
    totalDocuments: 0,
    totalFlashcards: 0,
    completedQuizzesCount: 0,
    averageScore: 0,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#F3EDE3] via-[#FAF7F2] to-white border border-[#E5DCD0] p-6 md:p-8 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#652D3D]/10 border border-[#652D3D]/20 text-[#652D3D] text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#652D3D]" />
            AI-Powered Academic Intelligence
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#252222] tracking-tight">
            Welcome to LearnMate AI
          </h1>
          <p className="text-sm text-[#4F4240] mt-2 leading-relaxed">
            Upload your lecture presentations, academic PDFs, and notes. LearnMate AI automatically extracts concepts, generates comprehensive study notes, interactive flashcards, and grounded 10-question quizzes.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#652D3D] hover:bg-[#522431] text-[#F3EDE3] font-semibold text-xs shadow-md shadow-[#652D3D]/20 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload Study Document
            </button>
            <Link
              href="/quizzes"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#252222] font-semibold text-xs border border-[#DED4C7] shadow-sm transition-colors"
            >
              <GraduationCap className="w-4 h-4 text-[#652D3D]" />
              Start Practice Quiz
            </Link>
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#652D3D]/5 to-transparent pointer-events-none" />
      </div>

      {/* Core Metrics Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricsCard
          title="Total Subjects"
          value={summary.totalSubjects}
          subtext="Active academic disciplines"
          icon={BookOpen}
          color="#652D3D"
        />
        <MetricsCard
          title="Uploaded Documents"
          value={summary.totalDocuments}
          subtext="PPTX, PDF, DOCX ingested"
          icon={FileText}
          color="#B58B83"
        />
        <MetricsCard
          title="Quizzes Completed"
          value={summary.completedQuizzesCount}
          subtext="10-question practice sets"
          icon={GraduationCap}
          color="#10b981"
        />
        <MetricsCard
          title="Average Quiz Score"
          value={`${summary.averageScore}%`}
          subtext={summary.completedQuizzesCount > 0 ? "Overall mastery level" : "Take a quiz to see score"}
          icon={Award}
          color="#d97706"
        />
      </div>

      {/* Weak Topics Diagnostic Alert */}
      {data?.weakTopics && data.weakTopics.length > 0 && (
        <div className="bg-[#FFF9F6] border border-[#F3D7CC] rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#652D3D]/10 border border-[#652D3D]/20 flex items-center justify-center text-[#652D3D] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#252222]">
                  Focus Required: Weak Topics Detected
                </h3>
                <p className="text-xs text-[#6E5D59] mt-0.5">
                  Quiz analytics show topics with under 70% accuracy. Review these study notes:
                </p>
              </div>
            </div>
            <Link
              href="/analytics"
              className="text-xs text-[#652D3D] hover:text-[#522431] font-semibold flex items-center gap-1 shrink-0"
            >
              Full Diagnostics <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            {data.weakTopics.slice(0, 3).map((topic, idx) => (
              <Link
                key={idx}
                href={`/documents/${topic.documentId}`}
                className="p-3 rounded-xl bg-white border border-[#E7DFD5] hover:border-[#B58B83] shadow-sm transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-[#252222] truncate">{topic.topicTitle}</p>
                  <p className="text-[11px] text-[#6E5D59] truncate">{topic.documentTitle}</p>
                </div>
                <span className="text-xs font-mono font-bold text-rose-600 ml-2">
                  {topic.accuracy}%
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Subjects & Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Subjects Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#652D3D]" />
              <h2 className="text-base font-semibold text-[#252222]">My Subjects</h2>
            </div>
            <Link
              href="/subjects"
              className="text-xs text-[#652D3D] hover:text-[#522431] font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {data?.subjectPerformance && data.subjectPerformance.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.subjectPerformance.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/subjects/${sub.id}`}
                  className="bg-white border border-[#E7DFD5] rounded-xl p-5 hover:border-[#B58B83] hover:shadow-sm transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color || '#652D3D' }}
                        />
                        <h3 className="font-semibold text-sm text-[#252222] group-hover:text-[#652D3D] transition-colors">
                          {sub.name}
                        </h3>
                      </div>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#FAF7F2] text-[#252222] border border-[#E5DCD0]">
                        {sub.averageScore > 0 ? `${sub.averageScore}% avg` : 'No tests'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#EFE7DD] text-xs text-[#6E5D59]">
                    <span>{sub.documentsCount} Documents</span>
                    <span>{sub.quizzesCompleted} Quizzes</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E7DFD5] rounded-2xl p-8 text-center space-y-3 shadow-sm">
              <BookOpen className="w-8 h-8 text-[#B58B83] mx-auto" />
              <p className="text-sm text-[#252222] font-medium">No Subjects Created Yet</p>
              <p className="text-xs text-[#6E5D59] max-w-sm mx-auto">
                Create your first academic subject to categorize lectures and generate AI learning packs.
              </p>
              <button
                onClick={() => setIsCreateSubjectOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#652D3D] hover:bg-[#522431] text-[#F3EDE3] text-xs font-semibold cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Create Subject
              </button>
            </div>
          )}
        </div>

        {/* Right: Recent Learning Activity Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#6E5D59]" />
              <h2 className="text-base font-semibold text-[#252222]">Recent Activity</h2>
            </div>
            <Link
              href="/analytics"
              className="text-xs text-[#6E5D59] hover:text-[#252222] font-medium"
            >
              History
            </Link>
          </div>

          <div className="bg-white border border-[#E7DFD5] rounded-2xl p-4 divide-y divide-[#EFE7DD] shadow-sm">
            {data?.recentActivities && data.recentActivities.length > 0 ? (
              data.recentActivities.map((act) => (
                <div key={act.id} className="py-3 first:pt-1 last:pb-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#652D3D]">
                      {act.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-[#6E5D59] font-mono">
                      {formatRelativeTime(act.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-[#252222] leading-snug">{act.description}</p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#6E5D59] italic">
                No recent activity recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {isUploadOpen && (
        <DocumentUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={() => {
            setIsUploadOpen(false);
            window.location.reload();
          }}
        />
      )}

      {isCreateSubjectOpen && (
        <CreateSubjectModal
          isOpen={isCreateSubjectOpen}
          onClose={() => setIsCreateSubjectOpen(false)}
          onSuccess={() => {
            setIsCreateSubjectOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
