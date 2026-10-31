'use client';

import { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Filter,
  Layers,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { FlashcardDeck, FlashcardItem } from '@/components/FlashcardDeck';

export default function FlashcardsHubPage() {
  const [cards, setCards] = useState<FlashcardItem[]>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/documents').then((res) => res.json()),
      fetch('/api/subjects').then((res) => res.json()),
    ])
      .then(async ([docsData, subjectsData]) => {
        if (Array.isArray(subjectsData)) setSubjects(subjectsData);

        // Fetch cards from all documents
        if (Array.isArray(docsData) && docsData.length > 0) {
          const allCards: FlashcardItem[] = [];
          for (const doc of docsData) {
            try {
              const docRes = await fetch(`/api/documents/${doc.id}`);
              const docData = await docRes.json();
              if (docData.flashcards) {
                const enriched = docData.flashcards.map((f: any) => ({
                  ...f,
                  subjectId: doc.subject.id,
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

  const filteredCards =
    selectedSubjectId === 'ALL'
      ? cards
      : cards.filter((c: any) => c.subjectId === selectedSubjectId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#252222] tracking-tight">Flashcard Mastery Hub</h1>
          <p className="text-xs text-[#6E5D59] mt-1">
            Active recall and spaced repetition for all extracted concepts
          </p>
        </div>

        {subjects.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#6E5D59] shrink-0" />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#DED4C7] text-[#252222] text-xs focus:outline-none focus:border-[#652D3D] shadow-sm"
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
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-xs text-[#6E5D59] flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#652D3D]" />
          <span>Loading flashcard decks...</span>
        </div>
      ) : (
        <div className="py-4">
          <FlashcardDeck cards={filteredCards} />
        </div>
      )}
    </div>
  );
}
