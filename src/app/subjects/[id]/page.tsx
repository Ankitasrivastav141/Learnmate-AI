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
  Trash2,
  Edit2,
  Play,
  RotateCcw,
  Plus,
  X,
  FileCheck2,
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
    timeSpentSeconds: number;
    completedAt: string;
  }>;
  metrics: {
    totalDocuments: number;
    completedQuizzes: number;
    averageScore: number;
  };
}

type SubjectTab = 'documents' | 'study_guide' | 'flashcards' | 'quizzes' | 'outline';

export default function SubjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [outlineData, setOutlineData] = useState<any | null>(null);
  const [outlineStats, setOutlineStats] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<SubjectTab>('documents');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Edit Subject Modal state
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('');

  // Rename Document Modal state
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      fetch(`/api/subjects/${params.id}`, { cache: 'no-store' }).then((res) => res.json()),
      fetch(`/api/subjects/${params.id}/outline`, { cache: 'no-store' }).then((res) => res.json()),
    ])
      .then(([subData, outlineRes]) => {
        if (!subData.error) {
          setSubject(subData);
          setEditName(subData.name);
          setEditDescription(subData.description || '');
          setEditColor(subData.color || '#2563EB');
        }
        if (outlineRes && outlineRes.outline) {
          setOutlineData(outlineRes.outline);
          setOutlineStats(outlineRes.stats);
        } else {
          setOutlineData(null);
        }
      })
      .catch((err) => console.error('Failed to load subject dashboard:', err))
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

  const handleDeleteDocument = async (e: React.MouseEvent, docId: string, docTitle: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${docTitle}"? All associated generated study notes and questions will be permanently removed.`)) {
      return;
    }

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
      <div className="py-24 text-center text-slate-500 text-sm">
        Loading subject workspace...
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto animate-in fade-in duration-200">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#1E3A8A] mx-auto">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#111827]">Subject Not Found</h2>
        <p className="text-xs text-[#64748B] leading-relaxed">
          This subject may have been removed or renamed. Browse your subjects directory to access all your active course workspaces.
        </p>
        <div>
          <Link
            href="/subjects"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1e40af] text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            Go to My Subjects
          </Link>
        </div>
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
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
    }
  };

  const getFileTypeBadge = (type: string) => {
    const t = type.toUpperCase();
    let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
    if (t === 'PDF') colorClass = 'bg-red-50 text-red-700 border-red-200';
    if (t === 'PPTX' || t === 'PPT') colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
    if (t === 'DOCX' || t === 'DOC') colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
    return (
      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${colorClass}`}>
        {t}
      </span>
    );
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/subjects" className="hover:text-slate-800 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Subjects
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">{subject.name}</span>
      </div>

      {/* 2. Subject Workspace Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
            style={{ backgroundColor: subject.color || '#2563EB' }}
          >
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{subject.name}</h1>
              <button
                onClick={() => setIsEditingSubject(true)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                title="Edit subject details"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {subject.description || 'Dedicated academic workspace for lecture slides, notes, flashcards, and quizzes.'}
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
              <span>
                <strong className="text-slate-900 font-semibold">{subject.documents.length}</strong> Study Materials
              </span>
              <span>•</span>
              <span>
                <strong className="text-slate-900 font-semibold">{subject.quizSessions.length}</strong> Quizzes Taken
              </span>
              {subject.metrics.averageScore > 0 && (
                <>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">
                    {subject.metrics.averageScore}% Avg Quiz Accuracy
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Upload Study Material
          </button>
          <Link
            href={`/quizzes?subjectId=${subject.id}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-300 transition-colors"
          >
            <GraduationCap className="w-4 h-4 text-blue-600" />
            Practice Subject Quiz
          </Link>
        </div>
      </div>

      {/* 3. Primary Workspace Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'documents'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          Documents & Study Packs
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              activeTab === 'documents' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {subject.documents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('study_guide')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'study_guide'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Synthesized Study Notes
        </button>

        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'flashcards'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Subject Flashcards
        </button>

        <button
          onClick={() => setActiveTab('quizzes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'quizzes'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Quizzes & History
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              activeTab === 'quizzes' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {subject.quizSessions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('outline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'outline'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Course Syllabus (Optional)
        </button>
      </div>

      {/* 4. Tab 1: Documents & Materials (Default) */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Uploaded Study Materials</h3>
              <p className="text-xs text-slate-500">
                Lecture slides and documents processed into AI notes, flashcards, and quizzes.
              </p>
            </div>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Document
            </button>
          </div>

          {subject.documents.length === 0 ? (
            <div className="p-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl space-y-3">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-base text-slate-800">No Documents Uploaded Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Upload your lecture slides (PPTX, PDF) or class notes (DOCX, TXT) to automatically generate comprehensive study packs.
              </p>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" /> Upload Material Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subject.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {getFileTypeBadge(doc.fileType)}
                        {getStatusBadge(doc.status)}
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setRenameTarget({ id: doc.id, title: doc.title });
                            setNewTitle(doc.title);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                          title="Rename document"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteDocument(e, doc.id, doc.title)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-2">
                      {doc.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      {doc.fileName} • {formatBytes(doc.fileSize)} • {doc.pageCount} pages/slides
                    </p>

                    {/* Breakdown pill badges */}
                    <div className="grid grid-cols-3 gap-1.5 my-3 py-2 px-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center text-[11px]">
                      <div>
                        <span className="block font-bold text-slate-800">{doc._count.notes}</span>
                        <span className="text-[10px] text-slate-500">Notes</span>
                      </div>
                      <div className="border-x border-slate-200">
                        <span className="block font-bold text-slate-800">{doc._count.flashcards}</span>
                        <span className="text-[10px] text-slate-500">Cards</span>
                      </div>
                      <div>
                        <span className="block font-bold text-slate-800">{doc._count.questions}</span>
                        <span className="text-[10px] text-slate-500">Questions</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Link
                      href={`/documents/${doc.id}`}
                      className="flex-1 py-2 text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
                    >
                      View Study Pack
                    </Link>
                    <Link
                      href={`/quizzes?documentId=${doc.id}`}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                      title="Quiz on this document"
                    >
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 2: Synthesized Study Notes */}
      {activeTab === 'study_guide' && (
        <div className="space-y-4">
          {outlineData ? (
            <ComprehensiveStudyReader
              outline={outlineData}
              subjectId={subject.id}
              subjectName={subject.name}
              onRefresh={() => loadData()}
            />
          ) : (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    Study Notes Across Documents
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select any uploaded study material below to open its topic notes, concept glossaries, and flashcards.
                  </p>
                </div>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload More Notes
                </button>
              </div>

              {subject.documents.length === 0 ? (
                <div className="p-10 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
                  <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No documents uploaded yet in {subject.name}.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subject.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-blue-300 transition-colors flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {getFileTypeBadge(doc.fileType)}
                          <span className="text-xs text-slate-400">
                            {doc.pageCount} pages • {doc._count.notes} notes generated
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{doc.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {doc.summary || 'Study pack ready with concepts, summaries, and flashcards.'}
                        </p>
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {doc._count.concepts} concepts • {doc._count.flashcards} flashcards
                        </span>
                        <Link
                          href={`/documents/${doc.id}`}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          Open Study Notes <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. Tab 3: Flashcards */}
      {activeTab === 'flashcards' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center space-y-4">
          <Sparkles className="w-10 h-10 text-blue-600 mx-auto" />
          <h3 className="font-bold text-base text-slate-900">
            Interactive Flashcards for {subject.name}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Review key definitions, terms, and conceptual questions generated from your study materials with spaced repetition.
          </p>
          <div>
            <Link
              href={`/flashcards?subjectId=${subject.id}`}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 shadow-sm"
            >
              Open Full Flashcard Deck <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* 7. Tab 4: Quizzes & History */}
      {activeTab === 'quizzes' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Subject Quiz History</h3>
              <p className="text-xs text-slate-500">
                Evaluation results and mistake reviews for {subject.name}
              </p>
            </div>
            <Link
              href={`/quizzes?subjectId=${subject.id}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Play className="w-3.5 h-3.5" /> Start New Quiz
            </Link>
          </div>

          {subject.quizSessions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No quizzes completed yet for this subject.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {subject.quizSessions.map((qs) => (
                <div
                  key={qs.id}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/60 rounded-xl px-2 transition-colors"
                >
                  <div>
                    <h4 className="font-semibold text-xs text-slate-900">{qs.title}</h4>
                    <span className="text-[11px] text-slate-500">
                      Completed {formatDate(qs.completedAt)} • {formatTimer(qs.timeSpentSeconds)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        qs.scorePercentage >= 70
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {qs.scorePercentage}% ({qs.correctAnswers}/{qs.totalQuestions})
                    </span>
                    <Link
                      href={`/quizzes?reviewId=${qs.id}`}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 8. Tab 5: Course Outline (Optional) */}
      {activeTab === 'outline' && (
        <div className="space-y-4">
          <CourseOutlineCoverageView
            subjectId={subject.id}
            outline={outlineData}
            stats={outlineStats}
            onRefresh={() => loadData()}
          />
        </div>
      )}

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        preselectedSubjectId={subject.id}
        preselectedSubjectName={subject.name}
        onSuccess={(docId) => {
          setIsUploadOpen(false);
          loadData();
          if (docId) {
            router.push(`/documents/${docId}`);
          }
        }}
      />

      {/* Edit Subject Details Modal */}
      {isEditingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Edit Subject Details</h3>
              <button
                onClick={() => setIsEditingSubject(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingSubject(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Document Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Rename Document</h3>
              <button
                onClick={() => setRenameTarget(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRenameDocument} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  Update Title
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
