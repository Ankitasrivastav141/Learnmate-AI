'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  BookOpen,
  Map,
  Upload,
  Library,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  RotateCcw,
  Printer,
  ChevronRight,
  Layers,
  ArrowRight,
  GraduationCap,
  Loader2,
  Plus,
} from 'lucide-react';
import { CourseOutlineCoverageView } from '@/components/CourseOutlineCoverageView';
import { ComprehensiveStudyReader } from '@/components/ComprehensiveStudyReader';
import { DocumentUploadModal } from '@/components/DocumentUploadModal';
import { CreateSubjectModal } from '@/components/CreateSubjectModal';
import { formatBytes, formatDate } from '@/lib/utils';

export default function StudyGeneratorPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [subjectData, setSubjectData] = useState<any | null>(null);
  const [outlineData, setOutlineData] = useState<any | null>(null);
  const [outlineStats, setOutlineStats] = useState<any | null>(null);
  const [activeStep, setActiveStep] = useState<'reader' | 'outline' | 'resources'>('reader');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);

  // Load subjects
  useEffect(() => {
    fetch('/api/subjects')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSubjects(data);
          // Prefer "product management" if exists
          const pm = data.find((s) => s.name.toLowerCase().includes('product management'));
          setSelectedSubjectId(pm ? pm.id : data[0].id);
        }
      })
      .catch((err) => console.error('Error loading subjects:', err))
      .finally(() => setIsLoading(false));
  }, []);

  // Load subject detail and active outline
  const loadSubjectDetails = () => {
    if (!selectedSubjectId) return;

    Promise.all([
      fetch(`/api/subjects/${selectedSubjectId}`).then((res) => res.json()),
      fetch(`/api/subjects/${selectedSubjectId}/outline`).then((res) => res.json()),
    ])
      .then(([subRes, outRes]) => {
        if (!subRes.error) setSubjectData(subRes);
        if (outRes.outline) {
          setOutlineData(outRes.outline);
          setOutlineStats(outRes.stats);
          if (activeStep !== 'resources') setActiveStep('reader');
        } else {
          setOutlineData(null);
          setOutlineStats(null);
          setActiveStep('outline');
        }
      })
      .catch((err) => console.error('Error loading subject details:', err));
  };

  useEffect(() => {
    loadSubjectDetails();
  }, [selectedSubjectId]);

  const handleDeleteResource = async (docId: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        loadSubjectDetails();
      }
    } catch (err) {
      console.error('Error deleting resource:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#F3EDE3] via-[#FAF7F2] to-white border border-[#E5DCD0] rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#652D3D]/10 text-[#652D3D] border border-[#652D3D]/20 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#652D3D]" /> Advanced Academic Study Material Generator
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#252222] tracking-tight">
              Syllabus-Grounded Academic Synthesis
            </h1>
            <p className="text-xs text-[#4F4240] leading-relaxed">
              Upload your official course syllabus alongside multiple academic lecture decks and textbooks. Our AI uses RAG to cross-reference all files, identify coverage gaps, and synthesize MBA-level, examination-ready study material.
            </p>
          </div>

          {/* Subject Switcher & Creator */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {subjects.length > 0 && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6E5D59] block">
                  Select Course / Subject
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#DED4C7] text-[#252222] text-xs font-medium focus:outline-none focus:border-[#652D3D] shadow-sm cursor-pointer"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setIsCreateSubjectOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#252222] text-xs font-semibold border border-[#DED4C7] shadow-sm transition-colors flex items-center justify-center gap-2 mt-auto cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#652D3D]" /> New Course
            </button>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5DCD0] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveStep('reader')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeStep === 'reader'
              ? 'bg-[#652D3D] text-[#F3EDE3] shadow-sm'
              : 'text-[#4F4240] hover:text-[#252222] hover:bg-[#EFE7DD]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Comprehensive Study Suite
          {outlineStats?.generatedCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-[#F3EDE3]">
              {outlineStats.generatedCount} Topics
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveStep('outline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeStep === 'outline'
              ? 'bg-[#652D3D] text-[#F3EDE3] shadow-sm'
              : 'text-[#4F4240] hover:text-[#252222] hover:bg-[#EFE7DD]'
          }`}
        >
          <Map className="w-4 h-4" />
          Course Outline & Coverage Report
          {outlineStats && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
              {outlineStats.coveragePercentage}%
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveStep('resources')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeStep === 'resources'
              ? 'bg-[#652D3D] text-[#F3EDE3] shadow-sm'
              : 'text-[#4F4240] hover:text-[#252222] hover:bg-[#EFE7DD]'
          }`}
        >
          <Library className="w-4 h-4" />
          Study Resources ({subjectData?.documents?.length || 0})
        </button>
      </div>

      {/* VIEW 1: COMPREHENSIVE STUDY GUIDE */}
      {activeStep === 'reader' && (
        <div>
          {outlineData ? (
            <ComprehensiveStudyReader
              outline={outlineData}
              subjectId={selectedSubjectId}
              subjectName={subjectData?.name || 'Selected Course'}
              onRefresh={loadSubjectDetails}
            />
          ) : (
            <div className="bg-white border border-[#E5DCD0] rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
              <Map className="w-10 h-10 text-[#652D3D] mx-auto" />
              <h3 className="text-base font-bold text-[#252222]">Course Outline Required</h3>
              <p className="text-xs text-[#6E5D59] leading-relaxed">
                To generate structured, MBA-level study material, upload your official syllabus or course outline first.
              </p>
              <button
                onClick={() => setActiveStep('outline')}
                className="px-5 py-2.5 rounded-xl bg-[#652D3D] hover:bg-[#522431] text-[#F3EDE3] font-semibold text-xs shadow-md shadow-[#652D3D]/20 cursor-pointer"
              >
                Go to Syllabus Upload
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: COURSE OUTLINE & COVERAGE REPORT */}
      {activeStep === 'outline' && (
        <CourseOutlineCoverageView
          subjectId={selectedSubjectId}
          outline={outlineData}
          stats={outlineStats}
          onRefresh={loadSubjectDetails}
          onNavigateToStudyGuide={() => setActiveStep('reader')}
        />
      )}

      {/* VIEW 3: STUDY RESOURCES (MULTI-DOC UPLOAD) */}
      {activeStep === 'resources' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#252222]">Course Study Resources</h2>
              <p className="text-xs text-[#6E5D59] mt-0.5">
                Upload multiple PowerPoint decks, textbooks, and notes. The AI cross-references all files across the syllabus.
              </p>
            </div>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#652D3D] hover:bg-[#522431] text-[#F3EDE3] font-semibold text-xs shadow-md shadow-[#652D3D]/20 cursor-pointer self-start sm:self-auto"
            >
              <Upload className="w-4 h-4" /> Add Document
            </button>
          </div>

          {subjectData?.documents && subjectData.documents.length > 0 ? (
            <div className="bg-white border border-[#E7DFD5] rounded-2xl divide-y divide-[#EFE7DD] overflow-hidden shadow-sm">
              {subjectData.documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF7F2] transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FAF7F2] text-[#252222] border border-[#E5DCD0] uppercase">
                        {doc.fileType}
                      </span>
                      <Link
                        href={`/documents/${doc.id}`}
                        className="font-semibold text-sm text-[#252222] hover:text-[#652D3D] transition-colors truncate"
                      >
                        {doc.title}
                      </Link>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ready & Chunked
                      </span>
                    </div>

                    <p className="text-xs text-[#6E5D59] line-clamp-1">
                      {doc.summary || 'Indexed into slide chunks for syllabus cross-referencing.'}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-[#6E5D59] pt-1">
                      <span>{doc.pageCount} Pages / Slides</span>
                      <span>•</span>
                      <span>{doc.wordCount?.toLocaleString() || 0} words</span>
                      <span>•</span>
                      <span>{formatBytes(doc.fileSize)}</span>
                      <span>•</span>
                      <span>Added {formatDate(doc.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleDeleteResource(doc.id, doc.title)}
                      className="p-2 text-[#6E5D59] hover:text-rose-600 rounded-lg hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                      title="Delete resource"
                    >
                      Delete
                    </button>
                    <Link
                      href={`/documents/${doc.id}`}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#252222] border border-[#DED4C7] text-xs font-semibold shadow-sm transition-colors"
                    >
                      Inspect Chunks <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E7DFD5] rounded-2xl p-12 text-center space-y-4 shadow-sm">
              <FileSpreadsheet className="w-10 h-10 text-[#6E5D59] mx-auto" />
              <h3 className="text-base font-semibold text-[#252222]">No Study Resources Added</h3>
              <p className="text-xs text-[#6E5D59] max-w-sm mx-auto">
                Upload your lecture PPTs, textbook PDFs, or Word docs. You can associate multiple documents with this subject.
              </p>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#652D3D] hover:bg-[#522431] text-[#F3EDE3] font-semibold text-xs shadow-md shadow-[#652D3D]/20 cursor-pointer"
              >
                <Upload className="w-4 h-4" /> Upload Document
              </button>
            </div>
          )}
        </div>
      )}

      {isUploadOpen && selectedSubjectId && (
        <DocumentUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={() => {
            setIsUploadOpen(false);
            loadSubjectDetails();
          }}
          preselectedSubjectId={selectedSubjectId}
        />
      )}

      {isCreateSubjectOpen && (
        <CreateSubjectModal
          isOpen={isCreateSubjectOpen}
          onClose={() => setIsCreateSubjectOpen(false)}
          onSuccess={(newId) => {
            setIsCreateSubjectOpen(false);
            if (newId) setSelectedSubjectId(newId);
          }}
        />
      )}
    </div>
  );
}
