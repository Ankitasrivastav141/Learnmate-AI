'use client';

import { useState } from 'react';
import { Upload, Plus, BookOpen, Sparkles } from 'lucide-react';
import { DocumentUploadModal } from './DocumentUploadModal';
import { CreateSubjectModal } from './CreateSubjectModal';

export function Navbar() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-[#E2E8F0] bg-white/90 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
            Workspace Active
          </span>
          <span className="text-sm font-semibold text-[#0F172A]">
            LearnMate AI Personal LMS
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateSubjectOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] hover:border-[#CBD5E1] shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#2563EB]" />
            New Subject
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md shadow-[#2563EB]/20 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            Upload Document
          </button>
        </div>
      </header>

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
    </>
  );
}
