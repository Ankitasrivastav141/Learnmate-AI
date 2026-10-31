'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Trash2,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen,
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

  const loadDocuments = () => {
    setIsLoading(true);
    fetch('/api/documents')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDocuments(data);
          // extract unique subjects
          const subs = Array.from(
            new Map(data.map((d) => [d.subject.id, { id: d.subject.id, name: d.subject.name }])).values()
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

    if (!confirm(`Are you sure you want to delete "${title}"? All generated notes, flashcards, and quizzes will be removed.`)) {
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
            <Sparkles className="w-3 h-3" /> Analyzing
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#252222] tracking-tight">Academic Documents</h1>
          <p className="text-xs text-[#6E5D59] mt-1">
            Uploaded lecture slides, textbooks, and notes converted into active study packs
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#652D3D] hover:bg-[#7b374a] text-[#F3EDE3] font-semibold text-xs shadow-md shadow-[#652D3D]/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-[#6E5D59] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, filename, or subject..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#DED4C7] text-[#252222] text-xs focus:outline-none focus:border-[#652D3D] placeholder:text-[#6E5D59]/60 shadow-sm"
          />
        </div>

        {subjectsList.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[#6E5D59] shrink-0" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white border border-[#DED4C7] text-[#252222] text-xs focus:outline-none focus:border-[#652D3D] shadow-sm"
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

      {/* Documents List */}
      {filteredDocs.length > 0 ? (
        <div className="bg-white border border-[#E5DCD0] rounded-2xl divide-y divide-[#EFE7DD] overflow-hidden shadow-sm">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF7F2]/60 transition-colors"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FAF7F2] text-[#6E5D59] border border-[#E5DCD0] uppercase">
                    {doc.fileType}
                  </span>
                  <Link
                    href={`/documents/${doc.id}`}
                    className="font-semibold text-sm text-[#252222] hover:text-[#652D3D] transition-colors truncate"
                  >
                    {doc.title}
                  </Link>
                  <Link
                    href={`/subjects/${doc.subject.id}`}
                    className="text-xs px-2 py-0.5 rounded-full border transition-colors flex items-center gap-1.5"
                    style={{
                      borderColor: `${doc.subject.color}40`,
                      color: doc.subject.color,
                      backgroundColor: `${doc.subject.color}15`,
                    }}
                  >
                    <BookOpen className="w-3 h-3" />
                    {doc.subject.name}
                  </Link>
                  {getStatusBadge(doc.status)}
                </div>

                <p className="text-xs text-[#6E5D59] line-clamp-1">
                  {doc.summary || 'Content indexed into topics, concepts, and practice sets.'}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-[#6E5D59] pt-1">
                  <span>{doc.pageCount} Pages / Slides</span>
                  <span>•</span>
                  <span>{doc.wordCount.toLocaleString()} words</span>
                  <span>•</span>
                  <span>{formatBytes(doc.fileSize)}</span>
                  <span>•</span>
                  <span>Uploaded {formatDate(doc.createdAt)}</span>
                </div>
              </div>

              {/* Action Buttons & Counter Badges */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="hidden sm:flex items-center gap-2 text-xs text-[#6E5D59] font-mono">
                  <span className="px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E5DCD0] text-[#252222]">
                    {doc._count.notes} Notes
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E5DCD0] text-[#252222]">
                    {doc._count.flashcards} Cards
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E5DCD0] text-[#252222]">
                    {doc._count.questions} MCQs
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(e, doc.id, doc.title)}
                    className="p-2 text-[#6E5D59] hover:text-rose-600 rounded-lg hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <Link
                    href={`/documents/${doc.id}`}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#652D3D] hover:bg-[#7b374a] text-[#F3EDE3] border border-[#652D3D] text-xs font-semibold transition-colors shadow-md shadow-[#652D3D]/20"
                  >
                    Study Pack <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#E5DCD0] rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <FileText className="w-10 h-10 text-[#B58B83] mx-auto" />
          <h3 className="text-base font-semibold text-[#252222]">No Documents Found</h3>
          <p className="text-xs text-[#6E5D59] max-w-sm mx-auto">
            {search
              ? 'No documents matched your search filter.'
              : 'Upload academic PPTs, PDFs, Word docs or TXT files to generate study packs.'}
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#652D3D] hover:bg-[#7b374a] text-[#F3EDE3] text-xs font-semibold cursor-pointer shadow-md shadow-[#652D3D]/20"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Document
          </button>
        </div>
      )}

      {isUploadOpen && (
        <DocumentUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={() => {
            setIsUploadOpen(false);
            loadDocuments();
          }}
        />
      )}
    </div>
  );
}
