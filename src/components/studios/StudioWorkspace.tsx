'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Settings, Wand2, Compass, Layers, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';
import { StudioSidebar } from './StudioSidebar';
import { PreviewModal } from './components/PreviewModal';
import { ExploreView } from './views/ExploreView';
import { CreateView } from './views/CreateView';
import { AssetsView } from './views/AssetsView';
import { ToolsView } from './views/ToolsView';

// ─── Shared Types ────────────────────────────────────────────────────────────

export type FlowMode = 'image' | 'video' | 'frame_to_video' | 'video_mix';
export type JobStatus = 'queued' | 'generating' | 'downloading' | 'completed' | 'failed' | 'cancelled';
export type StudioView = 'explore' | 'create' | 'assets' | 'tools';

export interface FlowJob {
  job_id: string;
  status: JobStatus;
  prompt: string;
  mode: FlowMode;
  model?: string;
  result_file?: string;
  download_url?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface StudioViewProps {
  jobs: FlowJob[];
  onPreview: (job: FlowJob) => void;
  onRetry: (job: FlowJob) => void;
  onDownload: (url: string, isVideo: boolean) => void;
  onNavigate: (view: StudioView) => void;
}

export interface CreateViewProps extends StudioViewProps {
  onJobCreated: (job: FlowJob) => void;
  startPolling: (jobId: string) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
}

// ─── Mobile bottom tab config ─────────────────────────────────────────────────

const MOBILE_TABS: { id: StudioView; icon: typeof Compass; label: string }[] = [
  { id: 'explore', icon: Compass, label: 'สำรวจ' },
  { id: 'create', icon: Wand2, label: 'สร้าง' },
  { id: 'assets', icon: Layers, label: 'ผลงาน' },
  { id: 'tools', icon: Wrench, label: 'เครื่องมือ' },
];

function isActiveJob(status: JobStatus) {
  return status === 'queued' || status === 'generating' || status === 'downloading';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StudioWorkspace() {
  const [activeView, setActiveView] = useState<StudioView>('create');
  const [jobs, setJobs] = useState<FlowJob[]>([]);
  const [previewJob, setPreviewJob] = useState<FlowJob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const pollingRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Cleanup all intervals on unmount
  useEffect(() => {
    return () => {
      for (const interval of pollingRef.current.values()) {
        clearInterval(interval);
      }
    };
  }, []);

  const stopPolling = useCallback((jobId: string) => {
    const interval = pollingRef.current.get(jobId);
    if (interval) {
      clearInterval(interval);
      pollingRef.current.delete(jobId);
    }
  }, []);

  const startPolling = useCallback(
    (jobId: string) => {
      // Guard against duplicate polling
      if (pollingRef.current.has(jobId)) return;

      const interval = setInterval(async () => {
        try {
          const res = await authFetch(`/api/studios/jobs/${jobId}`);
          if (!res.ok) return;
          const job: FlowJob = await res.json();
          setJobs((prev) =>
            prev.map((j) => (j.job_id === jobId ? { ...j, ...job } : j))
          );
          if (
            job.status === 'completed' ||
            job.status === 'failed' ||
            job.status === 'cancelled'
          ) {
            stopPolling(jobId);
          }
        } catch {
          // Keep polling on transient errors
        }
      }, 3000);

      pollingRef.current.set(jobId, interval);
    },
    [stopPolling]
  );

  const addJob = useCallback((job: FlowJob) => {
    setJobs((prev) => [job, ...prev]);
  }, []);

  const handleDownload = async (url: string, isVideo: boolean) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `rabbithub-${isVideo ? 'video' : 'image'}-${Date.now()}.${isVideo ? 'mp4' : 'png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleRetry = useCallback((_job: FlowJob) => {
    // Navigate to create view; CreateView receives the full jobs list via props
    // and can pre-populate from the job when the view agent implements retry logic
    setActiveView('create');
  }, []);

  const handlePreview = useCallback((job: FlowJob) => {
    setPreviewJob(job);
  }, []);

  const activeJobs = jobs.filter((j) => isActiveJob(j.status));

  // Props shared with every view
  const viewProps: StudioViewProps = {
    jobs,
    onPreview: handlePreview,
    onRetry: handleRetry,
    onDownload: handleDownload,
    onNavigate: setActiveView,
  };

  const createViewProps: CreateViewProps = {
    ...viewProps,
    onJobCreated: addJob,
    startPolling,
    isGenerating,
    setIsGenerating,
  };

  return (
    <div className="flex h-full bg-[#0a0a0a]">
      {/* Desktop sidebar */}
      <StudioSidebar
        activeView={activeView}
        onNavigate={setActiveView}
        activeJobCount={activeJobs.length}
      />

      {/* Main content column */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden h-12 flex items-center justify-between px-3 border-b border-white/[0.06] bg-[#0f0f0f] shrink-0">
          <Link
            href="/chat"
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-400" />
          </Link>
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-violet-400" />
            <span className="font-semibold text-sm text-white">Studios</span>
          </div>
          <Link
            href="/settings"
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Settings className="h-5 w-5 text-neutral-400" />
          </Link>
        </header>

        {/* Active view */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'explore' && <ExploreView {...viewProps} />}
          {activeView === 'create' && <CreateView {...createViewProps} />}
          {activeView === 'assets' && <AssetsView {...viewProps} />}
          {activeView === 'tools' && <ToolsView {...viewProps} />}
        </div>

        {/* Mobile bottom tabs */}
        <nav className="md:hidden flex border-t border-white/[0.06] bg-[#111214] shrink-0">
          {MOBILE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={cn(
                  'relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                  isActive ? 'text-violet-400' : 'text-neutral-600'
                )}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="mobile-bottom-indicator"
                    className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-violet-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Preview overlay */}
      <PreviewModal
        job={previewJob}
        onClose={() => setPreviewJob(null)}
        onDownload={handleDownload}
      />
    </div>
  );
}

