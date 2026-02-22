'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import type { FlowJob } from '../StudioWorkspace';

// Load VideoPlayer only on the client to avoid SSR issues
const VideoPlayer = dynamic(
  () =>
    import('@/components/ui/VideoPlayer').then((mod) => ({
      default: mod.VideoPlayer,
    })),
  { ssr: false }
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreviewModalProps {
  job: FlowJob | null;
  onClose: () => void;
  onDownload: (url: string, isVideo: boolean) => void;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diffSeconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (diffSeconds < 60) return 'เมื่อสักครู่';
  if (diffSeconds < 3600)
    return `${Math.floor(diffSeconds / 60)} นาทีที่แล้ว`;
  if (diffSeconds < 86400)
    return `${Math.floor(diffSeconds / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(diffSeconds / 86400)} วันที่แล้ว`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PreviewModal({ job, onClose, onDownload }: PreviewModalProps) {
  const isVideo = job ? job.mode !== 'image' : false;
  const mediaUrl = job ? job.download_url || job.result_file || '' : '';

  return (
    <AnimatePresence>
      {job && (
        // Backdrop
        <motion.div
          key="preview-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={onClose}
        >
          {/* Content card */}
          <motion.div
            key="preview-card"
            initial={{ scale: 0.9, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="relative w-full max-w-5xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="ปิด"
              className="absolute -top-3 -right-3 z-10 p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Media area */}
            <div className="relative flex-1 min-h-0 rounded-2xl overflow-hidden bg-[#0f0f0f] border border-white/[0.06]">
              {isVideo ? (
                <VideoPlayer
                  src={mediaUrl}
                  maxHeight="75vh"
                />
              ) : (
                <div className="relative w-full" style={{ maxHeight: '75vh' }}>
                  <Image
                    src={mediaUrl}
                    alt={job.prompt}
                    width={1440}
                    height={1080}
                    className="w-full h-auto object-contain rounded-2xl"
                    style={{ maxHeight: '75vh' }}
                    unoptimized
                    priority
                  />
                </div>
              )}
            </div>

            {/* Info bar */}
            <div className="mt-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Prompt */}
                <p className="text-sm text-neutral-300 line-clamp-2 leading-relaxed">
                  {job.prompt}
                </p>

                {/* Badges */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {job.model && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.08] text-neutral-400 font-mono">
                      {job.model}
                    </span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-neutral-500 uppercase tracking-wide">
                    {job.mode.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-neutral-600">
                    {timeAgo(job.created_at)}
                  </span>
                </div>
              </div>

              {/* Download button */}
              <button
                onClick={() => onDownload(mediaUrl, isVideo)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-500 to-violet-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-violet-500 transition-all shadow-lg shadow-violet-500/20 shrink-0"
              >
                <Download className="h-4 w-4" />
                ดาวน์โหลด
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
