'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  FileText,
  GraduationCap,
  Award,
  Trash2,
  Edit2,
  ArrowRight,
  Search,
  ArrowUpDown,
  Layers,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { CreateSubjectModal } from '@/components/CreateSubjectModal';

interface SubjectItem {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  documentCount: number;
  quizCount: number;
  averageScore: number | null;
  createdAt: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'documents' | 'score' | 'recent'>('recent');

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<SubjectItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadSubjects = () => {
    setIsLoading(true);
    fetch('/api/subjects', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSubjects(data);
        }
      })
      .catch((err) => console.error('Error fetching subjects:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const confirmDeleteSubject = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/subjects/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setSubjects((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        alert('Failed to delete subject.');
      }
    } catch (err) {
      console.error('Failed to delete subject:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  );

  const sortedSubjects = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'documents') return b.documentCount - a.documentCount;
    if (sortBy === 'score') return (b.averageScore || 0) - (a.averageScore || 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#1E3A8A]" />
            My Subjects
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Organize academic courses, maintain independent study materials, and track mastery.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-semibold text-xs shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Subject
        </button>
      </div>

      {/* 2. Search & Sort Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects by name or topic..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
          >
            <option value="recent">Recently Added</option>
            <option value="name">Alphabetical (A-Z)</option>
            <option value="documents">Most Documents</option>
            <option value="score">Highest Quiz Score</option>
          </select>
        </div>
      </div>

      {/* 3. Subjects Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading subjects...
        </div>
      ) : sortedSubjects.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            {search ? 'No matching subjects found' : 'No subjects created yet'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search
              ? 'Try modifying your search term or clear the filter.'
              : 'Create your first subject to start organizing your lecture presentations and quizzes.'}
          </p>
          {!search && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Subject
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedSubjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Subject Badge & Actions */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                      style={{ backgroundColor: sub.color || '#2563EB' }}
                    >
                      {sub.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                        {sub.name}
                      </h2>
                      <span className="text-[11px] text-slate-400">
                        Created {new Date(sub.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteTarget(sub);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px] leading-relaxed">
                  {sub.description || 'Dedicated academic workspace for lecture notes and quizzes.'}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 my-4 py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <div>
                    <span className="block font-bold text-slate-800 text-xs">
                      {sub.documentCount}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Docs</span>
                  </div>
                  <div className="border-x border-slate-200">
                    <span className="block font-bold text-slate-800 text-xs">
                      {sub.quizCount}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Quizzes</span>
                  </div>
                  <div>
                    <span
                      className={`block font-bold text-xs ${
                        sub.averageScore !== null && sub.averageScore >= 70
                          ? 'text-emerald-700'
                          : 'text-slate-800'
                      }`}
                    >
                      {sub.averageScore !== null ? `${sub.averageScore}%` : 'N/A'}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Score</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <Link
                  href={`/subjects/${sub.id}`}
                  className="flex-1 py-2 text-center bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={`/quizzes?subjectId=${sub.id}`}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                  title="Subject Quiz"
                >
                  <GraduationCap className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Subject Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900">
                Delete "{deleteTarget.name}"?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Deleting this subject will permanently remove all of its associated{' '}
                <strong className="text-slate-900">{deleteTarget.documentCount} uploaded documents</strong>, generated AI study notes, flashcards, and practice quiz records.
              </p>
              <p className="text-[11px] text-red-600 font-semibold mt-1">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSubject}
                disabled={isDeleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
              >
                {isDeleting ? 'Deleting...' : 'Delete Subject & All Files'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Subject Modal */}
      <CreateSubjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newId) => {
          setIsCreateOpen(false);
          loadSubjects();
          if (newId) {
            window.location.href = `/subjects/${newId}`;
          }
        }}
      />
    </div>
  );
}
