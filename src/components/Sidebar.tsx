'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  BrainCircuit,
  GraduationCap,
  BarChart3,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface SubjectItem {
  id: string;
  name: string;
  color: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  useEffect(() => {
    fetch('/api/subjects')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSubjects(data);
        }
      })
      .catch((err) => console.error('Failed to load sidebar subjects:', err));
  }, [pathname]);

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'AI Study Generator', href: '/study-generator', icon: Sparkles, highlight: true },
    { label: 'Subjects', href: '/subjects', icon: BookOpen },
    { label: 'Documents', href: '/documents', icon: FileText },
    { label: 'Flashcards', href: '/flashcards', icon: BrainCircuit },
    { label: 'Quiz Center', href: '/quizzes', icon: GraduationCap },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-[#F8F3ED] border-r border-[#E5DCD0] flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#E5DCD0] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#652D3D] to-[#B58B83] flex items-center justify-center shadow-md shadow-[#652D3D]/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-[#F3EDE3]" />
          </div>
          <div>
            <span className="font-bold text-lg text-[#252222] tracking-tight flex items-center gap-1.5">
              LearnMate <span className="text-[#F3EDE3] text-xs px-1.5 py-0.5 rounded bg-[#652D3D] font-mono">AI</span>
            </span>
            <p className="text-[11px] text-[#6E5D59] font-medium">Academic LMS</p>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6E5D59] px-3 mb-2">
            Main Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#652D3D] text-[#F3EDE3] font-semibold shadow-sm'
                      : 'text-[#4F4240] hover:text-[#252222] hover:bg-[#EFE7DD]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#F3EDE3]' : 'text-[#6E5D59]'}`} />
                  <span className="flex-1">{item.label}</span>
                  {item.highlight && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm ${
                      isActive ? 'bg-[#F3EDE3] text-[#652D3D]' : 'bg-[#652D3D] text-[#F3EDE3]'
                    }`}>
                      NEW
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Subjects Sub-list */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6E5D59]">
              My Subjects
            </p>
            <Link
              href="/subjects"
              className="text-xs text-[#6E5D59] hover:text-[#252222] font-medium flex items-center gap-0.5"
            >
              <Layers className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-1">
            {subjects.length === 0 ? (
              <p className="text-xs text-[#6E5D59]/60 px-3 italic">No subjects added yet</p>
            ) : (
              subjects.map((sub) => {
                const isSubjectActive = pathname === `/subjects/${sub.id}`;
                return (
                  <Link
                    key={sub.id}
                    href={`/subjects/${sub.id}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isSubjectActive
                        ? 'bg-[#652D3D]/10 text-[#652D3D] border border-[#652D3D]/30 font-semibold'
                        : 'text-[#4F4240] hover:text-[#252222] hover:bg-[#EFE7DD]'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color || '#652D3D' }}
                    />
                    <span className="truncate">{sub.name}</span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* User / Engine Status Card */}
      <div className="p-3 border-t border-[#E5DCD0]">
        <div className="bg-[#EFE7DD] border border-[#DED4C7] rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-[#652D3D] animate-pulse" />
            <div>
              <p className="text-xs font-semibold text-[#252222]">Gemini AI Connected</p>
              <p className="text-[10px] text-[#6E5D59]">PPTX • PDF • DOCX • TXT</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
