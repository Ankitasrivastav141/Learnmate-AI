'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  BookOpen,
  BrainCircuit,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Copy,
  Check,
  Code2,
  ListFilter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Layers,
  Search,
  BookMarked,
  Lightbulb,
  X,
} from 'lucide-react';
import { FlashcardDeck } from '@/components/FlashcardDeck';
import { QuizRunner } from '@/components/QuizRunner';
import { formatBytes, formatDate } from '@/lib/utils';

interface DocumentDetail {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  rawText: string;
  status: string;
  summary: string | null;
  pageCount: number;
  wordCount: number;
  createdAt: string;
  subject: {
    id: string;
    name: string;
    color: string;
  };
  topics: Array<{
    id: string;
    title: string;
    summary: string | null;
  }>;
  concepts: Array<{
    id: string;
    term: string;
    definition: string;
    importance: string;
    topicId: string | null;
  }>;
  notes: Array<{
    id: string;
    title: string;
    markdownContent: string;
    topicId: string | null;
  }>;
  flashcards: Array<{
    id: string;
    front: string;
    back: string;
    difficulty: string;
    topic?: { title: string } | null;
  }>;
  questions: Array<{
    id: string;
    type: string;
    questionText: string;
    options: string;
    correctAnswer: string;
    explanation: string;
    difficulty: string;
    topic?: { title: string } | null;
  }>;
}

type TabType = 'notes' | 'concepts' | 'flashcards' | 'quiz' | 'source';

export default function DocumentStudyHubPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('notes');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('ALL');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Quiz state
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);

  // AI Term Explainer state
  const [lookupTerm, setLookupTerm] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [termResult, setTermResult] = useState<{
    term: string;
    definition: string;
    plainEnglish: string;
    keyMechanics: string[];
    realWorldExample: string;
    commonPitfall: string;
    citations: string;
  } | null>(null);

  const handleLookupTerm = async (termToLookup?: string) => {
    const target = (termToLookup || lookupTerm).trim();
    if (!target) return;
    if (termToLookup) setLookupTerm(termToLookup);
    setIsLookingUp(true);
    try {
      const res = await fetch('/api/ai/define-term', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: target,
          context: `Document: ${doc?.title || ''}. Subject: ${doc?.subject?.name || ''}`
        })
      });
      const data = await res.json();
      if (data && !data.error) {
        setTermResult(data);
      }
    } catch (e) {
      console.error('Failed to lookup term:', e);
    } finally {
      setIsLookingUp(false);
    }
  };

  const loadDocument = () => {
    setIsLoading(true);
    fetch(`/api/documents/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setDoc(data);
        }
      })
      .catch((err) => console.error('Error loading document:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadDocument();
  }, [params.id]);

  const handleRegenerate = async () => {
    if (!confirm('Regenerate all notes, flashcards, and quizzes using the AI engine?')) return;
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/documents/${params.id}/regenerate`, { method: 'POST' });
      if (res.ok) {
        loadDocument();
      }
    } catch (err) {
      console.error('Failed to regenerate:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyNote = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNoteId(id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  const startQuiz = async () => {
    setIsStartingQuiz(true);
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: params.id, questionCount: 10 }),
      });
      const data = await res.json();
      if (data.sessionId && data.questions) {
        setQuizSessionId(data.sessionId);
        setQuizQuestions(data.questions);
      }
    } catch (err) {
      console.error('Failed to launch quiz:', err);
    } finally {
      setIsStartingQuiz(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-[#6E5D59] text-sm flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#652D3D]" />
        <span>Loading AI Study Pack...</span>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="py-20 text-center space-y-3">
        <h2 className="text-lg font-bold text-[#252222]">Document Not Found</h2>
        <Link href="/documents" className="text-xs text-[#652D3D] hover:underline">
          Return to documents directory
        </Link>
      </div>
    );
  }

  // Filter notes and concepts by topic if selected
  const filteredNotes = doc.notes.filter(
    (n) => selectedTopicId === 'ALL' || n.topicId === selectedTopicId
  );
  const filteredConcepts = doc.concepts.filter(
    (c) => selectedTopicId === 'ALL' || c.topicId === selectedTopicId
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Metadata */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-[#6E5D59]">
          <Link href="/documents" className="hover:text-[#252222] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Documents
          </Link>
          <span>/</span>
          <Link
            href={`/subjects/${doc.subject.id}`}
            className="hover:underline flex items-center gap-1 font-medium"
            style={{ color: doc.subject.color }}
          >
            {doc.subject.name}
          </Link>
          <span>/</span>
          <span className="text-[#252222] font-semibold truncate max-w-xs">{doc.title}</span>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-[#FAF7F2] text-[#252222] border border-[#DED4C7] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
          {isRegenerating ? 'Regenerating Material...' : 'Regenerate Pack'}
        </button>
      </div>

      {/* Document Overview Banner */}
      <div className="bg-white border border-[#E5DCD0] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#652D3D]/10 text-[#652D3D] border border-[#652D3D]/20 uppercase">
                {doc.fileType}
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-[#252222] tracking-tight">
                {doc.title}
              </h1>
            </div>
            <p className="text-xs text-[#6E5D59] leading-relaxed max-w-3xl">
              {doc.summary || 'Academic study pack automatically indexed and grounded from uploaded material.'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#6E5D59] font-mono shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E5DCD0] text-center">
              <span className="text-[#252222] font-bold block">{doc.pageCount}</span>
              <span className="text-[10px] text-[#6E5D59]">Pages/Slides</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E5DCD0] text-center">
              <span className="text-[#252222] font-bold block">{doc.wordCount.toLocaleString()}</span>
              <span className="text-[10px] text-[#6E5D59]">Words</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E5DCD0] text-center">
              <span className="text-[#252222] font-bold block">{doc.questions.length}</span>
              <span className="text-[10px] text-[#6E5D59]">MCQs</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#E5DCD0] overflow-x-auto">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-[#652D3D] text-[#F3EDE3] shadow-md shadow-[#652D3D]/20'
                : 'text-[#6E5D59] hover:text-[#252222] hover:bg-[#FAF7F2]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Study Notes ({doc.notes.length})
          </button>

          <button
            onClick={() => setActiveTab('concepts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'concepts'
                ? 'bg-[#652D3D] text-[#F3EDE3] shadow-md shadow-[#652D3D]/20'
                : 'text-[#6E5D59] hover:text-[#252222] hover:bg-[#FAF7F2]'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            Concepts & Glossary ({doc.concepts.length})
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'flashcards'
                ? 'bg-[#652D3D] text-[#F3EDE3] shadow-md shadow-[#652D3D]/20'
                : 'text-[#6E5D59] hover:text-[#252222] hover:bg-[#FAF7F2]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Flashcard Trainer ({doc.flashcards.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('quiz');
              if (!quizSessionId) startQuiz();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'quiz'
                ? 'bg-[#652D3D] text-[#F3EDE3] shadow-md shadow-[#652D3D]/20'
                : 'text-[#6E5D59] hover:text-[#252222] hover:bg-[#FAF7F2]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            10-Question Practice Quiz
          </button>

          <button
            onClick={() => setActiveTab('source')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'source'
                ? 'bg-[#652D3D] text-[#F3EDE3] shadow-md shadow-[#652D3D]/20'
                : 'text-[#6E5D59] hover:text-[#252222] hover:bg-[#FAF7F2]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Extracted Raw Text
          </button>
        </div>
      </div>

      {/* Topic Filter Pill Bar (applicable for Notes & Concepts) */}
      {(activeTab === 'notes' || activeTab === 'concepts') && doc.topics.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-xs text-[#6E5D59] font-medium flex items-center gap-1 shrink-0">
            <ListFilter className="w-3 h-3" /> Filter by Topic:
          </span>
          <button
            onClick={() => setSelectedTopicId('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
              selectedTopicId === 'ALL'
                ? 'bg-[#652D3D] text-[#F3EDE3]'
                : 'text-[#6E5D59] hover:text-[#252222] hover:bg-white'
            }`}
          >
            All Topics ({doc.topics.length})
          </button>
          {doc.topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTopicId(t.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                selectedTopicId === t.id
                  ? 'bg-[#652D3D] text-[#F3EDE3]'
                  : 'text-[#6E5D59] hover:text-[#252222] hover:bg-white'
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>
      )}

      {/* On-Demand AI Term Explainer Toolbar for Notes and Concepts */}
      {(activeTab === 'notes' || activeTab === 'concepts') && (
        <div className="bg-white border border-[#E5DCD0] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#652D3D]" />
                <h4 className="text-sm font-bold text-[#252222]">AI Term & Acronym Explainer</h4>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#652D3D]/10 text-[#652D3D]">
                  On-Demand AI
                </span>
              </div>
              <p className="text-xs text-[#6E5D59]">
                Look up any slide term, formula, acronym, or model for instant textbook-grade academic definitions and plain-English intuition.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookupTerm();
              }}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <div className="relative flex-1 sm:w-72">
                <Search className="w-3.5 h-3.5 text-[#6E5D59] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. EBITDA, Backprop, VRIO, CAPM..."
                  value={lookupTerm}
                  onChange={(e) => setLookupTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#DED4C7] bg-[#FAF7F2] text-xs text-[#252222] focus:outline-none focus:ring-2 focus:ring-[#652D3D]/20 focus:border-[#652D3D] transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isLookingUp || !lookupTerm.trim()}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#652D3D] hover:bg-[#4E222F] text-[#F3EDE3] transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                {isLookingUp ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Defining...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Define
                  </>
                )}
              </button>
            </form>
          </div>

          {/* AI Definition Result Card */}
          {termResult && (
            <div className="bg-[#FAF7F2] border border-[#652D3D]/30 rounded-xl p-4 space-y-3 animate-in fade-in-50 duration-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="text-base font-bold text-[#652D3D]">{termResult.term}</h5>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E5DCD0] text-[#6E5D59]">
                      {termResult.citations || 'Academic Standard Definition'}
                    </span>
                  </div>
                  <p className="text-xs text-[#252222] font-serif leading-relaxed mt-1">
                    {termResult.definition}
                  </p>
                </div>
                <button
                  onClick={() => setTermResult(null)}
                  className="text-[#6E5D59] hover:text-[#252222] p-1 rounded-md hover:bg-white transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {termResult.plainEnglish && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 flex items-start gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-amber-900 leading-relaxed">
                    <strong className="font-semibold text-amber-950">In Plain English:</strong> {termResult.plainEnglish}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px]">
                {termResult.keyMechanics && termResult.keyMechanics.length > 0 && (
                  <div className="bg-white border border-[#E5DCD0] rounded-lg p-2.5 space-y-1">
                    <span className="font-semibold text-[#252222] block">⚙️ How It Works:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[#4F4240]">
                      {termResult.keyMechanics.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(termResult.realWorldExampleText || termResult.realWorldExample) && (
                  <div className="bg-white border border-[#E5DCD0] rounded-lg p-2.5 space-y-1">
                    <span className="font-semibold text-[#252222] block">🌍 Real-World Application:</span>
                    <p className="text-[#4F4240] leading-relaxed">
                      {termResult.realWorldExampleText ||
                        (typeof termResult.realWorldExample === 'object'
                          ? `${termResult.realWorldExample?.scenario || ''} ${termResult.realWorldExample?.howItApplies || ''}`.trim()
                          : termResult.realWorldExample)}
                    </p>
                  </div>
                )}
              </div>

              {termResult.commonPitfall && (
                <div className="text-[11px] text-red-900 bg-red-50/70 border border-red-200/70 rounded-lg p-2">
                  <strong>⚠️ Common Exam Pitfall:</strong> {termResult.commonPitfall}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: STUDY NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-white border border-[#E5DCD0] rounded-2xl p-6 md:p-8 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-4">
                  <h3 className="text-base font-bold text-[#252222] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#652D3D]" />
                    {note.title}
                  </h3>
                  <button
                    onClick={() => handleCopyNote(note.id, note.markdownContent)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E5DCD0] text-xs text-[#252222] hover:border-[#652D3D] transition-colors cursor-pointer"
                  >
                    {copiedNoteId === note.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#652D3D]" /> Copy Notes
                      </>
                    )}
                  </button>
                </div>

                <div className="prose max-w-none text-sm text-[#252222] whitespace-pre-wrap font-sans leading-relaxed">
                  {note.markdownContent}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-[#E5DCD0] rounded-2xl p-12 text-center text-xs text-[#6E5D59] shadow-sm">
              No study notes found for this topic filter.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONCEPTS & GLOSSARY */}
      {activeTab === 'concepts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredConcepts.length > 0 ? (
            filteredConcepts.map((concept) => (
              <div
                key={concept.id}
                className="bg-white border border-[#E5DCD0] rounded-xl p-5 space-y-2.5 shadow-sm hover:border-[#B58B83] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#252222]">{concept.term}</h4>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      concept.importance === 'High'
                        ? 'bg-[#652D3D]/10 text-[#652D3D] border border-[#652D3D]/20'
                        : 'bg-[#FAF7F2] text-[#6E5D59] border border-[#E5DCD0]'
                    }`}
                  >
                    {concept.importance} Priority
                  </span>
                </div>
                <p className="text-xs text-[#4F4240] leading-relaxed">{concept.definition}</p>
                <div className="pt-2 border-t border-[#F3EDE3] flex items-center justify-end">
                  <button
                    onClick={() => {
                      handleLookupTerm(concept.term);
                      window.scrollTo({ top: 320, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#652D3D] hover:text-[#4E222F] transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Deep Explain with AI
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 bg-white border border-[#E5DCD0] rounded-2xl p-12 text-center text-xs text-[#6E5D59] shadow-sm">
              No concepts found.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FLASHCARDS TRAINER */}
      {activeTab === 'flashcards' && (
        <div className="py-4">
          <FlashcardDeck cards={doc.flashcards} />
        </div>
      )}

      {/* TAB 4: 10-QUESTION PRACTICE QUIZ */}
      {activeTab === 'quiz' && (
        <div className="py-4">
          {isStartingQuiz ? (
            <div className="py-20 text-center text-xs text-[#6E5D59] flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#652D3D]" />
              <span>Preparing 10-question practice set...</span>
            </div>
          ) : quizSessionId && quizQuestions.length > 0 ? (
            <QuizRunner
              sessionId={quizSessionId}
              quizTitle={`Quiz: ${doc.title}`}
              questions={quizQuestions}
              onComplete={() => console.log('Quiz completed')}
            />
          ) : (
            <div className="bg-white border border-[#E5DCD0] rounded-2xl p-12 text-center space-y-4 shadow-sm">
              <GraduationCap className="w-10 h-10 text-[#B58B83] mx-auto" />
              <h3 className="text-base font-bold text-[#252222]">Start Practice Quiz</h3>
              <p className="text-xs text-[#6E5D59] max-w-sm mx-auto">
                Test your mastery with a 10-question practice exam strictly grounded in this document.
              </p>
              <button
                onClick={startQuiz}
                className="px-5 py-2.5 rounded-xl bg-[#652D3D] hover:bg-[#7b374a] text-[#F3EDE3] font-semibold text-xs shadow-md shadow-[#652D3D]/20 cursor-pointer"
              >
                Launch 10-Question Set
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SOURCE DOCUMENT TEXT */}
      {activeTab === 'source' && (
        <div className="bg-white border border-[#E5DCD0] rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-[#6E5D59] pb-2 border-b border-[#E5DCD0]">
            <span>Raw text extracted from {doc.fileName}</span>
            <span>{doc.rawText.length.toLocaleString()} characters</span>
          </div>
          <pre className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5DCD0] text-xs font-mono text-[#252222] max-h-[500px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {doc.rawText || 'No text content extracted.'}
          </pre>
        </div>
      )}
    </div>
  );
}
