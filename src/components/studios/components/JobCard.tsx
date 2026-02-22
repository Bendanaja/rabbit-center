'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Loader2, AlertTriangle, RotateCcw, Download, Expand } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FlowJob } from '../StudioWorkspace';

const VideoPlayer = dynamic(
  () => import('@/components/ui/VideoPlayer').then((mod) => ({ default: mod.VideoPlayer })),
  { ssr: false }
);

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'เมื่อสักครู่';
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(diff / 86400)} วันที่แล้ว`;
}

function isActiveJob(status: string) {
  return status === 'queued' || status === 'generating' || status === 'downloading';
}

function getStatusText(status: string) {
  switch (status) {
    case 'queued': return 'รอคิว...';
    case 'generating': return 'กำลังสร้าง...';
    case 'downloading': return 'กำลังเตรียมไฟล์...';
    default: return status;
  }
}

function getStatusPercent(status: string) {
  switch (status) {
    case 'queued': return '15%';
    case 'generating': return '60%';
    case 'downloading': return '90%';
    default: return '0%';
  }
}

interface JobCardProps {
  job: FlowJob;
  onPreview: (job: FlowJob) => void;
  onRetry: (job: FlowJob) => void;
  onDownload: (url: string, isVideo: boolean) => void;
}

export function JobCard({ job, onPreview, onRetry, onDownload }: JobCardProps) {
  const isVideo = job.mode !== 'image';
  const mediaUrl = job.download_url || job.result_file || '';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      layout
      className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/[0.12] transition-colors"
    >
      {/* Active state */}
      {isActiveJob(job.status) && (
        <div className="p-4">
          <div className="aspect-video rounded-xl bg-white/[0.03] flex flex-col items-center justify-center mb-3 relative overflow-hidden">
            {/* Animated shimmer bg */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            <Loader2 className="h-8 w-8 text-violet-400/60 animate-spin mb-2 relative z-10" />
            <span className="text-xs text-violet-400/80 font-medium relative z-10">
              {getStatusText(job.status)}
            </span>
          </div>
          <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mb-2.5">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
              initial={{ width: '5%' }}
              animate={{ width: getStatusPercent(job.status) }}
              transition={{ duration: 20, ease: 'linear' }}
            />
          </div>
          <p className="text-[11px] text-neutral-500 line-clamp-2">{job.prompt}</p>
        </div>
      )}

      {/* Completed image */}
      {job.status === 'completed' && !isVideo && mediaUrl && (
        <>
          <div
            className="relative aspect-square cursor-pointer"
            onClick={() => onPreview(job)}
          >
            <Image
              src={mediaUrl}
              alt={job.prompt}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-3 right-3 flex gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(mediaUrl, false);
                  }}
                  className="p-2 rounded-lg bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
                  aria-label="ดาวน์โหลด"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(job);
                  }}
                  className="p-2 rounded-lg bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
                  aria-label="ขยาย"
                >
                  <Expand className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="px-3.5 py-3 space-y-1.5">
            <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">{job.prompt}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {job.model && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-neutral-500">
                    {job.model}
                  </span>
                )}
                <span className="text-[10px] text-neutral-600">{timeAgo(job.created_at)}</span>
              </div>
              <button
                onClick={() => onDownload(mediaUrl, false)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                aria-label="ดาวน์โหลด"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Completed video */}
      {job.status === 'completed' && isVideo && mediaUrl && (
        <>
          <VideoPlayer
            src={mediaUrl}
            compact
            maxHeight="280px"
          />
          <div className="px-3.5 py-3 space-y-1.5">
            <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">{job.prompt}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {job.model && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-neutral-500">
                    {job.model}
                  </span>
                )}
                <span className="text-[10px] text-neutral-600">{timeAgo(job.created_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onPreview(job)}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                  aria-label="ขยาย"
                >
                  <Expand className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDownload(mediaUrl, true)}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                  aria-label="ดาวน์โหลด"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Failed */}
      {job.status === 'failed' && (
        <div className="p-4">
          <div className="aspect-video rounded-xl bg-red-500/5 border border-red-500/10 flex flex-col items-center justify-center mb-3">
            <AlertTriangle className="h-6 w-6 text-red-400/60 mb-1.5" />
            <span className="text-[11px] text-red-400/80">สร้างไม่สำเร็จ</span>
          </div>
          <p className="text-[11px] text-red-400/60 mb-1">{job.error || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}</p>
          <p className="text-[11px] text-neutral-600 line-clamp-1 mb-2">{job.prompt}</p>
          <button
            onClick={() => onRetry(job)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-violet-400 bg-violet-500/10 hover:bg-violet-500/15 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            ลองใหม่
          </button>
        </div>
      )}

      {/* Cancelled */}
      {job.status === 'cancelled' && (
        <div className="p-4">
          <div className="aspect-video rounded-xl bg-white/[0.02] flex items-center justify-center mb-3">
            <span className="text-xs text-neutral-600">ยกเลิกแล้ว</span>
          </div>
          <p className="text-[11px] text-neutral-600 line-clamp-1">{job.prompt}</p>
        </div>
      )}
    </motion.div>
  );
}
