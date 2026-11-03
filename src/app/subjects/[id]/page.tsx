'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Upload,
  GraduationCap,
  FileText,
  Clock,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Layers,
  Award,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Map,
  Library,
  Trash2,
} from 'lucide-react';
import { DocumentUploadModal } from '@/components/DocumentUploadModal';
import { CourseOutlineCoverageView } from '@/components/CourseOutlineCoverageView';
import { ComprehensiveStudyReader } from '@/components/ComprehensiveStudyReader';
import { formatBytes, formatDate } from '@/lib/utils';

interface DocumentItem {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: string;
  summary: string | null;
  pageCount: number;
  wordCount: number;
  createdAt: string;
  _count: {
    topics: number;
    concepts: number;
    notes: number;
    flashcards: number;
    questions: number;
  };
}

interface SubjectDetail {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  documents: DocumentItem[];
  quizSessions: Array<{
    id: string;
    title: string;
    scorePercentage: number;
    correctAnswers: number;
    totalQuestions: number;
    completedAt: string;
  }>;
  metrics: {
    totalDocuments: number;
    completedQuizzes: number;
    averageScore: number;
  };
}

type SubjectTab = 'study_guide' | 'outline' | 'resources' | 'quizzes';

export default function SubjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [outlineData, setOutlineData] = useState<any | null>(null);
  const [outlineStats, setOutlineStats] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<SubjectTab>('study_guide');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      fetch(`/api/subjects/${params.id}`).then((res) => res.json()),
      fetch(`/api/subjects/${params.id}/outline`).then((res) => res.json()),
    ])
      .then(([subData, outlineRes]) => {
        if (!subData.error) setSubject(subData);
        if (outlineRes.outline) {
          setOutlineData(outlineRes.outline);
          setOutlineStats(outlineRes.stats);
        } else {
          setOutlineData(null);
          // Default to outline tab if no outline yet
          setActiveTab('outline');
        }
      })
      .catch((err) => console.error('Failed to load subject dashboard:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [params.id]);

  const handleDeleteDocument = async (e: React.MouseEvent, docId: string, docTitle: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Delete "${docTitle}" from this subject?`)) return;

    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-[#6E5D59] text-sm">
        Loading advanced subject workspace...
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="py-16 text-center space-y-3">
        <h2 className="text-lg font-bold text-[#252222]">Subject Not Found</h2>
        <Link href="/subjects" className="text-xs text-[#652D3D] hover:underline">
          Return to subjects directory
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Ready
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">
            <Sparkles className="w-3 h-3" /> Processing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
    }
  };

  const getFileTypeBadge = (type: string) => {
    const t = type.toUpperCase();
    let colorClass = 'bg-[#FAF7F2] text-[#6E5D59] border border-[#E5DCD0]';
    if (t === 'PDF') colorClass = 'bg-rose-50 text-rose-700 border border-rose-200';
    if (t === 'PPTX' || t === 'PPT') colorClass = 'bg-amber-50 text-amber-700 border border-amber-200';
    if (t === 'DOCX' || t === 'DOC') colorClass = 'bg-blue-50 text-blue-700 border border-blue-200';
    return (
      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${colorClass}`}>
        {t}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#6E5D59]">
        <Link href="/subjects" className="hover:text-[#252222] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Subjects
        </Link>
        <span>/</span>
        <span className="text-[#252222] font-semibold">{subject.name}</span>
      </div>

      {/* Subject Header */}
      <div className="bg-white border border-[#E5DCD0] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-[#F3EDE3] shrink-0 shadow-md"
            style={{ backgroundColor: subject.color || '#652D3D' }}
          >
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#252222] tracking-tight">{subject.name}</h1>
            <p className="text-xs text-[#6E5D59] mt-1 max-w-2xl leading-relaxed">
              {subject.description || 'Advanced academic workspace integrating course outline mapping and multi-document synthesis.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#652D3D] hover:bg-[#7b374a] text-[#F3EDE3] font-semibold text-xs shadow-md shadow-[#652D3D]/20 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Upload Study Resource
          </button>
          <Link
            href={`/quizzes?subjectId=${subject.id}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EDE3] text-[#252222] font-semibold text-xs border border-[#DED4C7] transition-colors"
          >
            <GraduationCap className="w-4 h-4 text-[#652D3D]" />
            Subject Quiz
          </Link>
        </div>
      </div>

      {/* Primary Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5DCD0] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('study_guide')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'study_guide'
              ? 'bg-[#652D3D] text-[#F3EDE3] shadow-md shadow-[#652D3D]/20'
              : 'text-[#6E5D59] hover:text-[#252222] hover:bg-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Comprehensive Study Guide
          {outlineStats?.generatedCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-[#F3EDE3]">
              {outlineStats.generatedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('outline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'outline'
              ? 'bg-[#652D3D] text-[#F3EDE3] shadow-md shadow-[#652D3D]/20'
              : 'text-[#6E5D59] hover:text-[#252222] hover:bg-white'
          }`}
        >
          <Map className="w-4 h-4" />
          Course Outline & Coverage
          {outlineStats && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              {outlineStats.coveragePercentage}%
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'resources'
              ? 'bg-[#652D3D] text-[#F3EDE3] shadow-md shadow-[#652D3D]/20'
              : 'text-[#6E5D59] hover:text-[#252222] hover:bg-white'
          }`}
        >
          <Library className="w-4 h-4" />
          Study Resources ({subject.documents.length})
        </button>

        <button
          onClick={() => setActiveTab('quizzes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'quizzes'
              ? 'bg-[#652D3D] text-[#F3EDE3] shadow-md shadow-[#652D3D]/20'
              : 'text-[#6E5D59] hover:text-[#252222] hover:bg-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Quizzes ({subject.quizSessions.length})
        </button>
      </div>

      {/* TAB 1: COMPREHENSIVE STUDY GUIDE */}
      {activeTab === 'study_guide' && (
        <div>
          {outlineData ? (
            <ComprehensiveStudyReader
              outline={outlineData}
              subjectId={subject.id}
              subjectName={subject.name}
              onRefresh={loadData}
            />
          ) : (
            <div className="bg-white border border-[#E5DCD0] rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
              <Map className="w-10 h-10 text-[#B58B83] mx-auto" />
              <h3 className="text-base font-bold text-[#252222]">Course Outline Required</h3>
              <p className="text-xs text-[#6E5D59] leading-relaxed">
                To generate structured MBA-level study material, please upload your official course outline or syllabus first.
              </p>
              <button
                onClick={() => setActiveTab('outline')}
                className="px-5 py-2.5 rounded-xl bg-[#652D3D] hover:bg-[#7b374a] text-[#F3EDE3] font-semibold text-xs shadow-md shadow-[#652D3D]/20 cursor-pointer"
              >
                Go to Course Outline Upload
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COURSE OUTLINE & COVERAGE REPORT */}
      {activeTab === 'outline' && (
        <CourseOutlineCoverageView
          subjectId={subject.id}
          outline={outlineData}
          stats={outlineStats}
          onRefresh={loadData}
          onNavigateToStudyGuide={() => setActiveTab('study_guide')}
        />
      )}

      {/* TAB 3: STUDY RESOURCES (MULTIPLE PPTX, PDF, DOCX, TXT) */}
      {activeTab === 'resources' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#252222]">Course Study Resources</h2>
              <p className="text-xs text-[#6E5D59] mt-0.5">
                Upload multiple PowerPoint decks, textbooks, and notes. The AI cross-references all files across the syllabus.
              </p>
            </div>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#652D3D] hover:bg-[#7b374a] text-[#F3EDE3] font-semibold text-xs shadow-md shadow-[#652D3D]/20 cursor-pointer self-start sm:self-auto"
            >
              <Upload className="w-4 h-4" /> Add Document
            </button>
          </div>

          {subject.documents.length > 0 ? (
            <div className="bg-white border border-[#E5DCD0] rounded-2xl divide-y divide-[#EFE7DD] overflow-hidden shadow-sm">
              {subject.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF7F2]/60 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {getFileTypeBadge(doc.fileType)}
                      <Link
                        href={`/documents/${doc.id}`}
                        className="font-semibold text-sm text-[#252222] hover:text-[#652D3D] transition-colors truncate"
                      >
                        {doc.title}
                      </Link>
                      {getStatusBadge(doc.status)}
                    </div>

                    <p className="text-xs text-[#6E5D59] line-clamp-1">
                      {doc.summary || 'Indexed into slide chunks for syllabus cross-referencing.'}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-[#6E5D59] pt-1">
                      <span>{doc.pageCount} Pages / Slides</span>
                      <span>•</span>
                      <span>{doc.wordCount.toLocaleString()} words</span>
                      <span>•</span>
                      <span>{formatBytes(doc.fileSize)}</span>
                      <span>•</span>
                      <span>Added {formatDate(doc.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={(e) => handleDeleteDocument(e, doc.id, doc.title)}
                      className="p-2 text-[#6E5D59] hover:text-rose-600 rounded-lg hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <Link
                      href={`/documents/${doc.id}`}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EDE3] text-[#252222] border border-[#DED4C7] text-xs font-semibold transition-colors"
                    >
                      Inspect Chunks <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E5DCD0] rounded-2xl p-12 text-center space-y-4 shadow-sm">
              <FileSpreadsheet className="w-10 h-10 text-[#B58B83] mx-auto" />
              <h3 className="text-base font-semibold text-[#252222]">No Study Resources Added</h3>
              <p className="text-xs text-[#6E5D59] max-w-sm mx-auto">
                Upload your lecture PPTs, textbook PDFs, or Word docs. You can associate multiple documents with this subject.
              </p>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#652D3D] hover:bg-[#7b374a] text-[#F3EDE3] font-semibold text-xs shadow-md shadow-[#652D3D]/20 cursor-pointer"
              >
                <Upload className="w-4 h-4" /> Upload Document
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SUBJECT QUIZZES */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#252222]">Subject Quiz Sessions</h2>
            <Link
              href={`/quizzes?subjectId=${subject.id}`}
              className="px-4 py-2 rounded-xl bg-[#652D3D] hover:bg-[#7b374a] text-[#F3EDE3] font-semibold text-xs transition-colors shadow-md shadow-[#652D3D]/20"
            >
              Start 10-Question Subject Quiz
            </Link>
          </div>

          {subject.quizSessions.length > 0 ? (
            <div className="bg-white border border-[#E5DCD0] rounded-2xl divide-y divide-[#EFE7DD] overflow-hidden shadow-sm">
              {subject.quizSessions.map((q) => (
                <div
                  key={q.id}
                  className="p-5 flex items-center justify-between gap-4 hover:bg-[#FAF7F2]/60 transition-colors"
                >
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm text-[#252222]">{q.title}</h3>
                    <p className="text-xs text-[#6E5D59]">
                      Score: {q.correctAnswers} / {q.totalQuestions} • Completed {formatDate(q.completedAt)}
                    </p>
                  </div>

                  <span
                    className={`text-base font-bold font-mono px-3 py-1 rounded-xl border ${
                      q.scorePercentage >= 70
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-[#652D3D] bg-[#652D3D]/10 border-[#652D3D]/20'
                    }`}
                  >
                    {Math.round(q.scorePercentage)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E5DCD0] rounded-2xl p-12 text-center text-xs text-[#6E5D59] shadow-sm">
              No quizzes completed for this subject yet.
            </div>
          )}
        </div>
      )}

      {isUploadOpen && (
        <DocumentUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={() => {
            setIsUploadOpen(false);
            loadData();
          }}
          preselectedSubjectId={subject.id}
          preselectedSubjectName={subject.name}
        />
      )}
    </div>
  );
}
