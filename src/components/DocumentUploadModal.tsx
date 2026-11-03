'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  FileCheck2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDocId?: string) => void;
  preselectedSubjectId?: string;
  preselectedSubjectName?: string;
}

interface SubjectItem {
  id: string;
  name: string;
  color: string;
}

export function DocumentUploadModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedSubjectId,
  preselectedSubjectName,
}: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(preselectedSubjectId || '');
  const [subjects, setSubjects] = useState<SubjectItem[]>(() => {
    if (preselectedSubjectId && preselectedSubjectName) {
      return [{ id: preselectedSubjectId, name: preselectedSubjectName, color: '#652D3D' }];
    }
    return [];
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<'idle' | 'uploading' | 'extracting' | 'ai_synthesis' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (preselectedSubjectId) {
      setSelectedSubjectId(preselectedSubjectId);
    }
  }, [preselectedSubjectId]);

  useEffect(() => {
    fetch('/api/subjects', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          let list = [...data];
          if (preselectedSubjectId && preselectedSubjectName && !list.some((s) => s.id === preselectedSubjectId)) {
            list.unshift({ id: preselectedSubjectId, name: preselectedSubjectName, color: '#652D3D' });
          }
          setSubjects(list);
          if (preselectedSubjectId) {
            setSelectedSubjectId(preselectedSubjectId);
          } else if (!selectedSubjectId && list.length > 0) {
            setSelectedSubjectId(list[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to load subjects:', err));
  }, [preselectedSubjectId, preselectedSubjectName]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      if (!title) {
        setTitle(dropped.name.replace(/\.[^/.]+$/, ''));
      }
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an academic document (PPTX, PDF, DOCX, or TXT).');
      return;
    }
    if (!selectedSubjectId) {
      setError('Please select or create a subject for this document.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadStep('uploading');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subjectId', selectedSubjectId);
      if (title) formData.append('title', title);

      // Visual step progression
      setTimeout(() => setUploadStep('extracting'), 1000);
      setTimeout(() => setUploadStep('ai_synthesis'), 2500);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process document');
      }

      setUploadStep('done');
      setTimeout(() => {
        onSuccess(data.id);
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
      setUploadStep('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5DCD0] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EFE7DD] bg-[#FAF7F2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#652D3D]/10 border border-[#652D3D]/20 flex items-center justify-center text-[#652D3D]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[#252222] text-sm">Upload Study Material</h3>
              <p className="text-xs text-[#6E5D59]">Convert lecture slides or academic docs into an AI study pack</p>
            </div>
          </div>
          {!isUploading && (
            <button
              onClick={onClose}
              className="text-[#6E5D59] hover:text-[#252222] p-1 rounded-lg hover:bg-[#EFE7DD] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              file
                ? 'border-[#652D3D] bg-[#652D3D]/5'
                : 'border-[#DED4C7] hover:border-[#652D3D] bg-[#FAF7F2]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pptx,.ppt,.pdf,.docx,.doc,.txt"
              className="hidden"
              disabled={isUploading}
            />

            {file ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-[#652D3D]/10 text-[#652D3D] flex items-center justify-center border border-[#652D3D]/20">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#252222]">{file.name}</p>
                  <p className="text-xs text-[#6E5D59]">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI Synthesis
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-white border border-[#DED4C7] text-[#652D3D] flex items-center justify-center shadow-sm">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#252222]">
                    Click to browse or drag and drop your file
                  </p>
                  <p className="text-xs text-[#6E5D59] mt-1">
                    Supports <span className="text-[#652D3D] font-mono font-semibold">PPTX</span>,{' '}
                    <span className="text-[#652D3D] font-mono font-semibold">PDF</span>,{' '}
                    <span className="text-[#652D3D] font-mono font-semibold">DOCX</span>, and{' '}
                    <span className="text-[#652D3D] font-mono font-semibold">TXT</span> (Max 50MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E5D59] mb-1.5">
              Target Subject <span className="text-rose-600">*</span>
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={isUploading || subjects.length === 0}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF7F2] border border-[#DED4C7] text-[#252222] text-sm focus:outline-none focus:border-[#652D3D]"
            >
              {subjects.length === 0 ? (
                <option value="">No subjects available (Create one first)</option>
              ) : (
                subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Custom Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E5D59] mb-1.5">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Operating Systems Lecture 4 - Deadlocks"
              disabled={isUploading}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF7F2] border border-[#DED4C7] text-[#252222] text-sm focus:outline-none focus:border-[#652D3D] placeholder:text-[#6E5D59]/50"
            />
          </div>

          {/* Processing Indicator */}
          {isUploading && (
            <div className="bg-[#FAF7F2] border border-[#DED4C7] rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-[#652D3D] animate-spin" />
                <span className="text-xs font-medium text-[#252222]">
                  {uploadStep === 'uploading' && 'Uploading document to secure workspace...'}
                  {uploadStep === 'extracting' && 'Extracting text, slides & metadata...'}
                  {uploadStep === 'ai_synthesis' && 'AI Engine generating notes, concepts & 10 MCQs...'}
                  {uploadStep === 'done' && 'Complete! Redirecting to study pack...'}
                </span>
              </div>
              <div className="w-full bg-[#EFE7DD] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#652D3D] to-[#B58B83] h-full transition-all duration-500"
                  style={{
                    width:
                      uploadStep === 'uploading'
                        ? '30%'
                        : uploadStep === 'extracting'
                        ? '65%'
                        : uploadStep === 'ai_synthesis'
                        ? '90%'
                        : '100%',
                  }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#6E5D59] hover:text-[#252222] hover:bg-[#FAF7F2] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !file || subjects.length === 0}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#652D3D] hover:bg-[#522431] text-[#F3EDE3] shadow-md shadow-[#652D3D]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Process & Generate
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
