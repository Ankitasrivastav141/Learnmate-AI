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
    fetch('/api/subjects', { cache: 'no-store' })
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
    { label: 'My Subjects', href: '/subjects', icon: BookOpen },
    { label: 'Documents', href: '/documents', icon: FileText },
    { label: 'Flashcards', href: '/flashcards', icon: BrainCircuit },
    { label: 'Quiz History', href: '/quizzes', icon: GraduationCap },
    { label: 'Progress', href: '/analytics', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col h-screen sticky top-0 z-30 select-none shadow-sm">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-[#1E3A8A] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-base text-[#111827] tracking-tight flex items-center gap-1.5">
              LearnMate <span className="text-white text-[11px] px-1.5 py-0.2 rounded bg-[#2563EB] font-mono">AI</span>
            </span>
            <p className="text-[11px] text-[#64748B] font-medium">Personal LMS</p>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] px-3 mb-2">
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#1E3A8A] text-white shadow-sm'
                      : 'text-[#475569] hover:text-[#111827] hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* My Subjects Quick List */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Enrolled Subjects
            </p>
            <Link
              href="/subjects"
              className="text-[10px] text-[#2563EB] hover:underline font-medium"
            >
              View All
            </Link>
          </div>

          <div className="space-y-1">
            {subjects.length > 0 ? (
              subjects.slice(0, 6).map((sub) => {
                const isSubActive = pathname === `/subjects/${sub.id}`;
                return (
                  <Link
                    key={sub.id}
                    href={`/subjects/${sub.id}`}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors truncate ${
                      isSubActive
                        ? 'bg-blue-50 text-[#1E3A8A] font-semibold'
                        : 'text-[#475569] hover:text-[#111827] hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color || '#2563EB' }}
                    />
                    <span className="truncate">{sub.name}</span>
                  </Link>
                );
              })
            ) : (
              <p className="px-3 text-xs text-[#94A3B8]">No subjects created yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-[11px]">System Ready • Local DB</span>
        </div>
      </div>
    </aside>
  );
}
