'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BrainCircuit,
  Sparkles,
  Filter,
  Layers,
  BookOpen,
  Loader2,
  FileText,
} from 'lucide-react';
import { FlashcardDeck, FlashcardItem } from '@/components/FlashcardDeck';

function FlashcardsContent() {
  const searchParams = useSearchParams();
  const preselectedSubjectId = searchParams.get('subjectId');

  const [cards, setCards] = useState<FlashcardItem[]>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(preselectedSubjectId || 'ALL');
  const [selectedDocId, setSelectedDocId] = useState('ALL');
  const [documents, setDocuments] = useState<Array<{ id: string; title: string; subjectId: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/documents', { cache: 'no-store' }).then((res) => res.json()),
      fetch('/api/subjects', { cache: 'no-store' }).then((res) => res.json()),
    ])
      .then(async ([docsData, subjectsData]) => {
        if (Array.isArray(subjectsData)) setSubjects(subjectsData);
        if (Array.isArray(docsData)) setDocuments(docsData);

        if (Array.isArray(docsData) && docsData.length > 0) {
          const allCards: FlashcardItem[] = [];
          for (const doc of docsData) {
            try {
              const docRes = await fetch(`/api/documents/${doc.id}`, { cache: 'no-store' });
              const docData = await docRes.json();
              if (docData.flashcards) {
                const enriched = docData.flashcards.map((f: any) => ({
                  ...f,
                  subjectId: doc.subject.id,
                  documentId: doc.id,
                  documentTitle: doc.title,
                }));
                allCards.push(...enriched);
              }
            } catch (err) {
              console.error('Error fetching doc cards:', err);
            }
          }
          setCards(allCards);
        }
      })
      .catch((err) => console.error('Error fetching flashcards:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredCards = cards.filter((c: any) => {
    const matchesSubject = selectedSubjectId === 'ALL' || c.subjectId === selectedSubjectId;
    const matchesDoc = selectedDocId === 'ALL' || c.documentId === selectedDocId;
    return matchesSubject && matchesDoc;
  });

  const availableDocs =
    selectedSubjectId === 'ALL'
      ? documents
      : documents.filter((d) => d.subjectId === selectedSubjectId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            Flashcard Mastery Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Active recall and spaced repetition for all concepts extracted from your lecture materials.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {subjects.length > 0 && (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setSelectedDocId('ALL');
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm font-medium"
              >
                <option value="ALL">All Subjects ({cards.length} cards)</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {availableDocs.length > 0 && (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm font-medium max-w-[200px] truncate"
              >
                <option value="ALL">All Documents</option>
                {availableDocs.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-xs text-slate-500 flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span>Loading flashcard decks...</span>
        </div>
      ) : (
        <div className="py-4">
          <FlashcardDeck
            cards={filteredCards}
            onRatingUpdate={(cardId, rating) => {
              setCards((prev) =>
                prev.map((c) => (c.id === cardId ? { ...c, difficulty: rating } : c))
              );
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function FlashcardsHubPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-xs text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          <span>Loading Flashcards...</span>
        </div>
      }
    >
      <FlashcardsContent />
    </Suspense>
  );
}
