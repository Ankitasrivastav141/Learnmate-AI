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
      <header className="h-16 border-b border-[#E5DCD0] bg-[#F8F3ED]/90 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#EFE7DD] text-[#252222] border border-[#DED4C7] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#652D3D]" />
            Workspace
          </span>
          <span className="text-sm font-semibold text-[#252222]">
            LearnMate AI Active Learning Hub
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateSubjectOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-white hover:bg-[#FAF7F2] text-[#252222] border border-[#DED4C7] hover:border-[#B58B83] shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#652D3D]" />
            New Subject
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#652D3D] hover:bg-[#522431] text-[#F3EDE3] shadow-md shadow-[#652D3D]/20 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#F3EDE3]" />
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
