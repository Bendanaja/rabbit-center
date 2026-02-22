'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, ImagePlus, Video, Film, Blend } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudioViewProps } from '../StudioWorkspace';
import { GalleryGrid } from '../components/GalleryGrid';

type ExploreTab = 'recommended' | 'latest';

const QUICK_PILLS = [
  { id: 'image', icon: ImagePlus, label: 'สร้างรูปภาพ' },
  { id: 'video', icon: Video, label: 'สร้างวิดีโอ' },
  { id: 'frame_to_video', icon: Film, label: 'Image to Video' },
  { id: 'video_mix', icon: Blend, label: 'Video Mix' },
] as const;

export function ExploreView({ jobs, onPreview, onRetry, onDownload, onNavigate }: StudioViewProps) {
  const [activeTab, setActiveTab] = useState<ExploreTab>('recommended');

  const completedJobs = jobs.filter((j) => j.status === 'completed');

  const displayedJobs =
    activeTab === 'latest'
      ? [...completedJobs].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      : completedJobs;

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
            <Compass className="h-4 w-4 text-violet-400" />
          </div>
          <h1 className="text-lg font-semibold text-white">สำรวจผลงาน</h1>
        </div>
        <p className="text-sm text-neutral-500 ml-11">ค้นพบผลงานที่สร้างด้วย AI</p>

        {/* Quick pills */}
        <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_PILLS.map((pill) => {
            const Icon = pill.icon;
            return (
              <button
                key={pill.id}
                onClick={() => onNavigate('create')}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-violet-500/15 hover:text-violet-300 text-sm text-neutral-400 border border-white/[0.06] hover:border-violet-500/20 transition-all shrink-0"
              >
                <Icon className="h-3.5 w-3.5" />
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0 px-6 border-b border-white/[0.06] bg-[#0a0a0a]">
        {(
          [
            { id: 'recommended', label: 'แนะนำ' },
            { id: 'latest', label: 'ล่าสุด' },
          ] as { id: ExploreTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative px-4 py-3.5 text-sm font-medium transition-colors',
              activeTab === tab.id ? 'text-violet-400' : 'text-neutral-500 hover:text-neutral-300'
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="explore-tab"
                className="absolute bottom-0 left-2 right-2 h-0.5 bg-violet-500 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Gallery */}
      <div className="flex-1 p-5">
        <GalleryGrid
          jobs={displayedJobs}
          onPreview={onPreview}
          onRetry={onRetry}
          onDownload={onDownload}
          emptyTitle="ยังไม่มีผลงาน"
          emptyDescription="เริ่มสร้างสรรค์ผลงานแรกของคุณ! สร้างรูปภาพหรือวิดีโอด้วย AI ได้เลย"
          emptyAction={{ label: 'เริ่มสร้างเลย', onClick: () => onNavigate('create') }}
        />
      </div>
    </div>
  );
}
