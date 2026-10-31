'use client';

import { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRight,
  BookOpen,
  RotateCcw,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';

interface OutlineTopic {
  id: string;
  title: string;
  subtopics: string | null;
  learningObjective: string | null;
  coverageStatus: string; // FULLY_COVERED, PARTIALLY_COVERED, MISSING
  coverageNotes: string | null;
  sourceCitations: string | null;
  studyMaterial?: { id: string } | null;
}

interface OutlineUnit {
  id: string;
  unitNumber: number;
  title: string;
  description: string | null;
  topics: OutlineTopic[];
}

interface CourseOutlineData {
  id: string;
  title: string;
  fileName: string;
  learningObjectives: string | null;
  expectedOutcomes: string | null;
  units: OutlineUnit[];
}

interface CourseOutlineCoverageViewProps {
  subjectId: string;
  outline: CourseOutlineData | null;
  stats?: {
    totalTopics: number;
    fullyCovered: number;
    partiallyCovered: number;
    missing: number;
    coveragePercentage: number;
    generatedCount: number;
  };
  onRefresh: () => void;
  onNavigateToStudyGuide?: () => void;
}

export function CourseOutlineCoverageView({
  subjectId,
  outline,
  stats,
  onRefresh,
  onNavigateToStudyGuide,
}: CourseOutlineCoverageViewProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generationMsg, setGenerationMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/subjects/${subjectId}/outline`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process course outline');
      }

      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateAllStudyMaterial = async () => {
    setIsGeneratingAll(true);
    setGenerationMsg('Synthesizing comprehensive MBA-level material with Gemini API across syllabus...');
    try {
      const res = await fetch(`/api/subjects/${subjectId}/generate-study-material`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }
      setGenerationMsg(data.message);
      onRefresh();
      setTimeout(() => {
        setGenerationMsg(null);
        if (onNavigateToStudyGuide) onNavigateToStudyGuide();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // If no outline uploaded yet
  if (!outline) {
    return (
      <div className="bg-[#2c2727] border border-[#3a3233] rounded-2xl p-10 md:p-14 text-center max-w-2xl mx-auto space-y-5 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-[#652D3D]/10 border border-[#652D3D]/20 flex items-center justify-center text-[#652D3D] mx-auto shadow-sm">
          <BookOpen className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[#252222] tracking-tight">
            Upload Official Course Outline or Syllabus
          </h2>
          <p className="text-xs text-[#6E5D59] leading-relaxed">
            The course outline acts as the primary organizing backbone. Our AI extracts units, chapters, learning objectives, and expected outcomes, then maps all your lecture slides and textbooks to each topic.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.doc,.pptx,.ppt,.txt"
            className="hidden"
            disabled={isUploading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-6 py-3 rounded-xl bg-[#652D3D] hover:bg-[#522431] text-[#F3EDE3] font-bold text-xs shadow-lg shadow-[#652D3D]/20 transition-all flex items-center gap-2 mx-auto cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#F3EDE3]" /> Extracting Syllabus Structure...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-[#F3EDE3]" /> Upload Course Outline (PDF, DOCX, PPTX)
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  let learningObjectives: string[] = [];
  let expectedOutcomes: string[] = [];
  try {
    if (outline.learningObjectives) learningObjectives = JSON.parse(outline.learningObjectives);
    if (outline.expectedOutcomes) expectedOutcomes = JSON.parse(outline.expectedOutcomes);
  } catch {}

  const allTopics = outline.units.flatMap((u) => u.topics);
  const fullyCount = stats?.fullyCovered || allTopics.filter((t) => t.coverageStatus === 'FULLY_COVERED').length;
  const partialCount = stats?.partiallyCovered || allTopics.filter((t) => t.coverageStatus === 'PARTIALLY_COVERED').length;
  const missingCount = stats?.missing || allTopics.filter((t) => t.coverageStatus === 'MISSING').length;
  const coveragePercent = stats?.coveragePercentage || Math.round(((fullyCount + partialCount * 0.5) / allTopics.length) * 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Syllabus Header & Action Banner */}
      <div className="bg-gradient-to-r from-[#F3EDE3] via-[#FAF7F2] to-white border border-[#E5DCD0] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#652D3D]/10 text-[#652D3D] border border-[#652D3D]/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Official Syllabus Backbone
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#252222] tracking-tight">
            {outline.title}
          </h1>
          <p className="text-xs text-[#4F4240]">
            Active syllabus extracted from <span className="text-[#252222] font-mono font-semibold">{outline.fileName}</span>. All uploaded study resources are cross-referenced against these units and topics.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.doc,.pptx,.ppt,.txt"
            className="hidden"
            disabled={isUploading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isGeneratingAll}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#252222] font-semibold text-xs border border-[#DED4C7] shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#652D3D] ${isUploading ? 'animate-spin' : ''}`} />
            Replace Syllabus
          </button>

          <button
            onClick={handleGenerateAllStudyMaterial}
            disabled={isGeneratingAll}
            className="px-6 py-2.5 rounded-xl bg-[#652D3D] hover:bg-[#522431] text-[#F3EDE3] font-bold text-xs shadow-md shadow-[#652D3D]/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            {isGeneratingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#F3EDE3]" /> Synthesizing with Gemini...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#F3EDE3]" /> Generate Comprehensive Study Material
              </>
            )}
          </button>
        </div>
      </div>

      {generationMsg && (
        <div className="p-4 bg-[#652D3D]/10 border border-[#652D3D]/30 rounded-xl text-[#652D3D] text-xs flex items-center gap-2.5 font-medium">
          <Sparkles className="w-4 h-4 text-[#652D3D] shrink-0" />
          <span>{generationMsg}</span>
        </div>
      )}

      {/* Coverage Diagnostics Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E7DFD5] rounded-xl p-5 space-y-1 shadow-sm">
          <span className="text-xs uppercase font-semibold text-[#6E5D59]">Total Topics</span>
          <p className="text-2xl font-bold text-[#252222] font-mono">{allTopics.length}</p>
          <span className="text-[11px] text-[#6E5D59]">Across {outline.units.length} Units</span>
        </div>

        <div className="bg-white border border-[#E7DFD5] rounded-xl p-5 space-y-1 shadow-sm">
          <span className="text-xs uppercase font-semibold text-emerald-700">Fully Covered</span>
          <p className="text-2xl font-bold text-emerald-700 font-mono">{fullyCount}</p>
          <span className="text-[11px] text-[#6E5D59]">Extensive source slides</span>
        </div>

        <div className="bg-white border border-[#E7DFD5] rounded-xl p-5 space-y-1 shadow-sm">
          <span className="text-xs uppercase font-semibold text-amber-700">Partially Covered</span>
          <p className="text-2xl font-bold text-amber-700 font-mono">{partialCount}</p>
          <span className="text-[11px] text-[#6E5D59]">Brief citations found</span>
        </div>

        <div className="bg-white border border-[#E7DFD5] rounded-xl p-5 space-y-1 shadow-sm">
          <span className="text-xs uppercase font-semibold text-rose-700">Missing Material</span>
          <p className="text-2xl font-bold text-rose-700 font-mono">{missingCount}</p>
          <span className="text-[11px] text-[#6E5D59]">Requires additional resources</span>
        </div>
      </div>

      {/* Learning Objectives & Expected Outcomes Accordion */}
      {(learningObjectives.length > 0 || expectedOutcomes.length > 0) && (
        <div className="bg-white border border-[#E7DFD5] rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-[#252222] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#652D3D]" />
            Course Objectives & Expected Outcomes
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {learningObjectives.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#652D3D]">
                  Learning Objectives
                </span>
                <ul className="space-y-1.5 text-xs text-[#4F4240]">
                  {learningObjectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#652D3D] font-bold">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {expectedOutcomes.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#652D3D]">
                  Expected Course Outcomes
                </span>
                <ul className="space-y-1.5 text-xs text-[#4F4240]">
                  {expectedOutcomes.map((out, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{out}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unit-by-Unit Course Outline Coverage Matrix */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#252222]">Course Outline & Mapping Report</h2>
            <p className="text-xs text-[#6E5D59]">
              Correlating each syllabus topic against your uploaded PowerPoint decks and documents
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {outline.units.map((unit) => (
            <div
              key={unit.id}
              className="bg-white border border-[#E7DFD5] rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#E5DCD0] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#252222]">{unit.title}</h3>
                  {unit.description && (
                    <p className="text-xs text-[#6E5D59] mt-0.5">{unit.description}</p>
                  )}
                </div>
                <span className="text-xs font-mono text-[#652D3D] bg-white px-2 py-0.5 rounded border border-[#E5DCD0] font-semibold">
                  {unit.topics.length} Topics
                </span>
              </div>

              <div className="divide-y divide-[#EFE7DD]">
                {unit.topics.map((topic) => {
                  let subtopics: string[] = [];
                  try {
                    if (topic.subtopics) subtopics = JSON.parse(topic.subtopics);
                  } catch {}

                  let citations: any[] = [];
                  try {
                    if (topic.sourceCitations) citations = JSON.parse(topic.sourceCitations);
                  } catch {}

                  return (
                    <div
                      key={topic.id}
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF7F2] transition-colors"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="font-semibold text-sm text-[#252222]">{topic.title}</h4>

                          {/* Coverage status pill */}
                          {topic.coverageStatus === 'FULLY_COVERED' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Fully Covered
                            </span>
                          )}
                          {topic.coverageStatus === 'PARTIALLY_COVERED' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-600" /> Partially Covered
                            </span>
                          )}
                          {topic.coverageStatus === 'MISSING' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                              <HelpCircle className="w-3 h-3 text-rose-600" /> Missing Material
                            </span>
                          )}
                        </div>

                        {/* Subtopics */}
                        {subtopics.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-[#6E5D59] flex-wrap">
                            <span className="text-[#652D3D] font-medium">Subtopics:</span>
                            {subtopics.map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E5DCD0] text-[11px] text-[#252222]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Citation Badges */}
                        {citations.length > 0 ? (
                          <div className="flex items-center gap-2 pt-1 flex-wrap text-xs text-[#6E5D59]">
                            <span className="font-medium text-[#652D3D]">Sources:</span>
                            {citations.map((c, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-0.5 rounded-md bg-[#FAF7F2] text-[#252222] border border-[#E5DCD0] text-[11px] font-mono"
                              >
                                {c.documentTitle} (Slides {c.slidesOrPages.join(', ')})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-rose-600 italic pt-0.5">
                            No matching slides or documents found. Upload relevant lecture PPTs to ground this topic.
                          </p>
                        )}
                      </div>

                      {/* Right: Study Material Status & Action */}
                      <div className="shrink-0 flex items-center gap-3">
                        {topic.studyMaterial ? (
                          <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Synthesized
                          </span>
                        ) : (
                          <span className="text-xs text-[#6E5D59] italic">Not Synthesized</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
