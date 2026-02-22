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
  Wand2,
  RectangleHorizontal,
  Square,
  RectangleVertical,
  Clock,
  Minus,
  Plus,
  Layers,
  Home,
} from 'lucide-react';
import dynamic from 'next/dynamic';
const VideoPlayer = dynamic(
  () => import('@/components/ui/VideoPlayer').then((mod) => ({ default: mod.VideoPlayer })),
  { ssr: false }
);
import { cn } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';

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

// -- Sidebar nav items --
const SIDEBAR_ITEMS = [
  { id: 'create', icon: Wand2, label: 'สร้าง', href: '' },
  { id: 'gallery', icon: Layers, label: 'ผลงาน', href: '' },
] as const;

// -- Mode configs --
const MODE_CONFIGS: { mode: FlowMode; label: string; icon: typeof ImagePlus; description: string }[] = [
  { mode: 'image', label: 'Text to Image', icon: ImagePlus, description: 'สร้างภาพจากข้อความ' },
  { mode: 'video', label: 'Text to Video', icon: Video, description: 'สร้างวิดีโอจากข้อความ' },
  { mode: 'frame_to_video', label: 'Image to Video', icon: Film, description: 'เปลี่ยนภาพเป็นวิดีโอ' },
  { mode: 'video_mix', label: 'Video Mix', icon: Blend, description: 'ผสมวิดีโอด้วย AI' },
];

const IMAGE_MODELS = [
  { id: 'Imagen 4', name: 'Imagen 4', tag: 'Recommended' },
  { id: 'Nano Banana', name: 'Nano Banana', tag: 'Fast' },
  { id: 'Nano Banana Pro', name: 'Nano Banana Pro', tag: 'Quality' },
];

const VIDEO_MODELS = [
  { id: 'Veo 3.1 - Fast', name: 'Veo 3.1 Fast', tag: 'Fast' },
  { id: 'Veo 3.1 - Quality', name: 'Veo 3.1 Quality', tag: 'Quality' },
  { id: 'Veo 2 - Fast', name: 'Veo 2 Fast', tag: 'Fast' },
  { id: 'Veo 2 - Quality', name: 'Veo 2 Quality', tag: 'Quality' },
];

const ASPECT_RATIOS = [
  { value: '16:9', icon: RectangleHorizontal, label: '16:9' },
  { value: '1:1', icon: Square, label: '1:1' },
  { value: '9:16', icon: RectangleVertical, label: '9:16' },
];

function isActiveJob(status: JobStatus) {
  return status === 'queued' || status === 'generating' || status === 'downloading';
}

function getStatusText(status: JobStatus) {
  switch (status) {
    case 'queued': return 'รอคิว...';
    case 'generating': return 'กำลังสร้าง...';
    case 'downloading': return 'กำลังเตรียมไฟล์...';
    default: return status;
  }
}

function getStatusPercent(status: JobStatus) {
  switch (status) {
    case 'queued': return '15%';
    case 'generating': return '60%';
    case 'downloading': return '90%';
    default: return '0%';
  }
}

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'เมื่อสักครู่';
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(diff / 86400)} วันที่แล้ว`;
}

export function StudioWorkspace() {
  const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');
  const [mode, setMode] = useState<FlowMode>('image');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showNegativePrompt, setShowNegativePrompt] = useState(false);
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
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Polling
  const pollingRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const models = mode === 'image' ? IMAGE_MODELS : VIDEO_MODELS;

  useEffect(() => {
    if (mode === 'image') {
      setSelectedModel('Imagen 4');
    } else {
      setSelectedModel('Veo 3.1 - Fast');
    }
  }, [mode]);

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
      const interval = setInterval(async () => {
        try {
          const res = await authFetch(`/api/studios/jobs/${jobId}`);
          if (!res.ok) return;
          const job: FlowJob = await res.json();
          setJobs((prev) => prev.map((j) => (j.job_id === jobId ? { ...j, ...job } : j)));
          if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
            stopPolling(jobId);
          }
        } catch { /* keep polling */ }
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
      if (isEndFrame) { setEndImagePreview(result); setEndImageBase64(result); }
      else { setImagePreview(result); setImageBase64(result); }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (isEndFrame = false) => {
    if (isEndFrame) {
      setEndImagePreview(null); setEndImageBase64(null);
      if (endFileInputRef.current) endFileInputRef.current.value = '';
    } else {
      setImagePreview(null); setImageBase64(null);
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
      setActiveTab('gallery');
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
    setActiveTab('create');
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
  const activeJobs = jobs.filter((j) => isActiveJob(j.status));

  return (
    <div className="flex h-full bg-[#0a0a0a]">
      {/* === Compact Sidebar (desktop only) === */}
      <div className="hidden md:flex flex-col w-[68px] bg-[#0f0f0f] border-r border-white/[0.06] py-4 items-center gap-1 shrink-0">
        {/* Logo */}
        <Link href="/" className="mb-4 p-2 rounded-xl hover:bg-white/5 transition-colors">
          <Home className="h-5 w-5 text-neutral-400" />
        </Link>

        <div className="w-8 h-px bg-white/[0.06] mb-2" />

        {/* Nav items */}
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as 'create' | 'gallery')}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl w-14 transition-all',
                isActive
                  ? 'bg-violet-500/10 text-violet-400'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          );
        })}

        {/* Active jobs indicator */}
        {activeJobs.length > 0 && (
          <button
            onClick={() => setActiveTab('gallery')}
            className="mt-2 relative p-2 rounded-xl text-violet-400 hover:bg-white/5 transition-colors"
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-violet-500 text-[9px] text-white flex items-center justify-center font-bold">
              {activeJobs.length}
            </span>
          </button>
        )}

        <div className="flex-1" />

        {/* Settings */}
        <Link
          href="/settings"
          className="p-2 rounded-xl text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-colors"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>

      {/* === Mobile Header === */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="md:hidden h-12 flex items-center justify-between px-3 border-b border-white/[0.06] bg-[#0f0f0f] shrink-0">
          <Link href="/chat" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft className="h-5 w-5 text-neutral-400" />
          </Link>
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-violet-400" />
            <span className="font-semibold text-sm text-white">Studios</span>
          </div>
          <Link href="/settings" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <Settings className="h-5 w-5 text-neutral-400" />
          </Link>
        </header>

        {/* === Mobile Tab Switcher === */}
        <div className="md:hidden flex border-b border-white/[0.06] bg-[#0f0f0f]">
          {(['create', 'gallery'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2.5 text-xs font-medium transition-colors relative',
                activeTab === tab ? 'text-violet-400' : 'text-neutral-500'
              )}
            >
              {tab === 'create' ? 'สร้างผลงาน' : `ผลงาน${jobs.length > 0 ? ` (${jobs.length})` : ''}`}
              {activeTab === tab && (
                <motion.div
                  layoutId="mobile-tab"
                  className="absolute bottom-0 left-4 right-4 h-0.5 bg-violet-500 rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* === Main Content === */}
        <div className="flex-1 flex overflow-hidden">
          {/* --- Create Panel --- */}
          <div className={cn(
            'flex flex-col overflow-y-auto',
            activeTab === 'create' ? 'flex' : 'hidden md:flex',
            'md:w-[400px] lg:w-[440px] md:border-r border-white/[0.06] bg-[#0f0f0f]'
          )}>
            {/* Desktop header */}
            <div className="hidden md:flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
              <Wand2 className="h-5 w-5 text-violet-400" />
              <h1 className="text-base font-semibold text-white">AI Creative Studio</h1>
            </div>

            {/* Mode selector */}
            <div className="px-4 pt-4 pb-2">
              <div className="grid grid-cols-2 gap-2">
                {MODE_CONFIGS.map((cfg) => {
                  const Icon = cfg.icon;
                  const isActive = mode === cfg.mode;
                  return (
                    <button
                      key={cfg.mode}
                      onClick={() => setMode(cfg.mode)}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all',
                        isActive
                          ? 'bg-violet-500/15 border border-violet-500/30 text-violet-300'
                          : 'bg-white/[0.03] border border-white/[0.06] text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-300'
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-violet-400' : 'text-neutral-500')} />
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{cfg.label}</div>
                        <div className={cn('text-[10px] truncate', isActive ? 'text-violet-400/60' : 'text-neutral-600')}>
                          {cfg.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Controls */}
            <div className="flex-1 px-4 py-3 space-y-4 overflow-y-auto">
              {/* Prompt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-400">Prompt</label>
                  <span className={cn(
                    'text-[10px] tabular-nums',
                    prompt.length > 1800 ? 'text-red-400' : 'text-neutral-600'
                  )}>
                    {prompt.length}/2000
                  </span>
                </div>
                <textarea
                  ref={promptRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    mode === 'image'
                      ? 'อธิบายภาพที่ต้องการสร้าง เช่น A serene Japanese garden with cherry blossoms...'
                      : mode === 'video'
                      ? 'อธิบายวิดีโอที่ต้องการ เช่น A cinematic drone shot flying over mountains...'
                      : mode === 'frame_to_video'
                      ? 'อธิบายการเคลื่อนไหว เช่น Camera slowly zooms in, flowers sway gently...'
                      : 'อธิบายวิดีโอที่ต้องการผสม...'
                  }
                  rows={5}
                  maxLength={2000}
                  className={cn(
                    'w-full px-3.5 py-3 rounded-xl resize-none text-[13px] leading-relaxed',
                    'bg-white/[0.04] border border-white/[0.08]',
                    'text-white placeholder-neutral-600',
                    'focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.06]',
                    'transition-all duration-200'
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
                  }}
                />
              </div>

              {/* Negative Prompt (collapsible) */}
              <div>
                <button
                  onClick={() => setShowNegativePrompt(!showNegativePrompt)}
                  className="flex items-center gap-1.5 text-[11px] text-neutral-500 hover:text-neutral-400 transition-colors"
                >
                  {showNegativePrompt ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  Negative Prompt
                </button>
                <AnimatePresence>
                  {showNegativePrompt && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <textarea
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="สิ่งที่ไม่ต้องการ เช่น blur, distortion, watermark..."
                        rows={2}
                        className={cn(
                          'w-full mt-2 px-3.5 py-2.5 rounded-xl resize-none text-[13px]',
                          'bg-white/[0.04] border border-white/[0.08]',
                          'text-white placeholder-neutral-600',
                          'focus:outline-none focus:border-violet-500/40',
                          'transition-all duration-200'
                        )}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Image Upload (frame_to_video / video_mix) */}
              <AnimatePresence>
                {needsImage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    {/* Start frame / Reference image */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-400">
                        {mode === 'frame_to_video' ? 'Start Frame' : 'Reference Image'}
                        <span className="text-red-400 ml-1">*</span>
                      </label>
                      {imagePreview ? (
                        <div className="relative group">
                          <div className="relative h-40 w-full rounded-xl overflow-hidden border border-white/[0.08]">
                            <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized />
                          </div>
                          <button
                            onClick={() => removeImage(false)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className={cn(
                            'w-full h-32 flex flex-col items-center justify-center gap-2 rounded-xl',
                            'border-2 border-dashed border-white/[0.08] hover:border-violet-500/30',
                            'bg-white/[0.02] hover:bg-violet-500/5',
                            'transition-all cursor-pointer'
                          )}
                        >
                          <Upload className="h-6 w-6 text-neutral-600" />
                          <span className="text-xs text-neutral-500">คลิกหรือลากไฟล์มาวาง</span>
                        </button>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} className="hidden" />
                    </div>

                    {/* End frame (frame_to_video only, optional) */}
                    {needsEndImage && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-neutral-400">
                          End Frame <span className="text-neutral-600">(Optional)</span>
                        </label>
                        {endImagePreview ? (
                          <div className="relative group">
                            <div className="relative h-32 w-full rounded-xl overflow-hidden border border-white/[0.08]">
                              <Image src={endImagePreview} alt="End frame" fill className="object-cover" unoptimized />
                            </div>
                            <button
                              onClick={() => removeImage(true)}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => endFileInputRef.current?.click()}
                            className={cn(
                              'w-full h-24 flex flex-col items-center justify-center gap-1.5 rounded-xl',
                              'border-2 border-dashed border-white/[0.06] hover:border-white/[0.12]',
                              'bg-white/[0.02] hover:bg-white/[0.04]',
                              'transition-all cursor-pointer'
                            )}
                          >
                            <Upload className="h-5 w-5 text-neutral-600" />
                            <span className="text-[10px] text-neutral-600">อัปโหลดภาพสิ้นสุด</span>
                          </button>
                        )}
                        <input ref={endFileInputRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="hidden" />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Settings section */}
              <div className="space-y-3">
                <div className="h-px bg-white/[0.06]" />

                {/* Model */}
                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Model</label>
                  <div className="relative">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className={cn(
                        'w-full appearance-none px-3 py-2.5 pr-8 rounded-xl text-[13px]',
                        'bg-white/[0.04] border border-white/[0.08]',
                        'text-white',
                        'focus:outline-none focus:border-violet-500/40',
                        'cursor-pointer transition-colors'
                      )}
                    >
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.tag})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Aspect Ratio</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ASPECT_RATIOS.map((ar) => {
                      const Icon = ar.icon;
                      const isActive = aspectRatio === ar.value;
                      return (
                        <button
                          key={ar.value}
                          onClick={() => setAspectRatio(ar.value)}
                          className={cn(
                            'flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all',
                            isActive
                              ? 'bg-violet-500/15 border border-violet-500/30 text-violet-300'
                              : 'bg-white/[0.04] border border-white/[0.06] text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.06]'
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {ar.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[13px] text-red-400"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: canGenerate ? 1.01 : 1 }}
                whileTap={{ scale: canGenerate ? 0.98 : 1 }}
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={cn(
                  'w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all',
                  'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white',
                  'hover:from-violet-500 hover:to-fuchsia-500',
                  'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-violet-600 disabled:hover:to-fuchsia-600',
                  'shadow-lg shadow-violet-500/20',
                  'active:shadow-none'
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังส่งคำขอ...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {mode === 'image' ? 'Generate Image' : 'Generate Video'}
                  </>
                )}
              </motion.button>

              <p className="text-[10px] text-neutral-600 text-center pb-2">
                <kbd className="px-1 py-0.5 rounded bg-white/[0.06] text-neutral-500 text-[9px]">Ctrl</kbd>
                {' + '}
                <kbd className="px-1 py-0.5 rounded bg-white/[0.06] text-neutral-500 text-[9px]">Enter</kbd>
                {' เพื่อสร้าง'}
              </p>
            </div>
          </div>

          {/* --- Gallery Panel --- */}
          <div className={cn(
            'flex-1 overflow-y-auto bg-[#0a0a0a]',
            activeTab === 'gallery' ? 'flex flex-col' : 'hidden md:flex md:flex-col'
          )}>
            {/* Gallery header */}
            <div className="sticky top-0 z-10 px-5 py-3.5 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  My Creatives
                  {jobs.length > 0 && <span className="ml-2 text-neutral-500 font-normal">({jobs.length})</span>}
                </h2>
                {activeJobs.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-violet-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {activeJobs.length} กำลังสร้าง
                  </div>
                )}
              </div>
            </div>

            {/* Gallery content */}
            <div className="flex-1 p-4 lg:p-5">
              {jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-neutral-700" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                      <Plus className="h-3 w-3 text-violet-400" />
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-neutral-300 mb-1.5">
                    เริ่มสร้างผลงานแรก
                  </h3>
                  <p className="text-neutral-600 text-sm max-w-xs mb-6">
                    เลือกโหมด พิมพ์คำอธิบาย แล้วกดสร้างเพื่อเริ่มต้นสร้างสรรค์ผลงานด้วย AI
                  </p>
                  <button
                    onClick={() => { setActiveTab('create'); promptRef.current?.focus(); }}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium bg-violet-500/15 text-violet-400 border border-violet-500/20 hover:bg-violet-500/25 transition-colors"
                  >
                    เริ่มสร้าง
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  <AnimatePresence mode="popLayout">
                    {jobs.map((job) => (
                      <motion.div
                        key={job.job_id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        layout
                        className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/[0.12] transition-colors"
                      >
                        {/* Processing */}
                        {isActiveJob(job.status) && (
                          <div className="p-4">
                            <div className="aspect-video rounded-xl bg-white/[0.03] flex flex-col items-center justify-center mb-3 relative overflow-hidden">
                              {/* Animated shimmer bg */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
                              <Loader2 className="h-8 w-8 text-violet-400/60 animate-spin mb-2 relative z-10" />
                              <span className="text-xs text-violet-400/80 font-medium relative z-10">{getStatusText(job.status)}</span>
                            </div>
                            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                                initial={{ width: '5%' }}
                                animate={{ width: getStatusPercent(job.status) }}
                                transition={{ duration: 20, ease: 'linear' }}
                              />
                            </div>
                            <p className="text-[11px] text-neutral-500 mt-2.5 line-clamp-2">{job.prompt}</p>
                          </div>
                        )}

                        {/* Completed */}
                        {job.status === 'completed' && (job.download_url || job.result_file) && (
                          <>
                            {job.mode === 'image' ? (
                              <div
                                className="relative aspect-square cursor-pointer"
                                onClick={() => setPreviewJob(job)}
                              >
                                <Image
                                  src={job.download_url || job.result_file || ''}
                                  alt={job.prompt}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="absolute bottom-3 right-3 flex gap-1.5">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDownload(job.download_url || job.result_file || '', false); }}
                                      className="p-2 rounded-lg bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setPreviewJob(job); }}
                                      className="p-2 rounded-lg bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
                                    >
                                      <Expand className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <VideoPlayer
                                src={job.download_url || job.result_file || ''}
                                compact
                                maxHeight="280px"
                              />
                            )}

                            <div className="px-3.5 py-3 space-y-1.5">
                              <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">{job.prompt}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-neutral-500">{job.model}</span>
                                  <span className="text-[10px] text-neutral-600">{timeAgo(job.created_at)}</span>
                                </div>
                                <button
                                  onClick={() => handleDownload(job.download_url || job.result_file || '', job.mode !== 'image')}
                                  className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
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
                            <p className="text-[11px] text-red-400/60 mb-1">{job.error || 'Unknown error'}</p>
                            <p className="text-[11px] text-neutral-600 line-clamp-1 mb-2">{job.prompt}</p>
                            <button
                              onClick={() => handleRetry(job)}
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
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === Image Preview Modal === */}
      <AnimatePresence>
        {previewJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={() => setPreviewJob(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative max-w-5xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewJob(null)}
                className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <Image
                src={previewJob.download_url || previewJob.result_file || ''}
                alt={previewJob.prompt}
                width={1024}
                height={1024}
                className="w-full h-auto max-h-[82vh] object-contain rounded-2xl"
                unoptimized
              />
              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-300 line-clamp-2">{previewJob.prompt}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-neutral-400">{previewJob.model}</span>
                    <span className="text-[10px] text-neutral-600">{timeAgo(previewJob.created_at)}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(previewJob.download_url || previewJob.result_file || '', false)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors shrink-0"
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
