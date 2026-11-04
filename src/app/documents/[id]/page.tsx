'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  BookOpen,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Copy,
  Check,
  Download,
  Bookmark,
  Zap,
  Loader2,
  Edit3,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sliders,
  Play,
  Share2,
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
  personalNotes?: Array<{
    id: string;
    content: string;
    title?: string;
    updatedAt: string;
  }>;
}

type TabType = 'notes' | 'my_notes' | 'flashcards' | 'quiz';

export default function DocumentStudyHubPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('notes');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('ALL');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const [showQuickRevisionOnly, setShowQuickRevisionOnly] = useState(false);

  // Personal Notes state
  const [personalNotesContent, setPersonalNotesContent] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [notesSaveStatus, setNotesSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Quiz launcher state
  const [quizQuestionCount, setQuizQuestionCount] = useState<number>(10);
  const [quizDifficulty, setQuizDifficulty] = useState<string>('Mixed');
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);

  const loadDocument = () => {
    setIsLoading(true);
    fetch(`/api/documents/${params.id}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setDoc(data);
          // Load existing personal notes if present
          if (data.personalNotes && data.personalNotes.length > 0) {
            setPersonalNotesContent(data.personalNotes[0].content || '');
            setLastSavedTime(new Date(data.personalNotes[0].updatedAt));
          } else {
            // Check localStorage fallback
            const localCached = localStorage.getItem(`learnmate_pnotes_${params.id}`);
            if (localCached) {
              setPersonalNotesContent(localCached);
            }
          }
        }
      })
      .catch((err) => console.error('Failed to load document study pack:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadDocument();
  }, [params.id]);

  // Handle personal notes change with debounced autosave
  const handlePersonalNotesChange = (value: string) => {
    setPersonalNotesContent(value);
    setNotesSaveStatus('unsaved');
    localStorage.setItem(`learnmate_pnotes_${params.id}`, value);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setNotesSaveStatus('saving');
      setIsSavingNotes(true);
      try {
        await fetch(`/api/documents/${params.id}/personal-notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: value }),
        });
        setNotesSaveStatus('saved');
        setLastSavedTime(new Date());
      } catch (err) {
        console.error('Failed to autosave personal notes:', err);
        setNotesSaveStatus('unsaved');
      } finally {
        setIsSavingNotes(false);
      }
    }, 1000);
  };

  // Explicit manual save
  const handleManualSaveNotes = async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setNotesSaveStatus('saving');
    setIsSavingNotes(true);
    try {
      await fetch(`/api/documents/${params.id}/personal-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: personalNotesContent }),
      });
      setNotesSaveStatus('saved');
      setLastSavedTime(new Date());
    } catch (err) {
      console.error('Failed to save personal notes:', err);
      setNotesSaveStatus('unsaved');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Clear personal notes
  const handleClearPersonalNotes = async () => {
    if (!confirm('Are you sure you want to clear your personal notes for this document?')) {
      return;
    }
    setPersonalNotesContent('');
    localStorage.removeItem(`learnmate_pnotes_${params.id}`);
    try {
      await fetch(`/api/documents/${params.id}/personal-notes`, {
        method: 'DELETE',
      });
      setNotesSaveStatus('saved');
      setLastSavedTime(new Date());
    } catch (err) {
      console.error('Failed to delete personal notes:', err);
    }
  };

  // Copy personal notes to clipboard
  const handleCopyPersonalNotes = () => {
    if (!personalNotesContent) return;
    navigator.clipboard.writeText(personalNotesContent);
    alert('Personal notes copied to clipboard!');
  };

  // Download personal notes as file
  const handleDownloadPersonalNotes = () => {
    if (!personalNotesContent) return;
    const blob = new Blob([personalNotesContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc?.title || 'Study'}_Personal_Notes.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Insert formatting into personal notes
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('personal-notes-editor') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;

    const newContent = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    handlePersonalNotesChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 4));
    }, 50);
  };

  // Copy AI notes
  const handleCopyNote = (noteId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedNoteId(noteId);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  // Download Complete Notes
  const handleDownloadNotes = () => {
    if (!doc || doc.notes.length === 0) return;
    const consolidated = doc.notes
      .map((n) => `# ${n.title}\n\n${n.markdownContent}`)
      .join('\n\n---\n\n');

    const blob = new Blob([consolidated], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Study_Notes.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Regenerate AI Notes with confirmation
  const handleRegenerate = async () => {
    setShowRegenerateConfirm(false);
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/documents/${params.id}/regenerate`, {
        method: 'POST',
      });
      if (res.ok) {
        loadDocument();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to regenerate study notes');
      }
    } catch (err) {
      console.error('Failed to regenerate:', err);
      alert('An error occurred while regenerating notes.');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Start Practice Quiz
  const startQuiz = async (customCount?: number, customDiff?: string) => {
    setIsStartingQuiz(true);
    try {
      const count = customCount || quizQuestionCount;
      const diff = customDiff || quizDifficulty;
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: doc?.id,
          questionCount: count,
          difficulty: diff,
        }),
      });
      const data = await res.json();
      if (data.sessionId && data.questions) {
        setQuizSessionId(data.sessionId);
        setQuizQuestions(data.questions);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error('Failed to launch quiz:', err);
      alert('Failed to start quiz. Please try again.');
    } finally {
      setIsStartingQuiz(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-[#64748B] text-xs flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
        <span>Loading study materials...</span>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="py-20 text-center space-y-3">
        <h2 className="text-lg font-bold text-[#111827]">Document Not Found</h2>
        <Link href="/documents" className="text-xs text-[#2563EB] hover:underline font-semibold">
          Return to documents directory
        </Link>
      </div>
    );
  }

  const filteredNotes = doc.notes.filter(
    (n) => selectedTopicId === 'ALL' || n.topicId === selectedTopicId || doc.notes.length === 1
  );

  const handleTopicJump = (topicId: string, topicTitle?: string) => {
    setSelectedTopicId(topicId);
    if (topicId === 'ALL' || !topicTitle) {
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }
    setTimeout(() => {
      const headings = Array.from(document.querySelectorAll('h2, h3'));
      const cleanTitle = topicTitle.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
      const titleWords = cleanTitle.split(/\s+/).filter((w) => w.length > 3);
      const target = headings.find((h) => {
        const text = h.textContent?.toLowerCase() || '';
        return titleWords.some((w) => text.includes(w));
      });
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-6xl mx-auto">
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
            title="Download Notes as Markdown"
          >
            <Download className="w-3.5 h-3.5 text-[#2563EB]" />
            Download Notes
          </button>
          <button
            onClick={() => setShowRegenerateConfirm(true)}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-[#111827] border border-[#E2E8F0] shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-[#2563EB]' : 'text-[#64748B]'}`} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate Notes'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Regeneration */}
      {showRegenerateConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#111827]">Regenerate Study Notes?</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  This will re-analyze &quot;{doc.title}&quot; using Gemini and produce an updated, consolidated study notes document and practice quiz. Existing personal notes will remain safe.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setShowRegenerateConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerate}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1E3A8A] hover:bg-[#1e40af] text-white shadow-sm cursor-pointer"
              >
                Yes, Regenerate Notes
              </button>
            </div>
          </div>
        </div>
      )}

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
              {doc.summary || 'Academic study pack automatically indexed and grounded from uploaded lecture materials.'}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#64748B] font-mono shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
              <span className="text-[#111827] font-bold block">{doc.pageCount}</span>
              <span className="text-[10px] text-[#64748B]">Pages/Slides</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
              <span className="text-[#111827] font-bold block">{doc.notes.length}</span>
              <span className="text-[10px] text-[#64748B]">Study Notes</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
              <span className="text-[#111827] font-bold block">{doc.questions.length}</span>
              <span className="text-[10px] text-[#64748B]">Questions</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar: Strictly Study Notes | My Notes | Flashcards | Practice Quiz */}
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
            Study Notes
          </button>

          <button
            onClick={() => setActiveTab('my_notes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'my_notes'
                ? 'bg-[#1E3A8A] text-white shadow-sm'
                : 'text-[#475569] hover:text-[#111827] hover:bg-slate-50'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            My Notes
            {personalNotesContent.trim() && (
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
            )}
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
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'quiz'
                ? 'bg-[#1E3A8A] text-white shadow-sm'
                : 'text-[#475569] hover:text-[#111827] hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Practice Quiz
          </button>
        </div>
      </div>

      {/* 3. TAB 1: STUDY NOTES (DIGITAL TEXTBOOK PRESENTATION) */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          {/* Notes Controls Bar */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Clickable Table of Contents Jump Links */}
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <span className="text-xs font-bold text-[#111827] flex items-center gap-1 shrink-0 mr-1">
                <Bookmark className="w-3.5 h-3.5 text-[#2563EB]" /> Jump to Topic:
              </span>
              <button
                onClick={() => handleTopicJump('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                  selectedTopicId === 'ALL'
                    ? 'bg-[#1E3A8A] text-white shadow-sm'
                    : 'text-[#475569] hover:text-[#111827] hover:bg-slate-100'
                }`}
              >
                All Sections
              </button>
              {doc.topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTopicJump(t.id, t.title)}
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

          {/* Render Notes with MarkdownRenderer (Zero raw markdown symbols) */}
          {filteredNotes.length > 0 ? (
            <div className="space-y-6">
              {filteredNotes.map((note) => (
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
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center text-xs text-[#64748B] shadow-sm">
              No study notes found for this section.
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: MY NOTES (PERSONAL SELF NOTES EDITOR) */}
      {activeTab === 'my_notes' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#2563EB]" />
                Personal Study Notes
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Write your own notes, key thoughts, and exam revisions while studying this document.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-[#64748B] flex items-center gap-1 mr-2">
                {notesSaveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-[#2563EB]" /> Saving...
                  </>
                ) : notesSaveStatus === 'saved' ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-[#15803D]" />
                    {lastSavedTime ? `Saved ${lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Saved'}
                  </>
                ) : (
                  <span className="text-amber-600 font-medium">Unsaved changes</span>
                )}
              </span>

              <button
                onClick={handleManualSaveNotes}
                disabled={isSavingNotes}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1E3A8A] hover:bg-[#1e40af] text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </button>
              <button
                onClick={handleCopyPersonalNotes}
                disabled={!personalNotesContent.trim()}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E2E8F0] text-[#111827] hover:bg-slate-50 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-[#64748B]" /> Copy
              </button>
              <button
                onClick={handleDownloadPersonalNotes}
                disabled={!personalNotesContent.trim()}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E2E8F0] text-[#111827] hover:bg-slate-50 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#2563EB]" /> Download
              </button>
              <button
                onClick={handleClearPersonalNotes}
                disabled={!personalNotesContent.trim()}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                title="Clear Notes"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Simple Formatting Toolbar */}
          <div className="flex items-center gap-1.5 py-2 px-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] overflow-x-auto text-xs">
            <span className="text-[11px] font-semibold text-[#64748B] mr-2 shrink-0">Format:</span>
            <button
              onClick={() => insertFormatting('## ', '\n')}
              className="px-2 py-1 rounded hover:bg-slate-200 font-bold text-[#111827]"
              title="Heading 2"
            >
              H2
            </button>
            <button
              onClick={() => insertFormatting('### ', '\n')}
              className="px-2 py-1 rounded hover:bg-slate-200 font-bold text-[#111827]"
              title="Heading 3"
            >
              H3
            </button>
            <button
              onClick={() => insertFormatting('**', '**')}
              className="px-2 py-1 rounded hover:bg-slate-200 font-bold text-[#111827]"
              title="Bold"
            >
              B
            </button>
            <button
              onClick={() => insertFormatting('*', '*')}
              className="px-2 py-1 rounded hover:bg-slate-200 italic font-serif text-[#111827]"
              title="Italic"
            >
              I
            </button>
            <button
              onClick={() => insertFormatting('- ', '\n')}
              className="px-2 py-1 rounded hover:bg-slate-200 text-[#111827]"
              title="Bulleted List"
            >
              • List
            </button>
            <button
              onClick={() => insertFormatting('1. ', '\n')}
              className="px-2 py-1 rounded hover:bg-slate-200 text-[#111827]"
              title="Numbered List"
            >
              1. List
            </button>
          </div>

          {/* Personal Notes Textarea Editor */}
          <textarea
            id="personal-notes-editor"
            value={personalNotesContent}
            onChange={(e) => handlePersonalNotesChange(e.target.value)}
            placeholder="Type your notes here... You can use headings, bullets, questions to ask the professor, or summaries of what you read."
            className="w-full min-h-[380px] p-4 text-sm text-[#111827] bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] leading-relaxed font-sans resize-y"
          />

          {personalNotesContent.trim() && (
            <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
              <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Preview</h4>
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                <MarkdownRenderer content={personalNotesContent} />
              </div>
            </div>
          )}
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
              Preparing Practice Quiz for &quot;{doc.title}&quot;...
            </div>
          ) : quizSessionId && quizQuestions.length > 0 ? (
            <QuizRunner
              sessionId={quizSessionId}
              quizTitle={`Practice Quiz: ${doc.title}`}
              questions={quizQuestions}
              onRetake={() => startQuiz()}
            />
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 md:p-12 text-center max-w-xl mx-auto shadow-sm space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center mx-auto">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#111827]">Practice Quiz on {doc.title}</h3>
                <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto leading-relaxed">
                  Test your understanding with questions grounded directly in this lecture presentation. You will receive detailed explanations and mistake analysis upon submission.
                </p>
              </div>

              {/* Quiz Configuration Controls */}
              <div className="grid grid-cols-2 gap-4 text-left p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <div>
                  <label className="block text-[11px] font-bold text-[#111827] mb-1">
                    Number of Questions
                  </label>
                  <select
                    value={quizQuestionCount}
                    onChange={(e) => setQuizQuestionCount(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value={5}>5 Questions (Quick Review)</option>
                    <option value={10}>10 Questions (Standard)</option>
                    <option value={15}>15 Questions (Deep Test)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#111827] mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={quizDifficulty}
                    onChange={(e) => setQuizDifficulty(e.target.value)}
                    className="w-full text-xs bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="Mixed">Mixed (Recommended)</option>
                    <option value="Easy">Foundational (Easy)</option>
                    <option value="Medium">Standard (Medium)</option>
                    <option value="Hard">Advanced (Hard)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => startQuiz()}
                className="w-full py-3 bg-[#1E3A8A] hover:bg-[#1e40af] text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                Start Practice Quiz Now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
