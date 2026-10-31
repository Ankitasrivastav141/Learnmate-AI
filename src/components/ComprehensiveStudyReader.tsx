'use client';

import { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Bookmark,
  Search,
  Sparkles,
  Maximize2,
  Printer,
  ChevronRight,
  ChevronDown,
  Layers,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Plus,
  HelpCircle,
  FileSpreadsheet,
  Highlighter,
  SlidersHorizontal,
  GraduationCap,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface TopicStudyMaterial {
  id: string;
  topicId: string;
  introduction: string;
  detailedExplanation: string;
  definitions: string;
  businessExamples: string;
  frameworksAndModels: string;
  comparativeTables: string | null;
  keyTakeaways: string;
  potentialQuestions: string;
  sourceReferences: string;
  version: number;
  updatedAt: string;
}

interface OutlineTopic {
  id: string;
  title: string;
  subtopics: string | null;
  coverageStatus: string;
  coverageNotes: string | null;
  sourceCitations: string | null;
  studyMaterial?: TopicStudyMaterial | null;
  bookmarks?: Array<{ id: string }>;
  highlights?: Array<{ id: string; highlightedText: string; color: string }>;
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

interface ComprehensiveStudyReaderProps {
  outline: CourseOutlineData;
  subjectId: string;
  subjectName: string;
  onRefresh: () => void;
}

export function ComprehensiveStudyReader({
  outline,
  subjectId,
  subjectName,
  onRefresh,
}: ComprehensiveStudyReaderProps) {
  // Navigation & selection
  const allTopics = outline.units.flatMap((u) => u.topics);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    allTopics[0]?.id || ''
  );
  const [selectedTopicData, setSelectedTopicData] = useState<any | null>(null);
  const [isLoadingTopic, setIsLoadingTopic] = useState(false);
  const [modifyingMode, setModifyingMode] = useState<string | null>(null);

  // Search & reader features
  const [searchTerm, setSearchTerm] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [readTopics, setReadTopics] = useState<Set<string>>(new Set());
  const [activeQuestionTab, setActiveQuestionTab] = useState<'study' | 'questions'>('study');
  const [questionsList, setQuestionsList] = useState<any[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  // Collapsed unit navigation state
  const [collapsedUnits, setCollapsedUnits] = useState<Record<string, boolean>>({});

  const contentRef = useRef<HTMLDivElement>(null);

  // Load detailed topic data
  useEffect(() => {
    if (!selectedTopicId) return;

    setIsLoadingTopic(true);
    fetch(`/api/topics/${selectedTopicId}/study-material`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedTopicData(data);
        setIsBookmarked(data.bookmarks && data.bookmarks.length > 0);
        setReadTopics((prev) => new Set(prev).add(selectedTopicId));
      })
      .catch((err) => console.error('Error loading topic material:', err))
      .finally(() => setIsLoadingTopic(false));

    // Also fetch exam questions for this topic
    fetch(`/api/topics/${selectedTopicId}/questions`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setQuestionsList(data);
      })
      .catch((err) => console.error('Failed to load questions:', err));
  }, [selectedTopicId]);

  const toggleUnitCollapse = (unitId: string) => {
    setCollapsedUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const handleToggleBookmark = async () => {
    try {
      const res = await fetch(`/api/topics/${selectedTopicId}/bookmarks`, {
        method: 'POST',
      });
      const data = await res.json();
      setIsBookmarked(data.bookmarked);
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const handleModifyTopic = async (mode: 'expand' | 'simplify' | 'add_examples' | 'standard') => {
    setModifyingMode(mode);
    try {
      const res = await fetch(`/api/topics/${selectedTopicId}/study-material`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (data.material) {
        setSelectedTopicData((prev: any) => ({
          ...prev,
          studyMaterial: data.material,
        }));
      }
    } catch (err) {
      console.error('Error modifying topic material:', err);
    } finally {
      setModifyingMode(null);
    }
  };

  const handleGenerateQuestions = async () => {
    setIsGeneratingQuestions(true);
    try {
      const res = await fetch(`/api/topics/${selectedTopicId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionType: 'ALL' }),
      });
      const data = await res.json();
      if (data.questions) {
        setQuestionsList(data.questions);
      }
    } catch (err) {
      console.error('Error generating questions:', err);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const currentTopic = allTopics.find((t) => t.id === selectedTopicId);
  const material = selectedTopicData?.studyMaterial;

  const progressPercent = allTopics.length > 0 ? Math.round((readTopics.size / allTopics.length) * 100) : 0;

  // Parse JSON collections
  let definitions: any[] = [];
  let businessExamples: any[] = [];
  let frameworks: any[] = [];
  let keyTakeaways: string[] = [];
  let potentialQuestions: any[] = [];
  let sourceReferences: any[] = [];

  try {
    if (material?.definitions) definitions = JSON.parse(material.definitions);
    if (material?.businessExamples) businessExamples = JSON.parse(material.businessExamples);
    if (material?.frameworksAndModels) frameworks = JSON.parse(material.frameworksAndModels);
    if (material?.keyTakeaways) keyTakeaways = JSON.parse(material.keyTakeaways);
    if (material?.potentialQuestions) potentialQuestions = JSON.parse(material.potentialQuestions);
    if (material?.sourceReferences) sourceReferences = JSON.parse(material.sourceReferences);
  } catch (err) {
    console.error('Error parsing JSON material fields:', err);
  }

  return (
    <div className="bg-white border border-[#E5DCD0] rounded-2xl overflow-hidden shadow-sm flex flex-col h-[820px]">
      {/* Top Reading Navigation Bar */}
      <div className="px-6 py-3.5 border-b border-[#E5DCD0] bg-[#FAF7F2] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#652D3D] text-[#F3EDE3] flex items-center justify-center shadow-sm">
            <BookOpen className="w-4 h-4 text-[#F3EDE3]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#252222] flex items-center gap-2">
              {subjectName} — Academic Study Suite
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-[#6E5D59]">
              <span>{outline.title}</span>
              <span>•</span>
              <span className="font-mono text-[#252222] font-semibold">
                {readTopics.size} of {allTopics.length} Topics Read ({progressPercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative hidden md:block w-56">
            <Search className="w-3.5 h-3.5 text-[#6E5D59] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search topics or concepts..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-[#DED4C7] text-[#252222] text-xs focus:outline-none focus:border-[#652D3D] placeholder:text-[#6E5D59]/50"
            />
          </div>

          <button
            onClick={handleToggleBookmark}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isBookmarked
                ? 'bg-[#652D3D] border-[#652D3D] text-[#F3EDE3]'
                : 'bg-white border-[#DED4C7] text-[#6E5D59] hover:text-[#252222]'
            }`}
            title={isBookmarked ? 'Bookmarked' : 'Add bookmark'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#F3EDE3]' : ''}`} />
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#DED4C7] text-[#252222] hover:bg-[#FAF7F2] text-xs font-medium cursor-pointer shadow-sm"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-[#652D3D]" />
            Export / Print
          </button>
        </div>
      </div>

      {/* Progress Strip in Burgundy / Dusty Rose / Cream */}
      <div className="w-full bg-[#EFE7DD] h-1">
        <div
          className="bg-gradient-to-r from-[#652D3D] to-[#B58B83] h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Dual-Pane Reading Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sticky Table of Contents (TOC) */}
        <aside className="w-72 md:w-80 border-r border-[#E5DCD0] bg-[#FAF7F2] overflow-y-auto p-4 space-y-4 select-none shrink-0">
          <div className="flex items-center justify-between px-2 text-xs font-semibold uppercase tracking-wider text-[#6E5D59]">
            <span>Course Syllabus TOC</span>
            <span className="font-mono text-[10px] text-[#652D3D] bg-[#652D3D]/10 px-1.5 py-0.5 rounded border border-[#652D3D]/20 font-bold">
              {allTopics.length} Topics
            </span>
          </div>

          <div className="space-y-3">
            {outline.units.map((unit) => {
              const isCollapsed = collapsedUnits[unit.id];
              const filteredTopics = unit.topics.filter(
                (t) =>
                  !searchTerm ||
                  t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  unit.title.toLowerCase().includes(searchTerm.toLowerCase())
              );

              if (searchTerm && filteredTopics.length === 0) return null;

              return (
                <div key={unit.id} className="space-y-1">
                  <button
                    onClick={() => toggleUnitCollapse(unit.id)}
                    className="w-full flex items-center justify-between text-left p-2 rounded-lg hover:bg-[#EFE7DD] transition-colors text-xs font-semibold text-[#252222]"
                  >
                    <span className="truncate pr-2">{unit.title}</span>
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-[#6E5D59] shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-[#6E5D59] shrink-0" />
                    )}
                  </button>

                  {!isCollapsed && (
                    <div className="pl-2 space-y-0.5 border-l border-[#DED4C7] ml-3">
                      {filteredTopics.map((topic) => {
                        const isSelected = selectedTopicId === topic.id;
                        const isRead = readTopics.has(topic.id);
                        const hasMaterial = !!topic.studyMaterial;

                        return (
                          <button
                            key={topic.id}
                            onClick={() => setSelectedTopicId(topic.id)}
                            className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all flex items-start justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-[#652D3D] text-[#F3EDE3] font-semibold shadow-sm'
                                : 'text-[#4F4240] hover:text-[#252222] hover:bg-[#EFE7DD]'
                            }`}
                          >
                            <span className="line-clamp-2 leading-snug">{topic.title}</span>
                            <div className="flex items-center gap-1 shrink-0 pt-0.5">
                              {hasMaterial && (
                                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#F3EDE3]' : 'bg-[#652D3D]'}`} />
                              )}
                              {isRead && (
                                <CheckCircle2 className={`w-3 h-3 ${isSelected ? 'text-[#F3EDE3]' : 'text-emerald-600'}`} />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Reader Canvas */}
        <main
          ref={contentRef}
          className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-white text-[#252222]"
        >
          {isLoadingTopic ? (
            <div className="py-32 text-center text-xs text-[#6E5D59] flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#652D3D]" />
              <span>Synthesizing comprehensive academic study material with Gemini AI...</span>
            </div>
          ) : !material ? (
            /* Topic has not been synthesized yet */
            <div className="bg-[#FAF7F2] border border-[#E5DCD0] rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
              <Sparkles className="w-10 h-10 text-[#652D3D] mx-auto" />
              <h3 className="text-base font-bold text-[#252222]">
                Generate Study Material for &ldquo;{currentTopic?.title}&rdquo;
              </h3>
              <p className="text-xs text-[#6E5D59] leading-relaxed">
                This topic has not been synthesized into comprehensive academic study material yet. Click below to generate the 8-part MBA-level study guide.
              </p>
              <button
                onClick={() => handleModifyTopic('standard')}
                disabled={!!modifyingMode}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#652D3D] hover:bg-[#522431] text-[#F3EDE3] font-semibold text-xs shadow-md shadow-[#652D3D]/20 transition-all cursor-pointer"
              >
                {modifyingMode ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#F3EDE3]" /> Generating with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#F3EDE3]" /> Synthesize Topic Study Guide
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Full 8-Part Academic Study Guide */
            <div className="max-w-4xl mx-auto space-y-10">
              {/* Topic Header & Granular Modifier Bar */}
              <div className="border-b border-[#E5DCD0] pb-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#652D3D] font-mono">
                      {selectedTopicData?.unit?.title || 'Academic Topic'}
                    </span>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#252222] tracking-tight mt-1">
                      {currentTopic?.title}
                    </h1>
                  </div>

                  {/* Topic Metadata & Citations */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E5DCD0] text-[#6E5D59]">
                      v{material.version}
                    </span>
                    {sourceReferences.length > 0 && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#652D3D]/10 text-[#652D3D] border border-[#652D3D]/20 font-medium">
                        {sourceReferences.length} Cited Resource(s)
                      </span>
                    )}
                  </div>
                </div>

                {/* Subtopic Pills */}
                {currentTopic?.subtopics && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-xs text-[#6E5D59] font-medium">Core Subtopics:</span>
                    {JSON.parse(currentTopic.subtopics).map((sub: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-0.5 rounded-md bg-[#FAF7F2] text-[#252222] border border-[#E5DCD0]"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                )}

                {/* Granular Modification Action Bar */}
                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  <span className="text-xs text-[#6E5D59] font-medium flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3 text-[#652D3D]" /> AI Modifiers:
                  </span>

                  <button
                    onClick={() => handleModifyTopic('expand')}
                    disabled={!!modifyingMode}
                    className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#652D3D] hover:text-[#F3EDE3] text-[#252222] border border-[#DED4C7] hover:border-[#652D3D] text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {modifyingMode === 'expand' ? 'Expanding...' : '🔍 Expand Explanation'}
                  </button>

                  <button
                    onClick={() => handleModifyTopic('simplify')}
                    disabled={!!modifyingMode}
                    className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#652D3D] hover:text-[#F3EDE3] text-[#252222] border border-[#DED4C7] hover:border-[#652D3D] text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {modifyingMode === 'simplify' ? 'Simplifying...' : '💡 Simplify with Analogy'}
                  </button>

                  <button
                    onClick={() => handleModifyTopic('add_examples')}
                    disabled={!!modifyingMode}
                    className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#652D3D] hover:text-[#F3EDE3] text-[#252222] border border-[#DED4C7] hover:border-[#652D3D] text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {modifyingMode === 'add_examples' ? 'Adding Cases...' : '🏢 Add Business Examples'}
                  </button>

                  <button
                    onClick={() => handleModifyTopic('standard')}
                    disabled={!!modifyingMode}
                    className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#652D3D] hover:text-[#F3EDE3] text-[#6E5D59] border border-[#DED4C7] text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                    title="Regenerate topic content"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${modifyingMode === 'standard' ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* View Switch: Study Guide vs Exam Questions */}
              <div className="flex items-center gap-4 border-b border-[#E5DCD0] pb-2">
                <button
                  onClick={() => setActiveQuestionTab('study')}
                  className={`text-sm font-semibold pb-2 border-b-2 transition-all cursor-pointer ${
                    activeQuestionTab === 'study'
                      ? 'border-[#652D3D] text-[#652D3D]'
                      : 'border-transparent text-[#6E5D59] hover:text-[#252222]'
                  }`}
                >
                  📖 Comprehensive Study Guide
                </button>
                <button
                  onClick={() => setActiveQuestionTab('questions')}
                  className={`text-sm font-semibold pb-2 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeQuestionTab === 'questions'
                      ? 'border-[#652D3D] text-[#652D3D]'
                      : 'border-transparent text-[#6E5D59] hover:text-[#252222]'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-[#652D3D]" />
                  Examination Question Bank ({questionsList.length})
                </button>
              </div>

              {activeQuestionTab === 'study' ? (
                <>
                  {/* SECTION A: INTRODUCTION */}
                  <section className="space-y-3">
                    <h2 className="text-base font-bold uppercase tracking-wider text-[#252222] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-[#652D3D] text-[#F3EDE3] flex items-center justify-center text-xs font-mono">
                        A
                      </span>
                      Introduction & Strategic Significance
                    </h2>
                    <div className="prose max-w-none text-sm text-[#252222] leading-relaxed bg-[#FAF7F2] p-6 rounded-2xl border border-[#E5DCD0] whitespace-pre-wrap font-sans shadow-sm">
                      {material.introduction}
                    </div>
                  </section>

                  {/* SECTION B: DETAILED EXPLANATION */}
                  <section className="space-y-3">
                    <h2 className="text-base font-bold uppercase tracking-wider text-[#252222] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-[#B58B83] text-[#F3EDE3] font-bold flex items-center justify-center text-xs font-mono">
                        B
                      </span>
                      Comprehensive Detailed Exposition
                    </h2>
                    <div className="prose max-w-none text-sm text-[#252222] leading-relaxed bg-[#FAF7F2] p-6 md:p-8 rounded-2xl border border-[#E5DCD0] whitespace-pre-wrap font-sans shadow-sm">
                      {material.detailedExplanation}
                    </div>
                  </section>

                  {/* SECTION C: IMPORTANT DEFINITIONS */}
                  {definitions.length > 0 && (
                    <section className="space-y-3">
                      <h2 className="text-base font-bold uppercase tracking-wider text-[#252222] flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-[#652D3D] text-[#F3EDE3] flex items-center justify-center text-xs font-mono">
                          C
                        </span>
                        Important Definitions & Terminology
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {definitions.map((def: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-[#FAF7F2] border border-[#E5DCD0] rounded-xl p-5 space-y-2 hover:border-[#B58B83] transition-colors shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-[#252222]">{def.term}</h4>
                              {def.source && (
                                <span className="text-[10px] text-[#652D3D] font-mono font-medium">
                                  {def.source}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#4F4240] leading-relaxed">
                              {def.definition}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* SECTION D: REAL-WORLD BUSINESS EXAMPLES & CASE STUDIES */}
                  {businessExamples.length > 0 && (
                    <section className="space-y-3">
                      <h2 className="text-base font-bold uppercase tracking-wider text-[#252222] flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-[#B58B83] text-[#F3EDE3] font-bold flex items-center justify-center text-xs font-mono">
                          D
                        </span>
                        Real-World Business Applications & Case Studies
                      </h2>
                      <div className="space-y-4">
                        {businessExamples.map((ex: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-[#FFF9F6] border border-[#F3D7CC] rounded-2xl p-6 space-y-3 shadow-sm"
                          >
                            <h4 className="text-sm font-bold text-[#252222] flex items-center gap-2">
                              🏢 {ex.companyOrContext}
                            </h4>
                            <div className="text-xs text-[#4F4240] space-y-1.5 leading-relaxed">
                              <p>
                                <span className="font-semibold text-[#252222]">Scenario / Dilemma: </span>
                                {ex.scenario}
                              </p>
                              <p className="pt-2 border-t border-[#F3D7CC] text-[#652D3D]">
                                <span className="font-semibold text-[#252222]">Strategic Takeaway: </span>
                                {ex.takeaway}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* SECTION E: FRAMEWORKS & MODELS */}
                  {frameworks.length > 0 && (
                    <section className="space-y-3">
                      <h2 className="text-base font-bold uppercase tracking-wider text-[#252222] flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-[#652D3D] text-[#F3EDE3] flex items-center justify-center text-xs font-mono">
                          E
                        </span>
                        Academic Frameworks & Operational Models
                      </h2>
                      <div className="space-y-4">
                        {frameworks.map((fw: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-[#FAF7F2] border border-[#E5DCD0] rounded-2xl p-6 space-y-3 shadow-sm"
                          >
                            <h4 className="text-sm font-bold text-[#252222]">{fw.name}</h4>
                            <p className="text-xs text-[#4F4240] leading-relaxed">
                              {fw.description}
                            </p>
                            {fw.applicationSteps && (
                              <div className="p-4 rounded-xl bg-white border border-[#E5DCD0] text-xs font-mono text-[#252222] whitespace-pre-wrap">
                                {fw.applicationSteps}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* SECTION F: COMPARATIVE TABLES */}
                  {material.comparativeTables && (
                    <section className="space-y-3">
                      <h2 className="text-base font-bold uppercase tracking-wider text-[#252222] flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-[#B58B83] text-[#F3EDE3] font-bold flex items-center justify-center text-xs font-mono">
                          F
                        </span>
                        Comparative Evaluation & Structural Trade-offs
                      </h2>
                      <div className="bg-[#FAF7F2] border border-[#E5DCD0] rounded-2xl p-6 overflow-x-auto shadow-sm">
                        <pre className="text-xs font-mono text-[#252222] whitespace-pre-wrap leading-relaxed">
                          {material.comparativeTables}
                        </pre>
                      </div>
                    </section>
                  )}

                  {/* SECTION G: KEY EXAMINATION TAKEAWAYS */}
                  {keyTakeaways.length > 0 && (
                    <section className="space-y-3">
                      <h2 className="text-base font-bold uppercase tracking-wider text-[#252222] flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-[#652D3D] text-[#F3EDE3] flex items-center justify-center text-xs font-mono">
                          G
                        </span>
                        High-Yield Examination Takeaways
                      </h2>
                      <div className="bg-[#FAF7F2] border border-[#E5DCD0] rounded-2xl p-6 space-y-2.5 shadow-sm">
                        {keyTakeaways.map((takeaway: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 text-xs text-[#252222]">
                            <span className="text-[#652D3D] font-bold">✓</span>
                            <span>{takeaway}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* SECTION H: SOURCE CITATIONS FOOTER */}
                  {sourceReferences.length > 0 && (
                    <section className="pt-6 border-t border-[#E5DCD0] flex items-center justify-between text-xs text-[#6E5D59]">
                      <span>Source Provenance Citations:</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {sourceReferences.map((ref: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#E5DCD0] text-[#252222] font-mono text-[11px]"
                          >
                            {ref.documentTitle} ({ref.pageOrSlide})
                          </span>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              ) : (
                /* EXAMINATION QUESTIONS VIEW */
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-[#252222]">
                        Topic Examination Bank
                      </h3>
                      <p className="text-xs text-[#6E5D59]">
                        MCQs, Conceptual, Short-Answer, Long-Answer Essays, and Business Case Scenarios
                      </p>
                    </div>

                    <button
                      onClick={handleGenerateQuestions}
                      disabled={isGeneratingQuestions}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#652D3D] hover:bg-[#522431] text-[#F3EDE3] font-semibold text-xs shadow-md shadow-[#652D3D]/20 transition-colors cursor-pointer"
                    >
                      {isGeneratingQuestions ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#F3EDE3]" /> Generating with Gemini...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 text-[#F3EDE3]" /> Generate Fresh Question Set
                        </>
                      )}
                    </button>
                  </div>

                  {questionsList.length > 0 ? (
                    <div className="space-y-4">
                      {questionsList.map((q: any, idx: number) => {
                        let parsedOptions: string[] = [];
                        try {
                          if (q.options) parsedOptions = JSON.parse(q.options);
                        } catch {}

                        let rubric: string[] = [];
                        try {
                          if (q.rubricCriteria) rubric = JSON.parse(q.rubricCriteria);
                        } catch {}

                        return (
                          <div
                            key={q.id || idx}
                            className="bg-[#FAF7F2] border border-[#E5DCD0] rounded-2xl p-6 space-y-4 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#652D3D] text-[#F3EDE3]">
                                {q.type}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded bg-white text-[#6E5D59] font-mono border border-[#E5DCD0]">
                                {q.difficulty} Difficulty
                              </span>
                            </div>

                            <p className="text-sm font-semibold text-[#252222] leading-snug">
                              {q.questionText}
                            </p>

                            {/* MCQ Options if available */}
                            {parsedOptions.length > 0 && (
                              <div className="space-y-2">
                                {parsedOptions.map((opt, oIdx) => (
                                  <div
                                    key={oIdx}
                                    className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                                      opt === q.correctAnswer
                                        ? 'bg-[#652D3D]/10 border-[#652D3D] text-[#652D3D] font-semibold'
                                        : 'bg-white border-[#E5DCD0] text-[#252222]'
                                    }`}
                                  >
                                    <span>
                                      {String.fromCharCode(65 + oIdx)}. {opt}
                                    </span>
                                    {opt === q.correctAnswer && (
                                      <span className="text-[#652D3D] font-bold">✓ Correct</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Model Answer & Rubric */}
                            {q.modelAnswer && (
                              <div className="p-4 rounded-xl bg-white border border-[#E5DCD0] text-xs space-y-2">
                                <span className="font-bold text-[#652D3D] block">
                                  💡 Model Answer & Evaluation Rubric:
                                </span>
                                <p className="text-[#4F4240] leading-relaxed whitespace-pre-wrap">
                                  {q.modelAnswer}
                                </p>
                                {rubric.length > 0 && (
                                  <div className="pt-2 border-t border-[#EFE7DD] flex items-center gap-2 flex-wrap text-[11px] text-[#6E5D59]">
                                    <span className="font-semibold text-[#252222]">Grading Criteria:</span>
                                    {rubric.map((r, rIdx) => (
                                      <span key={rIdx} className="px-2 py-0.5 rounded bg-[#FAF7F2] text-[#252222] border border-[#E5DCD0]">
                                        {r}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-xs text-[#6E5D59] bg-[#FAF7F2] rounded-2xl border border-[#E5DCD0]">
                      No examination questions generated for this topic yet. Click above to generate MCQs, conceptual, and case study questions using Gemini.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
