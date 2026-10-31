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
  ArrowRight,
  Sparkles,
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

  const loadSubjects = () => {
    setIsLoading(true);
    fetch('/api/subjects')
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

  const handleDeleteSubject = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${name}" and all its documents and quizzes?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSubjects((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete subject:', err);
    }
  };

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#252222] tracking-tight">Academic Subjects</h1>
          <p className="text-xs text-[#6E5D59] mt-1">
            Organize documents, track subject mastery, and take topic quizzes
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#652D3D] hover:bg-[#7b374a] text-[#F3EDE3] font-semibold text-xs shadow-md shadow-[#652D3D]/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Subject
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subjects by name or description..."
          className="w-full max-w-md px-4 py-2 rounded-xl bg-white border border-[#DED4C7] text-[#252222] text-xs focus:outline-none focus:border-[#652D3D] placeholder:text-[#6E5D59]/60 shadow-sm"
        />
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubjects.map((sub) => (
            <Link
              key={sub.id}
              href={`/subjects/${sub.id}`}
              className="bg-white border border-[#E5DCD0] rounded-2xl p-6 hover:border-[#B58B83] transition-all group flex flex-col justify-between shadow-sm relative"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-[#F3EDE3] shrink-0 shadow-sm"
                      style={{ backgroundColor: sub.color || '#652D3D' }}
                    >
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-[#252222] group-hover:text-[#652D3D] transition-colors">
                        {sub.name}
                      </h3>
                      <p className="text-xs text-[#6E5D59] mt-0.5 line-clamp-1">
                        {sub.description || 'No description provided'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSubject(e, sub.id, sub.name)}
                    className="text-[#6E5D59] hover:text-rose-600 p-1.5 rounded-lg hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                    title="Delete subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Subject Metrics */}
                <div className="grid grid-cols-3 gap-2 mt-6 py-3 px-4 rounded-xl bg-[#FAF7F2] border border-[#E5DCD0] text-center">
                  <div>
                    <span className="text-sm font-bold text-[#252222]">{sub.documentCount}</span>
                    <p className="text-[10px] text-[#6E5D59] uppercase font-medium">Docs</p>
                  </div>
                  <div className="border-x border-[#E5DCD0]">
                    <span className="text-sm font-bold text-[#252222]">{sub.quizCount}</span>
                    <p className="text-[10px] text-[#6E5D59] uppercase font-medium">Quizzes</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#652D3D] font-mono">
                      {sub.averageScore !== null ? `${sub.averageScore}%` : '-'}
                    </span>
                    <p className="text-[10px] text-[#6E5D59] uppercase font-medium">Avg Score</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E5DCD0] flex items-center justify-between text-xs text-[#6E5D59] font-medium group-hover:text-[#652D3D] transition-colors">
                <span>View Subject Hub</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#E5DCD0] rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <BookOpen className="w-10 h-10 text-[#B58B83] mx-auto" />
          <h3 className="text-base font-semibold text-[#252222]">No Subjects Found</h3>
          <p className="text-xs text-[#6E5D59] max-w-md mx-auto">
            {search
              ? 'No subjects matched your search filter.'
              : 'Create your first subject to start uploading lecture notes, presentations, and documents.'}
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#652D3D] hover:bg-[#7b374a] text-[#F3EDE3] text-xs font-semibold cursor-pointer shadow-md shadow-[#652D3D]/20"
          >
            <Plus className="w-3.5 h-3.5" /> Create Subject
          </button>
        </div>
      )}

      {isCreateOpen && (
        <CreateSubjectModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            loadSubjects();
          }}
        />
      )}
    </div>
  );
}
