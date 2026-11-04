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
  Download,
  Bookmark,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { FlashcardDeck } from '@/components/FlashcardDeck';
import { QuizRunner } from '@/components/QuizRunner';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
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
  const [showQuickRevisionOnly, setShowQuickRevisionOnly] = useState(false);

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

  const handleDownloadNotes = () => {
    if (!doc || doc.notes.length === 0) return;
    const allNotesText = doc.notes
      .map((n) => `${n.title}\n${'='.repeat(n.title.length)}\n\n${n.markdownContent}\n\n`)
      .join('\n---\n\n');

    const blob = new Blob([allNotesText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Notes.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      <div className="py-24 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
        <span>Loading AI Study Pack...</span>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="py-20 text-center space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Document Not Found</h2>
        <Link href="/documents" className="text-xs text-[#2563EB] hover:underline">
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
      {/* 1. Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <Link href="/documents" className="hover:text-[#111827] flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Documents
          </Link>
          <span>/</span>
          <Link
            href={`/subjects/${doc.subject.id}`}
            className="hover:underline flex items-center gap-1 font-semibold text-[#1E3A8A]"
          >
            {doc.subject.name}
          </Link>
          <span>/</span>
          <span className="text-[#111827] font-semibold truncate max-w-xs">{doc.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadNotes}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-[#111827] border border-[#E2E8F0] shadow-sm transition-colors cursor-pointer"
            title="Download Notes as Markdown / Text"
          >
            <Download className="w-3.5 h-3.5 text-[#2563EB]" />
            Download Notes
          </button>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-[#111827] border border-[#E2E8F0] shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-[#2563EB]' : 'text-[#64748B]'}`} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate Notes'}
          </button>
        </div>
      </div>

      {/* 2. Document Overview Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-[#1E3A8A] border border-blue-200 uppercase">
                {doc.fileType}
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-[#111827] tracking-tight">
                {doc.title}
              </h1>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed max-w-3xl">
              {doc.summary || 'Academic study pack automatically indexed and grounded from uploaded material.'}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#64748B] font-mono shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
              <span className="text-[#111827] font-bold block">{doc.pageCount}</span>
              <span className="text-[10px] text-[#64748B]">Pages/Slides</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
              <span className="text-[#111827] font-bold block">{doc.notes.length}</span>
              <span className="text-[10px] text-[#64748B]">Notes</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
              <span className="text-[#111827] font-bold block">{doc.questions.length}</span>
              <span className="text-[10px] text-[#64748B]">MCQs</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#E2E8F0] overflow-x-auto">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-[#1E3A8A] text-white shadow-sm'
                : 'text-[#475569] hover:text-[#111827] hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Study Notes ({doc.notes.length})
          </button>

          <button
            onClick={() => setActiveTab('concepts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'concepts'
                ? 'bg-[#1E3A8A] text-white shadow-sm'
                : 'text-[#475569] hover:text-[#111827] hover:bg-slate-50'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            Key Concepts ({doc.concepts.length})
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'flashcards'
                ? 'bg-[#1E3A8A] text-white shadow-sm'
                : 'text-[#475569] hover:text-[#111827] hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Flashcards ({doc.flashcards.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('quiz');
              if (!quizSessionId) startQuiz();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'quiz'
                ? 'bg-[#1E3A8A] text-white shadow-sm'
                : 'text-[#475569] hover:text-[#111827] hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Practice Quiz
          </button>

          <button
            onClick={() => setActiveTab('source')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'source'
                ? 'bg-[#1E3A8A] text-white shadow-sm'
                : 'text-[#475569] hover:text-[#111827] hover:bg-slate-50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Extracted Text
          </button>
        </div>
      </div>

      {/* 3. TAB 1: STUDY NOTES (DIGITAL TEXTBOOK REDESIGN) */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          {/* Notes Controls & Table of Contents Bar */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Clickable Table of Contents Jump Links */}
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <span className="text-xs font-bold text-[#111827] flex items-center gap-1 shrink-0 mr-1">
                <Bookmark className="w-3.5 h-3.5 text-[#2563EB]" /> Jump to Topic:
              </span>
              <button
                onClick={() => setSelectedTopicId('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                  selectedTopicId === 'ALL'
                    ? 'bg-[#1E3A8A] text-white shadow-sm'
                    : 'text-[#475569] hover:text-[#111827] hover:bg-slate-100'
                }`}
              >
                All Topics ({doc.notes.length})
              </button>
              {doc.topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTopicId(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer truncate max-w-[200px] ${
                    selectedTopicId === t.id
                      ? 'bg-[#1E3A8A] text-white shadow-sm'
                      : 'text-[#475569] hover:text-[#111827] hover:bg-slate-100'
                  }`}
                  title={t.title}
                >
                  {t.title}
                </button>
              ))}
            </div>

            {/* Quick Revision Notes Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowQuickRevisionOnly(!showQuickRevisionOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                  showQuickRevisionOnly
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-[#E2E8F0] hover:bg-amber-50 hover:text-amber-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                {showQuickRevisionOnly ? 'Viewing Quick Revision' : 'Quick Revision View'}
              </button>
            </div>
          </div>

          {/* Render Notes with MarkdownRenderer */}
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <article
                key={note.id}
                id={`note-${note.id}`}
                className="bg-white border border-[#E2E8F0] rounded-2xl p-6 md:p-10 shadow-sm space-y-6"
              >
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#1E3A8A]">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#111827]">
                        {note.title}
                      </h2>
                      <span className="text-[11px] text-[#64748B]">Digital Textbook Notes</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyNote(note.id, note.markdownContent)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-[#E2E8F0] text-xs font-semibold text-[#111827] hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    {copiedNoteId === note.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#15803D]" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#64748B]" /> Copy Notes
                      </>
                    )}
                  </button>
                </div>

                {/* Professional Rich-Text Textbook Renderer */}
                <MarkdownRenderer content={note.markdownContent} />
              </article>
            ))
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center text-xs text-[#64748B] shadow-sm">
              No study notes found for this topic filter.
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: KEY CONCEPTS */}
      {activeTab === 'concepts' && (
        <div className="space-y-4">
          {/* Simple Term Lookup */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Important Concepts & Terminology</h3>
              <p className="text-xs text-[#64748B]">Definitions and core theories extracted from your material</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookupTerm();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Explain any term..."
                  value={lookupTerm}
                  onChange={(e) => setLookupTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-slate-50 text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB] w-48 sm:w-60"
                />
              </div>
              <button
                type="submit"
                disabled={isLookingUp || !lookupTerm.trim()}
                className="px-3 py-1.5 bg-[#1E3A8A] hover:bg-[#1e40af] text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {isLookingUp ? 'Defining...' : 'Explain'}
              </button>
            </form>
          </div>

          {/* Definition Result Card */}
          {termResult && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#1E3A8A]">{termResult.term}</h4>
                <button
                  onClick={() => setTermResult(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[#111827] leading-relaxed">{termResult.definition}</p>
              {termResult.plainEnglish && (
                <p className="text-xs text-blue-900 bg-white/70 p-2 rounded-lg border border-blue-100">
                  <strong>In Plain English:</strong> {termResult.plainEnglish}
                </p>
              )}
            </div>
          )}

          {/* Concepts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredConcepts.length > 0 ? (
              filteredConcepts.map((concept) => (
                <div
                  key={concept.id}
                  className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-2 shadow-sm hover:border-[#2563EB] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#111827] text-sm">{concept.term}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1E3A8A] border border-blue-200">
                      {concept.importance || 'Key Concept'}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">{concept.definition}</p>
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center text-xs text-[#64748B]">
                No concepts found for this selection.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB 3: FLASHCARDS */}
      {activeTab === 'flashcards' && (
        <div className="space-y-4">
          {doc.flashcards.length > 0 ? (
            <FlashcardDeck
              cards={doc.flashcards.map((f) => ({
                id: f.id,
                front: f.front,
                back: f.back,
                difficulty: f.difficulty,
                topic: f.topic?.title || 'Key Concept',
              }))}
            />
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center text-xs text-[#64748B] shadow-sm">
              No flashcards generated for this document yet.
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 4: PRACTICE QUIZ */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          {isStartingQuiz ? (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center text-[#64748B] text-xs">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1E3A8A]" />
              Preparing 10-Question Practice Quiz...
            </div>
          ) : quizSessionId && quizQuestions.length > 0 ? (
            <QuizRunner
              sessionId={quizSessionId}
              quizTitle={`Practice Quiz: ${doc.title}`}
              questions={quizQuestions}
              onRetake={() => startQuiz()}
            />
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-3">
              <GraduationCap className="w-8 h-8 text-[#1E3A8A] mx-auto" />
              <h3 className="font-bold text-sm text-[#111827]">Practice Quiz on {doc.title}</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Test your comprehension with 10 questions grounded directly in this lecture presentation.
              </p>
              <button
                onClick={startQuiz}
                className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#1e40af] text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Start Practice Quiz
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. TAB 5: EXTRACTED TEXT */}
      {activeTab === 'source' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <h3 className="font-bold text-sm text-[#111827]">Extracted Text</h3>
            <span className="text-xs text-[#64748B] font-mono">
              {doc.rawText.length.toLocaleString()} characters
            </span>
          </div>
          <pre className="p-4 bg-[#F8FAFC] rounded-xl text-xs text-slate-700 whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto leading-relaxed border border-[#E2E8F0]">
            {doc.rawText}
          </pre>
        </div>
      )}
    </div>
  );
}
