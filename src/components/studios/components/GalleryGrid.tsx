'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { FlowJob } from '../StudioWorkspace';
import { JobCard } from './JobCard';

interface GalleryGridProps {
  jobs: FlowJob[];
  onPreview: (job: FlowJob) => void;
  onRetry: (job: FlowJob) => void;
  onDownload: (url: string, isVideo: boolean) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
}

export function GalleryGrid({
  jobs,
  onPreview,
  onRetry,
  onDownload,
  emptyTitle = 'ยังไม่มีผลงาน',
  emptyDescription = 'เริ่มสร้างสรรค์ผลงานแรกของคุณด้วย AI',
  emptyAction,
}: GalleryGridProps) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] text-center py-16 px-4">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-neutral-700" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <span className="text-violet-400 text-xs font-bold leading-none">+</span>
          </div>
        </div>
        <h3 className="text-base font-semibold text-neutral-300 mb-2">{emptyTitle}</h3>
        <p className="text-sm text-neutral-600 max-w-xs mb-6">{emptyDescription}</p>
        {emptyAction && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={emptyAction.onClick}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-violet-500/15 text-violet-400 border border-violet-500/20 hover:bg-violet-500/25 transition-colors"
          >
            {emptyAction.label}
          </motion.button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <AnimatePresence mode="popLayout">
        {jobs.map((job) => (
          <JobCard
            key={job.job_id}
            job={job}
            onPreview={onPreview}
            onRetry={onRetry}
            onDownload={onDownload}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
