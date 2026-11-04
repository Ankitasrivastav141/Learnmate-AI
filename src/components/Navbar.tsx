'use client';

import { useState } from 'react';
import { Upload, Plus, BookOpen, Sparkles } from 'lucide-react';
import { DocumentUploadModal } from './DocumentUploadModal';
import { CreateSubjectModal } from './CreateSubjectModal';
import { StudyTimer } from './StudyTimer';

export function Navbar() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-[#E2E8F0] bg-white/90 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
            Workspace Active
          </span>
          <span className="text-sm font-semibold text-[#0F172A] hidden sm:inline">
            LearnMate AI
          </span>
        </div>

        {/* Global Persistent Study Timer */}
        <div className="flex items-center">
          <StudyTimer />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsCreateSubjectOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] hover:border-[#CBD5E1] shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#2563EB]" />
            <span className="hidden sm:inline">New Subject</span>
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#1E3A8A] hover:bg-[#1e40af] text-white shadow-sm transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Upload Document</span>
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
