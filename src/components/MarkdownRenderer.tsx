'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose max-w-none text-slate-800 leading-relaxed font-sans ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className="text-2xl font-bold text-[#111827] pb-2 mb-4 mt-6 border-b border-[#E2E8F0] tracking-tight flex items-center gap-2"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-xl font-bold text-[#1E3A8A] mt-6 mb-3 pt-2 tracking-tight flex items-center gap-2"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-base font-semibold text-[#111827] mt-4 mb-2 tracking-tight"
              {...props}
            />
          ),
          h4: ({ node, ...props }) => (
            <h4
              className="text-sm font-semibold text-[#1E3A8A] mt-3 mb-1.5"
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p className="text-sm text-[#111827] leading-relaxed mb-3.5" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-outside pl-5 mb-4 space-y-1.5 text-sm text-[#111827]" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-outside pl-5 mb-4 space-y-1.5 text-sm text-[#111827]" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-[#111827]" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-[#1E3A8A]" {...props} />
          ),
          blockquote: ({ node, children, ...props }) => (
            <blockquote className="my-4 p-4 rounded-xl bg-blue-50/70 border-l-4 border-[#2563EB] text-[#1E3A8A] text-sm shadow-sm space-y-1 not-italic" {...props}>
              <div className="font-semibold text-xs uppercase tracking-wider text-[#2563EB] mb-1">
                Important Concept & Definition
              </div>
              <div className="leading-relaxed text-slate-800 font-medium">
                {children}
              </div>
            </blockquote>
          ),
          table: ({ node, ...props }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-[#E2E8F0] shadow-sm">
              <table className="w-full text-left text-xs border-collapse divide-y divide-[#E2E8F0]" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-[#F8FAFC] text-[#111827] font-semibold uppercase tracking-wider text-[11px]" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-[#E2E8F0] bg-white" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-slate-50/70 transition-colors" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="py-2.5 px-3.5 font-bold text-slate-900 border-r border-[#E2E8F0] last:border-r-0" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="py-2.5 px-3.5 text-slate-800 border-r border-[#E2E8F0] last:border-r-0" {...props} />
          ),
          code: ({ node, className, children, ...props }) => {
            const isInline = !className;
            return isInline ? (
              <code className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[#1E3A8A] font-mono text-xs border border-slate-200" {...props}>
                {children}
              </code>
            ) : (
              <code className="block p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto my-3 leading-relaxed" {...props}>
                {children}
              </code>
            );
          },
          hr: () => <hr className="my-6 border-[#E2E8F0]" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
