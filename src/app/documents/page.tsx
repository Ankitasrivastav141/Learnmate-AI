'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Trash2,
  Edit2,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  GraduationCap,
  Download,
  X,
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
  subject: {
    id: string;
    name: string;
    color: string;
  };
  _count: {
    topics: number;
    concepts: number;
    notes: number;
    flashcards: number;
    questions: number;
  };
}

export default function DocumentsDirectoryPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [subjectsList, setSubjectsList] = useState<Array<{ id: string; name: string }>>([]);

  // Rename modal state
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const loadDocuments = () => {
    setIsLoading(true);
    fetch('/api/documents', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDocuments(data);
          const subs = Array.from(
            new Map(
              data.map((d) => [d.subject.id, { id: d.subject.id, name: d.subject.name }])
            ).values()
          );
          setSubjectsList(subs);
        }
      })
      .catch((err) => console.error('Failed to load documents:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      !confirm(
        `Are you sure you want to delete "${title}"? All generated notes, flashcards, and quizzes will be removed.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
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
        loadDocuments();
      }
    } catch (err) {
      console.error('Failed to rename document:', err);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(search.toLowerCase()) ||
      doc.subject.name.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = selectedSubject === 'ALL' || doc.subject.id === selectedSubject;
    return matchesSearch && matchesSubject;
  });

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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Academic Documents Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Uploaded lecture presentations, textbooks, and notes converted into active AI study packs.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm hover:shadow transition-all cursor-pointer self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          Upload Study Material
        </button>
      </div>

      {/* 2. Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, filename, or subject..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400 shadow-sm"
          />
        </div>

        {subjectsList.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm font-medium"
            >
              <option value="ALL">All Subjects</option>
              {subjectsList.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 3. Documents List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading documents directory...
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-sm">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {getFileTypeBadge(doc.fileType)}
                  <Link
                    href={`/documents/${doc.id}`}
                    className="font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors truncate"
                  >
                    {doc.title}
                  </Link>
                  <Link
                    href={`/subjects/${doc.subject.id}`}
                    className="text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1.5"
                    style={{
                      borderColor: `${doc.subject.color}40`,
                      color: doc.subject.color,
                      backgroundColor: `${doc.subject.color}10`,
                    }}
                  >
                    <BookOpen className="w-3 h-3" />
                    {doc.subject.name}
                  </Link>
                  {getStatusBadge(doc.status)}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  <span>{doc.fileName}</span>
                  <span>•</span>
                  <span>{formatBytes(doc.fileSize)}</span>
                  <span>•</span>
                  <span>{doc.pageCount} pages / slides</span>
                  <span>•</span>
                  <span>Uploaded {formatDate(doc.createdAt)}</span>
                </div>
              </div>

              {/* Study Stats & Actions */}
              <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium mr-2">
                  <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-700">
                    {doc._count.notes} Notes
                  </span>
                  <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-700">
                    {doc._count.flashcards} Cards
                  </span>
                  <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-700">
                    {doc._count.questions} MCQs
                  </span>
                </div>

                <Link
                  href={`/quizzes?documentId=${doc.id}`}
                  className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl transition-colors"
                  title="Practice Quiz on this document"
                >
                  <GraduationCap className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => {
                    setRenameTarget({ id: doc.id, title: doc.title });
                    setNewTitle(doc.title);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                  title="Rename document"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => handleDelete(e, doc.id, doc.title)}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <Link
                  href={`/documents/${doc.id}`}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1 shadow-sm transition-colors"
                >
                  Study Pack <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl space-y-3">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">No Documents Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {search || selectedSubject !== 'ALL'
              ? 'Try adjusting your search criteria or subject filter.'
              : 'Upload your first lecture presentation (PPTX, PDF) or academic paper to generate an interactive study pack.'}
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Document
          </button>
        </div>
      )}

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(newId) => {
          setIsUploadOpen(false);
          loadDocuments();
          if (newId) {
            window.location.href = `/documents/${newId}`;
          }
        }}
      />

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

            <form onSubmit={handleRename} className="space-y-3">
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
                  Save Title
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
