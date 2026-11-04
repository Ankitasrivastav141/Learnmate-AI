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
  RefreshCw,
  CheckCircle2,
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
      return [{ id: preselectedSubjectId, name: preselectedSubjectName, color: '#2563EB' }];
    }
    return [];
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<
    'idle' | 'uploading' | 'extracting' | 'generating' | 'completed' | 'failed'
  >('idle');
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
          if (
            preselectedSubjectId &&
            preselectedSubjectName &&
            !list.some((s) => s.id === preselectedSubjectId)
          ) {
            list.unshift({
              id: preselectedSubjectId,
              name: preselectedSubjectName,
              color: '#2563EB',
            });
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
      setUploadStep('idle');
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
      setUploadStep('idle');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!file) {
      setError('Please select an academic document (PPTX, PPT, PDF, DOCX, DOC, or TXT).');
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

      // Transition stages
      const t1 = setTimeout(() => setUploadStep('extracting'), 1200);
      const t2 = setTimeout(() => setUploadStep('generating'), 3000);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      clearTimeout(t1);
      clearTimeout(t2);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process document');
      }

      // Save document to browser persistence layer so it is available across serverless Lambda instances
      if (data.document && typeof window !== 'undefined') {
        try {
          localStorage.setItem(`learnmate_doc_${data.id}`, JSON.stringify(data.document));
          
          // Also register in user's documents list
          const summaryItem = {
            id: data.document.id,
            title: data.document.title,
            fileName: data.document.fileName || data.title,
            fileType: data.document.fileType || 'pdf',
            fileSize: data.document.fileSize || 0,
            status: 'READY',
            summary: data.document.summary || null,
            pageCount: data.document.pageCount || 1,
            wordCount: data.document.wordCount || 0,
            createdAt: data.document.createdAt || new Date().toISOString(),
            subject: data.document.subject,
            _count: {
              topics: data.document.topics?.length || 0,
              concepts: 0,
              notes: data.document.notes?.length || 1,
              flashcards: data.document.flashcards?.length || 0,
              questions: data.document.questions?.length || 0,
            },
          };

          const existingCached = JSON.parse(localStorage.getItem('learnmate_user_docs') || '[]');
          const updatedCached = [summaryItem, ...existingCached.filter((d: any) => d.id !== data.id)];
          localStorage.setItem('learnmate_user_docs', JSON.stringify(updatedCached.slice(0, 50)));
        } catch (storageErr) {
          console.warn('LocalStorage save warning:', storageErr);
        }
      }

      setUploadStep('completed');
      setTimeout(() => {
        setIsUploading(false);
        setFile(null);
        setTitle('');
        setUploadStep('idle');
        onSuccess(data.id);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setIsUploading(false);
      setUploadStep('failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Upload Study Material</h3>
              <p className="text-xs text-slate-500">
                Convert slides or documents into an AI study pack
              </p>
            </div>
          </div>
          {!isUploading && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              {uploadStep === 'failed' && (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              )}
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              file
                ? 'border-blue-600 bg-blue-50/40'
                : 'border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/20'
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
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <p className="font-semibold text-slate-800 text-sm max-w-xs truncate">
                  {file.name}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  <span className="uppercase font-semibold">
                    {file.name.split('.').pop() || 'FILE'}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-600 font-medium">Ready for synthesis</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Click to browse or drag and drop your file
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports <span className="font-medium text-slate-700">PDF, PPT, PPTX, DOC, DOCX, TXT</span> (Max 50MB)
                </p>
              </div>
            )}
          </div>

          {/* Target Subject Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Subject <span className="text-red-500">*</span>
            </label>
            {subjects.length > 0 ? (
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={isUploading}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs text-slate-500 bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                No subjects found. Please create a subject first from the Subjects menu!
              </div>
            )}
          </div>

          {/* Document Title Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Consumer Choice & Market Equilibrium"
              disabled={isUploading}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Progress / Status feedback during upload */}
          {isUploading && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  {uploadStep === 'uploading' && 'Uploading document...'}
                  {uploadStep === 'extracting' && 'Extracting academic content & structure...'}
                  {uploadStep === 'generating' && 'Gemini AI generating notes & questions...'}
                  {uploadStep === 'completed' && 'Processing Complete!'}
                </span>
                <span className="text-blue-700 font-bold">
                  {uploadStep === 'uploading' && '25%'}
                  {uploadStep === 'extracting' && '60%'}
                  {uploadStep === 'generating' && '85%'}
                  {uploadStep === 'completed' && '100%'}
                </span>
              </div>
              <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-500 rounded-full"
                  style={{
                    width:
                      uploadStep === 'uploading'
                        ? '25%'
                        : uploadStep === 'extracting'
                        ? '60%'
                        : uploadStep === 'generating'
                        ? '85%'
                        : '100%',
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-600">
                Extracting concepts, building flashcards, and generating practice questions grounded in your document.
              </p>
            </div>
          )}

          {uploadStep === 'completed' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Study pack generated successfully! Loading your document...</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !file || !selectedSubjectId}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
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
