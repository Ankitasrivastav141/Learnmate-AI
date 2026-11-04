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
  Trash2,
  Edit2,
  Play,
  RotateCcw,
  Plus,
  X,
  FileCheck2,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { DocumentUploadModal } from '@/components/DocumentUploadModal';
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
    timeSpentSeconds: number;
    completedAt: string;
  }>;
  metrics: {
    totalDocuments: number;
    completedQuizzes: number;
    averageScore: number;
  };
}

type SubjectTab = 'documents' | 'quiz' | 'flashcards';

export default function SubjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [activeTab, setActiveTab] = useState<SubjectTab>('documents');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Edit Subject Modal state
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('#1E3A8A');

  // Rename Document Modal state
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Replace Document Modal state
  const [replaceTarget, setReplaceTarget] = useState<DocumentItem | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const [replaceError, setReplaceError] = useState<string | null>(null);

  // Delete Document Confirmation
  const [deleteDocTarget, setDeleteDocTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    fetch(`/api/subjects/${params.id}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((subData) => {
        if (!subData.error) {
          setSubject(subData);
          setEditName(subData.name);
          setEditDescription(subData.description || '');
          setEditColor(subData.color || '#1E3A8A');
        } else {
          setSubject(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load subject dashboard:', err);
        setSubject(null);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [params.id]);

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    try {
      const res = await fetch(`/api/subjects/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim(),
          color: editColor,
        }),
      });

      if (res.ok) {
        setIsEditingSubject(false);
        loadData();
      }
    } catch (err) {
      console.error('Failed to update subject:', err);
    }
  };

  const handleDeleteSubject = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${subject?.name}"? All associated documents, study notes, flashcards, and quizzes will be deleted.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/subjects/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/subjects');
      }
    } catch (err) {
      console.error('Failed to delete subject:', err);
    }
  };

  const handleRenameDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !newTitle.trim()) return;

    try {
      const res = await fetch(`/api/documents/${renameTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });

      if (res.ok) {
        setRenameTarget(null);
        loadData();
      }
    } catch (err) {
      console.error('Failed to rename document:', err);
    }
  };

  const handleConfirmDeleteDoc = async () => {
    if (!deleteDocTarget) return;
    setIsDeletingDoc(true);
    try {
      const res = await fetch(`/api/documents/${deleteDocTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteDocTarget(null);
        loadData();
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    } finally {
      setIsDeletingDoc(false);
    }
  };

  const handleConfirmReplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceTarget || !replaceFile) return;

    setIsReplacing(true);
    setReplaceError(null);

    try {
      const formData = new FormData();
      formData.append('file', replaceFile);

      const res = await fetch(`/api/documents/${replaceTarget.id}/replace`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setReplaceTarget(null);
        setReplaceFile(null);
        loadData();
      } else {
        setReplaceError(data.error || 'Failed to replace document');
      }
    } catch (err: any) {
      console.error('Error replacing document:', err);
      setReplaceError(err.message || 'An unexpected error occurred');
    } finally {
      setIsReplacing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'READY':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Ready
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#1E3A8A] border border-blue-200 flex items-center gap-1">
            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Processing
          </span>
        );
      case 'FAILED':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
            Failed
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getFileTypeBadge = (fileType: string) => {
    return (
      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#1E3A8A] border border-blue-200 uppercase">
        {fileType}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-[#64748B] text-xs flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
        <span>Loading subject workspace...</span>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#111827]">Subject Workspace Not Found</h2>
        <p className="text-xs text-[#64748B] leading-relaxed">
          The subject may have been renamed or moved. Return to the subjects list to view your active subjects.
        </p>
        <Link
          href="/subjects"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1E3A8A] text-white hover:bg-[#1e40af] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Subjects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-6xl mx-auto">
      {/* 1. Breadcrumb & Subject Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <Link href="/subjects" className="hover:text-[#111827] flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> My Subjects
          </Link>
          <span>/</span>
          <span className="text-[#111827] font-semibold">{subject.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1E3A8A] hover:bg-[#1e40af] text-white shadow-sm transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Study Material
          </button>
          <button
            onClick={() => setIsEditingSubject(true)}
            className="p-1.5 text-[#64748B] hover:text-[#111827] rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Edit Subject"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteSubject}
            className="p-1.5 text-[#64748B] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            title="Delete Subject"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Subject Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-sm shrink-0"
            style={{ backgroundColor: subject.color || '#1E3A8A' }}
          >
            {subject.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#111827] tracking-tight">
              {subject.name}
            </h1>
            <p className="text-xs text-[#64748B] mt-1 max-w-xl leading-relaxed">
              {subject.description || 'Subject workspace for lecture slides, consolidated study notes, flashcards, and practice quizzes.'}
            </p>

            <div className="flex items-center gap-4 text-xs text-[#64748B] mt-3">
              <span>
                <strong className="text-[#111827] font-semibold">{subject.documents.length}</strong> Study Documents
              </span>
              <span>•</span>
              <span>
                <strong className="text-[#111827] font-semibold">{subject.quizSessions.length}</strong> Quizzes Taken
              </span>
              {subject.metrics.averageScore > 0 && (
                <>
                  <span>•</span>
                  <span className="text-[#15803D] font-semibold">
                    {subject.metrics.averageScore}% Avg Quiz Accuracy
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Link
            href={`/quizzes?subjectId=${subject.id}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#111827] font-semibold text-xs border border-[#E2E8F0] transition-colors"
          >
            <GraduationCap className="w-4 h-4 text-[#2563EB]" />
            Practice Subject Quiz
          </Link>
        </div>
      </div>

      {/* 3. Primary Workspace Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'documents'
              ? 'bg-[#1E3A8A] text-white shadow-sm'
              : 'text-[#475569] hover:text-[#111827] hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Study Documents
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              activeTab === 'documents' ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#475569]'
            }`}
          >
            {subject.documents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'quiz'
              ? 'bg-[#1E3A8A] text-white shadow-sm'
              : 'text-[#475569] hover:text-[#111827] hover:bg-slate-50'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Practice Quiz & History ({subject.quizSessions.length})
        </button>

        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'flashcards'
              ? 'bg-[#1E3A8A] text-white shadow-sm'
              : 'text-[#475569] hover:text-[#111827] hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Subject Flashcards
        </button>
      </div>

      {/* 4. TAB 1: STUDY DOCUMENTS (MAIN DOCUMENT MANAGEMENT) */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Uploaded Study Materials</h3>
              <p className="text-xs text-[#64748B]">
                Lecture presentations, PDFs, and notes uploaded for {subject.name}.
              </p>
            </div>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-3 py-1.5 bg-[#1E3A8A] hover:bg-[#1e40af] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Document
            </button>
          </div>

          {subject.documents.length === 0 ? (
            <div className="p-12 text-center bg-white border border-dashed border-[#E2E8F0] rounded-2xl space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-base text-[#111827]">No Study Materials Uploaded Yet</h4>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
                Upload your lecture slides (PPTX, PDF) or class notes (DOCX, TXT) to generate complete study notes and quizzes.
              </p>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="mt-2 px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-semibold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" /> Upload Material Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subject.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm hover:shadow transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {getFileTypeBadge(doc.fileType)}
                        {getStatusBadge(doc.status)}
                      </div>

                      {/* Document Actions Menu */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setReplaceTarget(doc);
                            setReplaceFile(null);
                            setReplaceError(null);
                          }}
                          className="p-1.5 text-[#64748B] hover:text-[#2563EB] rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Replace with updated document"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setRenameTarget({ id: doc.id, title: doc.title });
                            setNewTitle(doc.title);
                          }}
                          className="p-1.5 text-[#64748B] hover:text-[#111827] rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Rename document"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteDocTarget({ id: doc.id, title: doc.title })}
                          className="p-1.5 text-[#64748B] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-bold text-[#111827] text-sm line-clamp-2">
                      {doc.title}
                    </h4>
                    <p className="text-[11px] text-[#64748B] truncate">
                      {doc.fileName} • {formatBytes(doc.fileSize)} • {doc.pageCount} pages/slides
                    </p>

                    {/* Breakdown pills */}
                    <div className="grid grid-cols-3 gap-1 py-1.5 px-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-center text-[11px]">
                      <div>
                        <span className="block font-bold text-[#111827]">{doc._count.notes}</span>
                        <span className="text-[10px] text-[#64748B]">Notes</span>
                      </div>
                      <div className="border-x border-[#E2E8F0]">
                        <span className="block font-bold text-[#111827]">{doc._count.flashcards}</span>
                        <span className="text-[10px] text-[#64748B]">Cards</span>
                      </div>
                      <div>
                        <span className="block font-bold text-[#111827]">{doc._count.questions}</span>
                        <span className="text-[10px] text-[#64748B]">Questions</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 mt-2 border-t border-[#E2E8F0]">
                    <Link
                      href={`/documents/${doc.id}`}
                      className="flex-1 py-2 text-center bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                    >
                      Open Study Materials
                    </Link>
                    <Link
                      href={`/quizzes?documentId=${doc.id}`}
                      className="p-2 bg-slate-50 hover:bg-slate-100 text-[#111827] border border-[#E2E8F0] rounded-xl transition-colors cursor-pointer"
                      title="Practice Quiz on this document"
                    >
                      <GraduationCap className="w-4 h-4 text-[#2563EB]" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 2: PRACTICE QUIZ & HISTORY */}
      {activeTab === 'quiz' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#111827]">Practice Quiz for {subject.name}</h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Generate a dynamic practice quiz across all documents in this subject or review previous attempts.
              </p>
            </div>
            <Link
              href={`/quizzes?subjectId=${subject.id}`}
              className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1e40af] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Launch Practice Quiz
            </Link>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider mb-3">
              Quiz Attempt History ({subject.quizSessions.length})
            </h4>

            {subject.quizSessions.length === 0 ? (
              <div className="p-8 text-center text-[#64748B] text-xs bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                No quizzes completed yet for {subject.name}. Click &quot;Launch Practice Quiz&quot; above to start your first session.
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-xl overflow-hidden">
                {subject.quizSessions.map((qs) => (
                  <div
                    key={qs.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <h5 className="font-semibold text-xs text-[#111827]">{qs.title}</h5>
                      <span className="text-[11px] text-[#64748B]">
                        {formatDate(qs.completedAt)} • {qs.correctAnswers}/{qs.totalQuestions} correct • {Math.round(qs.timeSpentSeconds / 60)} min
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`font-bold text-xs px-2.5 py-1 rounded-full ${
                          qs.scorePercentage >= 75
                            ? 'bg-emerald-50 text-[#15803D] border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {qs.scorePercentage}%
                      </span>
                      <Link
                        href={`/quizzes?reviewId=${qs.id}`}
                        className="px-3 py-1.5 bg-slate-50 border border-[#E2E8F0] text-xs font-semibold text-[#111827] rounded-lg hover:bg-slate-100"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. TAB 3: FLASHCARDS */}
      {activeTab === 'flashcards' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-sm text-center space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#111827]">
              Interactive Flashcards for {subject.name}
            </h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1 leading-relaxed">
              Review key definitions, terms, and conceptual questions across all documents in this subject with spaced repetition.
            </p>
          </div>
          <Link
            href={`/flashcards?subjectId=${subject.id}`}
            className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#1e40af] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            Open Full Flashcard Deck <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Modal: Replace Document */}
      {replaceTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-[#111827]">Replace Document</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  &quot;{replaceTarget.title}&quot; ({replaceTarget.fileName})
                </p>
              </div>
              <button
                onClick={() => setReplaceTarget(null)}
                className="text-[#64748B] hover:text-[#111827]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-[#1E3A8A] leading-relaxed">
              <strong>Notice:</strong> Uploading a replacement file will maintain its association with <strong>{subject.name}</strong>, update the stored slides, and re-generate complete study notes and quizzes. Your personal notes will be preserved.
            </div>

            {replaceError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {replaceError}
              </div>
            )}

            <form onSubmit={handleConfirmReplace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Select Updated File (PPTX, PDF, DOCX, TXT)
                </label>
                <input
                  type="file"
                  accept=".pptx,.ppt,.pdf,.docx,.doc,.txt"
                  required
                  onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[#64748B] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#1E3A8A] hover:file:bg-blue-100 cursor-pointer border border-[#E2E8F0] rounded-xl p-2 bg-[#F8FAFC]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setReplaceTarget(null)}
                  disabled={isReplacing}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReplacing || !replaceFile}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1E3A8A] hover:bg-[#1e40af] text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isReplacing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Replacing & Regenerating...
                    </>
                  ) : (
                    'Confirm & Replace'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rename Document */}
      {renameTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4">
            <h3 className="font-bold text-base text-[#111827]">Rename Document</h3>
            <form onSubmit={handleRenameDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1E3A8A] hover:bg-[#1e40af] text-white shadow-sm cursor-pointer"
                >
                  Save Title
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Document Confirmation */}
      {deleteDocTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#111827]">Delete Document?</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Are you sure you want to delete &quot;{deleteDocTarget.title}&quot;? All associated study notes, flashcards, and quizzes will be removed.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setDeleteDocTarget(null)}
                disabled={isDeletingDoc}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDoc}
                disabled={isDeletingDoc}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm cursor-pointer"
              >
                {isDeletingDoc ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Subject */}
      {isEditingSubject && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[#111827]">Edit Subject</h3>
              <button
                onClick={() => setIsEditingSubject(false)}
                className="text-[#64748B] hover:text-[#111827]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsEditingSubject(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1E3A8A] hover:bg-[#1e40af] text-white shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Study Material Modal */}
      {isUploadOpen && (
        <DocumentUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          preselectedSubjectId={subject.id}
          preselectedSubjectName={subject.name}
          onSuccess={(newDocId) => {
            setIsUploadOpen(false);
            if (newDocId) {
              router.push(`/documents/${newDocId}`);
            } else {
              loadData();
            }
          }}
        />
      )}
    </div>
  );
}
