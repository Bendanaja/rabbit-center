'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layers, Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudioViewProps } from '../StudioWorkspace';
import { GalleryGrid } from '../components/GalleryGrid';

type AssetsTab = 'all' | 'images' | 'videos' | 'failed';
type SortOrder = 'latest' | 'oldest';

const TABS: { id: AssetsTab; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'images', label: 'รูปภาพ' },
  { id: 'videos', label: 'วิดีโอ' },
  { id: 'failed', label: 'ที่ล้มเหลว' },
];

const EMPTY_STATES: Record<AssetsTab, { title: string; description: string }> = {
  all: { title: 'ยังไม่มีผลงาน', description: 'เริ่มสร้างสรรค์ผลงานแรกของคุณด้วย AI' },
  images: { title: 'ยังไม่มีรูปภาพ', description: 'ลองสร้างรูปภาพด้วย Text to Image' },
  videos: { title: 'ยังไม่มีวิดีโอ', description: 'ลองสร้างวิดีโอด้วย Text to Video หรือ Image to Video' },
  failed: { title: 'ไม่มีงานที่ล้มเหลว', description: 'ผลงานทั้งหมดของคุณสำเร็จแล้ว' },
};

export function AssetsView({ jobs, onPreview, onRetry, onDownload, onNavigate }: StudioViewProps) {
  const [activeTab, setActiveTab] = useState<AssetsTab>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJobs = useMemo(() => {
    let result = jobs;

    // Filter by tab
    if (activeTab === 'images') {
      result = result.filter((j) => j.mode === 'image');
    } else if (activeTab === 'videos') {
      result = result.filter((j) => j.mode !== 'image');
    } else if (activeTab === 'failed') {
      result = result.filter((j) => j.status === 'failed');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((j) => j.prompt.toLowerCase().includes(q));
    }

    // Sort
    return [...result].sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return sortOrder === 'latest' ? bTime - aTime : aTime - bTime;
    });
  }, [jobs, activeTab, sortOrder, searchQuery]);

  const tabCounts: Record<AssetsTab, number> = {
    all: jobs.length,
    images: jobs.filter((j) => j.mode === 'image').length,
    videos: jobs.filter((j) => j.mode !== 'image').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };

  const emptyState = EMPTY_STATES[activeTab];

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
            <Layers className="h-4 w-4 text-violet-400" />
          </div>
          <h1 className="text-lg font-semibold text-white">ผลงานทั้งหมด</h1>
          {jobs.length > 0 && (
            <span className="text-sm text-neutral-500">({jobs.length})</span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0 px-6 border-b border-white/[0.06] bg-[#0a0a0a] overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium transition-colors shrink-0',
              activeTab === tab.id
                ? 'text-violet-400'
                : 'text-neutral-500 hover:text-neutral-300'
            )}
          >
            {tab.label}
            {tabCounts[tab.id] > 0 && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                  activeTab === tab.id
                    ? 'bg-violet-500/20 text-violet-400'
                    : 'bg-white/[0.06] text-neutral-600'
                )}
              >
                {tabCounts[tab.id]}
              </span>
            )}
            {activeTab === tab.id && (
              <motion.div
                layoutId="assets-tab"
                className="absolute bottom-0 left-2 right-2 h-0.5 bg-violet-500 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Sort + Search bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-white/[0.06]">
        {/* Sort dropdown */}
        <div className="relative shrink-0">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className={cn(
              'appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-medium',
              'bg-white/[0.04] border border-white/[0.08]',
              'text-neutral-300',
              'focus:outline-none focus:border-violet-500/40',
              'cursor-pointer transition-colors hover:bg-white/[0.06]'
            )}
          >
            <option value="latest">ล่าสุด</option>
            <option value="oldest">เก่าสุด</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-500 pointer-events-none" />
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-600 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาจาก prompt..."
            className={cn(
              'w-full pl-9 pr-4 py-2 rounded-xl text-xs',
              'bg-white/[0.04] border border-white/[0.08]',
              'text-white placeholder-neutral-600',
              'focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.06]',
              'transition-all'
            )}
          />
        </div>
      </div>

      {/* Gallery */}
      <div className="flex-1 p-5">
        <GalleryGrid
          jobs={filteredJobs}
          onPreview={onPreview}
          onRetry={onRetry}
          onDownload={onDownload}
          emptyTitle={emptyState.title}
          emptyDescription={emptyState.description}
          emptyAction={
            activeTab !== 'failed'
              ? { label: 'เริ่มสร้าง', onClick: () => onNavigate('create') }
              : undefined
          }
        />
      </div>
    </div>
  );
}
