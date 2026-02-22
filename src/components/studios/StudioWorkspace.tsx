'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  ImagePlus,
  Video,
  Film,
  Blend,
  Upload,
  X,
  Sparkles,
  Loader2,
  Download,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ArrowLeft,
  Settings,
  Expand,
} from 'lucide-react';
import dynamic from 'next/dynamic';
const VideoPlayer = dynamic(
  () => import('@/components/ui/VideoPlayer').then((mod) => ({ default: mod.VideoPlayer })),
  { ssr: false }
);
import { cn } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';
import { SITE_CONFIG } from '@/lib/constants';

type FlowMode = 'image' | 'video' | 'frame_to_video' | 'video_mix';
type JobStatus = 'queued' | 'generating' | 'downloading' | 'completed' | 'failed' | 'cancelled';

interface FlowJob {
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

const MODE_TABS: { mode: FlowMode; label: string; icon: typeof ImagePlus; shortLabel: string }[] = [
  { mode: 'image', label: 'สร้างภาพ', icon: ImagePlus, shortLabel: 'ภาพ' },
  { mode: 'video', label: 'สร้างวิดีโอ', icon: Video, shortLabel: 'วิดีโอ' },
  { mode: 'frame_to_video', label: 'ภาพเป็นวิดีโอ', icon: Film, shortLabel: 'I2V' },
  { mode: 'video_mix', label: 'Video Mix', icon: Blend, shortLabel: 'Mix' },
];

const IMAGE_MODELS = [
  { id: 'Imagen 4', name: 'Imagen 4' },
  { id: 'Nano Banana', name: 'Nano Banana' },
  { id: 'Nano Banana Pro', name: 'Nano Banana Pro' },
];

const VIDEO_MODELS = [
  { id: 'Veo 3.1 - Fast', name: 'Veo 3.1 Fast' },
  { id: 'Veo 3.1 - Quality', name: 'Veo 3.1 Quality' },
  { id: 'Veo 2 - Fast', name: 'Veo 2 Fast' },
  { id: 'Veo 2 - Quality', name: 'Veo 2 Quality' },
];

const ASPECT_RATIOS = ['16:9', '9:16'] as const;

function isActiveJob(status: JobStatus) {
  return status === 'queued' || status === 'generating' || status === 'downloading';
}

export function StudioWorkspace() {
  const [mode, setMode] = useState<FlowMode>('image');
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('Imagen 4');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<FlowJob[]>([]);
  const [previewJob, setPreviewJob] = useState<FlowJob | null>(null);

  // Image uploads
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [endImagePreview, setEndImagePreview] = useState<string | null>(null);
  const [endImageBase64, setEndImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endFileInputRef = useRef<HTMLInputElement>(null);

  // Polling
  const pollingRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const models = mode === 'image' ? IMAGE_MODELS : VIDEO_MODELS;

  // Reset model when mode changes
  useEffect(() => {
    if (mode === 'image') {
      setSelectedModel('Imagen 4');
    } else {
      setSelectedModel('Veo 3.1 - Fast');
    }
  }, [mode]);

  // Cleanup polling on unmount
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
      // Poll every 3s for queued/generating, 2s once downloading
      const interval = setInterval(async () => {
        try {
          const res = await authFetch(`/api/studios/jobs/${jobId}`);
          if (!res.ok) return;

          const job: FlowJob = await res.json();

          setJobs((prev) =>
            prev.map((j) => (j.job_id === jobId ? { ...j, ...job } : j))
          );

          if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEndFrame = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (isEndFrame) {
        setEndImagePreview(result);
        setEndImageBase64(result);
      } else {
        setImagePreview(result);
        setImageBase64(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (isEndFrame = false) => {
    if (isEndFrame) {
      setEndImagePreview(null);
      setEndImageBase64(null);
      if (endFileInputRef.current) endFileInputRef.current.value = '';
    } else {
      setImagePreview(null);
      setImageBase64(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const body: Record<string, string | undefined> = {
        prompt: prompt.trim(),
        mode,
        model: selectedModel,
        aspect_ratio: aspectRatio,
      };

      if ((mode === 'frame_to_video' || mode === 'video_mix') && imageBase64) {
        body.image_url = imageBase64;
      }

      if (mode === 'frame_to_video' && endImageBase64) {
        body.end_image_url = endImageBase64;
      }

      const res = await authFetch('/api/studios/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Generation failed: ${res.status}`);
      }

      const job: FlowJob = await res.json();

      setJobs((prev) => [job, ...prev]);
      startPolling(job.job_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = (job: FlowJob) => {
    setPrompt(job.prompt);
    setMode(job.mode);
    if (job.model) setSelectedModel(job.model);
  };

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

  const needsImage = mode === 'frame_to_video' || mode === 'video_mix';
  const needsEndImage = mode === 'frame_to_video';
  const canGenerate = prompt.trim() && !isGenerating && (!needsImage || imageBase64);

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      {/* Header */}
      <header className="h-12 sm:h-14 flex items-center justify-between px-3 sm:px-4 border-b border-neutral-800 bg-neutral-900 shrink-0">
        <div className="flex items-center gap-2">
          <Link
            href="/chat"
            className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-400" />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-display font-semibold text-base text-white">
            Studios
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <Settings className="h-5 w-5 text-neutral-400" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - Generation Controls */}
        <div className="lg:w-[380px] xl:w-[420px] shrink-0 border-b lg:border-b-0 lg:border-r border-neutral-800 flex flex-col overflow-y-auto">
          {/* Mode Tabs */}
          <div className="flex border-b border-neutral-800 bg-neutral-900/50 shrink-0">
            {MODE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = mode === tab.mode;
              return (
                <button
                  key={tab.mode}
                  onClick={() => setMode(tab.mode)}
                  className={cn(
                    'relative flex-1 flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium transition-colors',
                    isActive
                      ? 'text-violet-400'
                      : 'text-neutral-500 hover:text-neutral-300'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  {isActive && (
                    <motion.div
                      layoutId="studio-mode-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-violet-500 rounded-full"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {/* Prompt */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">
                {mode === 'image' ? 'อธิบายภาพที่ต้องการ' : 'อธิบายวิดีโอที่ต้องการ'}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === 'image'
                    ? 'อธิบายภาพที่ต้องการสร้าง...'
                    : mode === 'video'
                    ? 'อธิบายวิดีโอที่ต้องการสร้าง...'
                    : mode === 'frame_to_video'
                    ? 'อธิบายการเคลื่อนไหวของวิดีโอ...'
                    : 'อธิบายวิดีโอที่ต้องการผสม...'
                }
                rows={4}
                className={cn(
                  'w-full px-4 py-3 rounded-xl resize-none',
                  'bg-neutral-800 border border-neutral-700',
                  'text-white placeholder-neutral-500 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500',
                  'transition-all duration-200'
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleGenerate();
                  }
                }}
              />
            </div>

            {/* Model & Aspect Ratio Row */}
            <div className="flex gap-3">
              {/* Model Selector */}
              <div className="flex-1">
                <label className="text-xs font-medium text-neutral-400 mb-1.5 block">
                  โมเดล
                </label>
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className={cn(
                      'w-full appearance-none px-3 py-2.5 pr-8 rounded-lg',
                      'bg-neutral-800 border border-neutral-700',
                      'text-sm text-white',
                      'focus:outline-none focus:ring-2 focus:ring-violet-500/50',
                      'cursor-pointer'
                    )}
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="text-xs font-medium text-neutral-400 mb-1.5 block">
                  อัตราส่วน
                </label>
                <div className="flex rounded-lg border border-neutral-700 overflow-hidden">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={cn(
                        'px-3 py-2.5 text-xs font-medium transition-colors',
                        aspectRatio === ratio
                          ? 'bg-violet-600 text-white'
                          : 'bg-neutral-800 text-neutral-400 hover:text-white'
                      )}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Image Upload - for frame_to_video and video_mix */}
            <AnimatePresence>
              {needsImage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-neutral-400">
                      {mode === 'frame_to_video' ? 'ภาพเริ่มต้น (บังคับ)' : 'ภาพอ้างอิง (บังคับ)'}
                    </label>
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <div className="relative h-28 w-28 rounded-xl overflow-hidden border border-neutral-700">
                          <Image
                            src={imagePreview}
                            alt="Upload preview"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <button
                          onClick={() => removeImage(false)}
                          className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          'flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed',
                          'border-violet-700/50 bg-violet-950/20',
                          'text-sm text-violet-400 hover:text-violet-300 hover:border-violet-600',
                          'transition-colors w-full justify-center'
                        )}
                      >
                        <Upload className="h-4 w-4" />
                        อัปโหลดภาพ
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, false)}
                      className="hidden"
                    />
                  </div>

                  {/* End Frame Upload - only for frame_to_video */}
                  {needsEndImage && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-400">
                        ภาพสิ้นสุด (ไม่บังคับ - สำหรับ interpolation)
                      </label>
                      {endImagePreview ? (
                        <div className="relative inline-block">
                          <div className="relative h-28 w-28 rounded-xl overflow-hidden border border-neutral-700">
                            <Image
                              src={endImagePreview}
                              alt="End frame preview"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <button
                            onClick={() => removeImage(true)}
                            className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => endFileInputRef.current?.click()}
                          className={cn(
                            'flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed',
                            'border-neutral-700 bg-neutral-800/30',
                            'text-sm text-neutral-500 hover:text-neutral-300 hover:border-neutral-600',
                            'transition-colors w-full justify-center'
                          )}
                        >
                          <Upload className="h-4 w-4" />
                          อัปโหลดภาพสิ้นสุด
                        </button>
                      )}
                      <input
                        ref={endFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, true)}
                        className="hidden"
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 rounded-xl bg-red-900/20 border border-red-800/50 text-sm text-red-400"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Generate Button */}
            <motion.button
              whileHover={{ scale: canGenerate ? 1.02 : 1 }}
              whileTap={{ scale: canGenerate ? 0.98 : 1 }}
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all',
                'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white',
                'hover:from-violet-600 hover:to-fuchsia-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'shadow-lg shadow-violet-500/20'
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  กำลังส่งคำขอ...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  {mode === 'image' ? 'สร้างภาพ' : 'สร้างวิดีโอ'}
                </>
              )}
            </motion.button>

            <p className="text-[10px] text-neutral-600 text-center">
              Ctrl/Cmd + Enter เพื่อสร้าง
            </p>
          </div>
        </div>

        {/* Right Panel - Results Gallery */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="p-5 rounded-2xl bg-neutral-800/50 mb-4">
                <Sparkles className="h-12 w-12 text-neutral-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-400 mb-2">
                AI Creative Workspace
              </h3>
              <p className="text-neutral-600 text-sm max-w-sm">
                เลือกโหมด พิมพ์คำอธิบาย แล้วกดสร้างเพื่อเริ่มต้นสร้างสรรค์ผลงานด้วย AI
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-neutral-300">
                ผลงาน ({jobs.length})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {jobs.map((job) => (
                    <motion.div
                      key={job.job_id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                      className="rounded-xl border border-neutral-700 bg-neutral-800/50 overflow-hidden"
                    >
                      {/* Active / Processing */}
                      {isActiveJob(job.status) && (
                        <div className="p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 text-violet-400 animate-spin shrink-0" />
                            <span className="text-xs font-medium text-violet-400 capitalize">
                              {job.status === 'queued'
                                ? 'อยู่ในคิว...'
                                : job.status === 'generating'
                                ? 'กำลังสร้าง...'
                                : 'กำลังดาวน์โหลด...'}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 line-clamp-2">
                            {job.prompt}
                          </p>
                          <div className="h-1.5 rounded-full bg-neutral-700 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                              initial={{ width: '5%' }}
                              animate={{ width: job.status === 'downloading' ? '90%' : '60%' }}
                              transition={{ duration: 30, ease: 'linear' }}
                            />
                          </div>
                          <div className="aspect-video rounded-lg bg-neutral-900 animate-pulse" />
                        </div>
                      )}

                      {/* Completed */}
                      {job.status === 'completed' && (job.download_url || job.result_file) && (
                        <div>
                          {job.mode === 'image' ? (
                            <div
                              className="relative aspect-square cursor-pointer group"
                              onClick={() => setPreviewJob(job)}
                            >
                              <Image
                                src={job.download_url || job.result_file || ''}
                                alt={job.prompt}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <Expand className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ) : (
                            <VideoPlayer
                              src={job.download_url || job.result_file || ''}
                              compact
                              maxHeight="300px"
                            />
                          )}

                          <div className="p-3 space-y-2 border-t border-neutral-700">
                            <p className="text-xs text-neutral-400 line-clamp-2">
                              {job.prompt}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-neutral-600">
                                {job.model}
                              </span>
                              <button
                                onClick={() =>
                                  handleDownload(
                                    job.download_url || job.result_file || '',
                                    job.mode !== 'image'
                                  )
                                }
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                              >
                                <Download className="h-3 w-3" />
                                บันทึก
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Failed */}
                      {job.status === 'failed' && (
                        <div className="p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                            <span className="text-xs font-medium text-red-400">
                              สร้างไม่สำเร็จ
                            </span>
                          </div>
                          <p className="text-xs text-red-400/70">
                            {job.error || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}
                          </p>
                          <p className="text-xs text-neutral-500 line-clamp-2">
                            {job.prompt}
                          </p>
                          <button
                            onClick={() => handleRetry(job)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-violet-400 hover:bg-violet-500/10 transition-colors"
                          >
                            <RotateCcw className="h-3 w-3" />
                            ลองใหม่
                          </button>
                        </div>
                      )}

                      {/* Cancelled */}
                      {job.status === 'cancelled' && (
                        <div className="p-4 space-y-2">
                          <span className="text-xs font-medium text-neutral-500">
                            ยกเลิกแล้ว
                          </span>
                          <p className="text-xs text-neutral-600 line-clamp-2">
                            {job.prompt}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setPreviewJob(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewJob(null)}
                className="absolute -top-3 -right-3 z-10 p-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <Image
                src={previewJob.download_url || previewJob.result_file || ''}
                alt={previewJob.prompt}
                width={1024}
                height={1024}
                className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
                unoptimized
              />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-neutral-400 line-clamp-1 flex-1 mr-4">
                  {previewJob.prompt}
                </p>
                <button
                  onClick={() =>
                    handleDownload(
                      previewJob.download_url || previewJob.result_file || '',
                      false
                    )
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors shrink-0"
                >
                  <Download className="h-4 w-4" />
                  ดาวน์โหลด
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
