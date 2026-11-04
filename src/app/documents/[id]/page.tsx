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
  const [termResult, setTermResult] = useState<any | null>(null);

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
          context: `Document: ${doc?.title || ''}. Subject: ${doc?.subject?.name || ''}`,
        }),
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
    fetch(`/api/documents/${params.id}`, { cache: 'no-store' })
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
      <div className="py-24 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span>Loading AI Study Pack...</span>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="py-20 text-center space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Document Not Found</h2>
        <Link href="/documents" className="text-xs text-blue-600 hover:underline">
          Return to documents directory
        </Link>
      </div>
    );
  }

  const filteredNotes = doc.notes.filter(
    (n) => selectedTopicId === 'ALL' || n.topicId === selectedTopicId
  );
  const filteredConcepts = doc.concepts.filter(
    (c) => selectedTopicId === 'ALL' || c.topicId === selectedTopicId
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Top Breadcrumb & Metadata */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/documents" className="hover:text-slate-900 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Documents
          </Link>
          <span>/</span>
          <Link
            href={`/subjects/${doc.subject.id}`}
            className="hover:underline flex items-center gap-1 font-semibold"
            style={{ color: doc.subject.color }}
          >
            {doc.subject.name}
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-xs">{doc.title}</span>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-blue-600' : ''}`} />
          {isRegenerating ? 'Regenerating Material...' : 'Regenerate Study Pack'}
        </button>
      </div>

      {/* 2. Document Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                {doc.fileType}
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                {doc.title}
              </h1>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              {doc.summary || 'Academic study pack automatically indexed and grounded from uploaded material.'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-600 font-mono shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-slate-900 font-bold block">{doc.pageCount}</span>
              <span className="text-[10px] text-slate-500">Pages/Slides</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-slate-900 font-bold block">{doc.wordCount.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500">Words</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-slate-900 font-bold block">{doc.questions.length}</span>
              <span className="text-[10px] text-slate-500">MCQs</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Study Notes ({doc.notes.length})
          </button>

          <button
            onClick={() => setActiveTab('concepts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'concepts'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            Concepts & Glossary ({doc.concepts.length})
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'flashcards'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Practice Quiz
          </button>

          <button
            onClick={() => setActiveTab('source')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'source'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Extracted Text
          </button>
        </div>
      </div>

      {/* Topic Filter Bar */}
      {(activeTab === 'notes' || activeTab === 'concepts') && doc.topics.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1 shrink-0">
            <ListFilter className="w-3 h-3" /> Filter by Topic:
          </span>
          <button
            onClick={() => setSelectedTopicId('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              selectedTopicId === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Topics ({doc.topics.length})
          </button>
          {doc.topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTopicId(t.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                selectedTopicId === t.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>
      )}

      {/* AI Term Explainer Toolbar */}
      {(activeTab === 'notes' || activeTab === 'concepts') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900">AI Term & Acronym Explainer</h4>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  On-Demand
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Look up any slide term, formula, or concept for textbook-grade definitions and plain-English intuition.
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
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Marginal Utility, Indifference Curve..."
                  value={lookupTerm}
                  onChange={(e) => setLookupTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={isLookingUp || !lookupTerm.trim()}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
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
            <div className="bg-slate-50 border border-blue-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="text-base font-bold text-blue-900">{termResult.term}</h5>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                      {termResult.citations || 'Academic Standard Definition'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed mt-1">
                    {termResult.definition}
                  </p>
                </div>
                <button
                  onClick={() => setTermResult(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-white transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {termResult.plainEnglish && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-amber-900 leading-relaxed">
                    <strong className="font-semibold text-amber-950">In Plain English:</strong> {termResult.plainEnglish}
                  </div>
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
                className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    {note.title}
                  </h3>
                  <button
                    onClick={() => handleCopyNote(note.id, note.markdownContent)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:border-blue-300 transition-colors cursor-pointer"
                  >
                    {copiedNoteId === note.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" /> Copy Notes
                      </>
                    )}
                  </button>
                </div>

                <div className="prose max-w-none text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {note.markdownContent}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500 shadow-sm">
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
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2.5 shadow-sm hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{concept.term}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {concept.importance || 'Key Concept'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{concept.definition}</p>
              </div>
            ))
          ) : (
            <div className="col-span-2 bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500 shadow-sm">
              No concept definitions found for this filter.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FLASHCARDS */}
      {activeTab === 'flashcards' && (
        <div className="space-y-4">
          {doc.flashcards.length > 0 ? (
            <FlashcardDeck
              flashcards={doc.flashcards.map((f) => ({
                id: f.id,
                front: f.front,
                back: f.back,
                difficulty: f.difficulty,
                topic: f.topic?.title || 'General',
              }))}
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500 shadow-sm">
              No flashcards generated for this document yet.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PRACTICE QUIZ */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          {isStartingQuiz ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-xs">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              Initializing 10-Question Practice Quiz...
            </div>
          ) : quizSessionId && quizQuestions.length > 0 ? (
            <QuizRunner
              sessionId={quizSessionId}
              quizTitle={`Practice Quiz: ${doc.title}`}
              questions={quizQuestions}
              onRetake={() => startQuiz()}
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <GraduationCap className="w-8 h-8 text-blue-600 mx-auto" />
              <h3 className="font-bold text-sm text-slate-800">Ready to test your understanding?</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Take a 10-question practice quiz generated directly from this document.
              </p>
              <button
                onClick={startQuiz}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Start Practice Quiz Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SOURCE TEXT */}
      {activeTab === 'source' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">Extracted Raw Text</h3>
            <span className="text-xs text-slate-500 font-mono">
              {doc.rawText.length.toLocaleString()} characters
            </span>
          </div>
          <pre className="p-4 bg-slate-50 rounded-xl text-xs text-slate-700 whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto leading-relaxed border border-slate-200">
            {doc.rawText}
          </pre>
        </div>
      )}
    </div>
  );
}
