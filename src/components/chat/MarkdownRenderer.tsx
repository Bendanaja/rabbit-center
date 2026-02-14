'use client';

import { memo, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function CodeBlock({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match?.[1] || '';
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [codeString]);

  // Inline code (no language class, short content)
  if (!match && !codeString.includes('\n')) {
    return (
      <code
        className="px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-primary-600 dark:text-primary-400 text-[13px] font-mono"
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="relative group/code my-3 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700/50 bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700/50">
        <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all',
            copied
              ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          )}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code content */}
      <div className="overflow-x-auto">
        <pre className="p-4 m-0 text-[13px] leading-relaxed">
          <code className={cn('font-mono text-neutral-800 dark:text-neutral-200', className)} {...props}>
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
}

export const MarkdownRenderer = memo(function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code blocks with copy button
          code: CodeBlock,
          // Headings
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white mt-5 mb-3 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mt-4 mb-2 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white mt-3 mb-2 first:mt-0">{children}</h3>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="text-sm sm:text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200 mb-3 last:mb-0">
              {children}
            </p>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 mb-3 text-sm sm:text-[15px] text-neutral-800 dark:text-neutral-200 pl-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-3 text-sm sm:text-[15px] text-neutral-800 dark:text-neutral-200 pl-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-primary-500 dark:border-primary-400 pl-4 py-1 my-3 bg-primary-50/50 dark:bg-primary-900/20 rounded-r-lg text-neutral-700 dark:text-neutral-300 italic">
              {children}
            </blockquote>
          ),
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <table className="min-w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-neutral-100 dark:bg-neutral-800">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300 border-b border-neutral-100 dark:border-neutral-800">
              {children}
            </td>
          ),
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              {children}
            </a>
          ),
          // Bold and Italic
          strong: ({ children }) => (
            <strong className="font-semibold text-neutral-900 dark:text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          // Horizontal rule
          hr: () => (
            <hr className="border-neutral-200 dark:border-neutral-700 my-4" />
          ),
          // Pre (wrapper for code blocks)
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
