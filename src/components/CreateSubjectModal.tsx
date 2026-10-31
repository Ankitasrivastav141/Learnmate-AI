'use client';

import { useState } from 'react';
import { X, BookOpen, AlertCircle, Loader2 } from 'lucide-react';

interface CreateSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSubjectId?: string) => void;
}

const PRESET_COLORS = [
  '#652D3D', // Burgundy
  '#B58B83', // Dusty Rose
  '#8B3A4A', // Deep Rose
  '#A0522D', // Sienna
  '#4A3B32', // Deep Taupe
  '#7C3F58', // Plum Burgundy
  '#9E6B55', // Terra Cotta
  '#4E3D52', // Mauve Night
];

export function CreateSubjectModal({ isOpen, onClose, onSuccess }: CreateSubjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Subject name is required.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create subject');
      }

      onSuccess(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subject');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5DCD0] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EFE7DD] bg-[#FAF7F2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#F3EDE3] shadow-sm"
              style={{ backgroundColor: color }}
            >
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[#252222] text-sm">Create New Subject</h3>
              <p className="text-xs text-[#6E5D59]">Organize study documents by course or topic</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#6E5D59] hover:text-[#252222] p-1 rounded-lg hover:bg-[#EFE7DD] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E5D59] mb-1.5">
              Subject Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Computer Networks, Product Management"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF7F2] border border-[#DED4C7] text-[#252222] text-sm focus:outline-none focus:border-[#652D3D] placeholder:text-[#6E5D59]/50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E5D59] mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Core curriculum covering key frameworks, market analysis, and examination topics."
              rows={2}
              className="w-full px-3.5 py-2 rounded-lg bg-[#FAF7F2] border border-[#DED4C7] text-[#252222] text-sm focus:outline-none focus:border-[#652D3D] placeholder:text-[#6E5D59]/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E5D59] mb-2">
              Theme Color
            </label>
            <div className="flex items-center gap-2.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-[#652D3D] ring-offset-2 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#6E5D59] hover:text-[#252222] hover:bg-[#FAF7F2] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#652D3D] hover:bg-[#522431] text-[#F3EDE3] shadow-md shadow-[#652D3D]/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create Subject
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
