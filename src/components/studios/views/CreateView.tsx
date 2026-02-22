'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  ImagePlus,
  Video,
  Film,
  Blend,
  Upload,
  X,
  Sparkles,
  Loader2,
  ChevronDown,
  Plus,
  Minus,
  RectangleHorizontal,
  Square,
  RectangleVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';
import type { CreateViewProps, FlowJob, FlowMode } from '../StudioWorkspace';
import { JobCard } from '../components/JobCard';

// ─── Constants ───────────────────────────────────────────────────────────────

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
  { value: '16:9', label: '16:9', Icon: RectangleHorizontal },
  { value: '1:1', label: '1:1', Icon: Square },
  { value: '9:16', label: '9:16', Icon: RectangleVertical },
];

type MainTab = 'video' | 'image';
type VideoSubMode = 'video' | 'frame_to_video' | 'video_mix';
type RightFilter = 'all' | 'images' | 'videos' | 'active';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isActiveJob(status: string) {
  return status === 'queued' || status === 'generating' || status === 'downloading';
}

function getModePromptPlaceholder(mode: FlowMode): string {
  switch (mode) {
    case 'image':
      return 'อธิบายภาพที่ต้องการสร้าง เช่น "แมวส้มนอนหลับบนก้อนเมฆสีขาว..."';
    case 'video':
      return 'อธิบายวิดีโอที่ต้องการสร้าง เช่น "ดวงอาทิตย์ตกที่ทะเล คลื่นซัดชายหาด..."';
    case 'frame_to_video':
      return 'อธิบายการเคลื่อนไหวที่ต้องการจากภาพ เช่น "ทำให้ภาพเคลื่อนไหวช้าๆ..."';
    case 'video_mix':
      return 'อธิบายวิดีโอที่ต้องการโดยอ้างอิงจากภาพตัวอย่าง...';
    default:
      return 'อธิบายสิ่งที่ต้องการสร้าง...';
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface DropzoneProps {
  label: string;
  required?: boolean;
  preview: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

function Dropzone({ label, required, preview, inputRef, onUpload, onRemove }: DropzoneProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <span className="text-xs text-neutral-400">{label}</span>
        {required && <span className="text-[10px] text-red-400">*</span>}
      </div>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-white/[0.08] aspect-video">
          <Image src={preview} alt={label} fill className="object-cover" unoptimized />
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors"
            aria-label="ลบภาพ"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className={cn(
            'w-full aspect-video rounded-xl border border-dashed border-white/[0.12]',
            'bg-white/[0.02] hover:bg-white/[0.04] hover:border-violet-500/30',
            'flex flex-col items-center justify-center gap-2 transition-all group'
          )}
          aria-label={`อัปโหลด ${label}`}
        >
          <Upload className="h-5 w-5 text-neutral-600 group-hover:text-violet-400 transition-colors" />
          <span className="text-[11px] text-neutral-600 group-hover:text-neutral-400 transition-colors">
            คลิกเพื่ออัปโหลดภาพ
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onUpload}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CreateView({
  jobs,
  onPreview,
  onRetry,
  onDownload,
  onNavigate,
  onJobCreated,
  startPolling,
  isGenerating,
  setIsGenerating,
}: CreateViewProps) {
  // ── Tab / Mode state ──────────────────────────────────────────────────────
  const [mainTab, setMainTab] = useState<MainTab>('video');
  const [videoSubMode, setVideoSubMode] = useState<VideoSubMode>('video');

  const mode: FlowMode =
    mainTab === 'image' ? 'image' : videoSubMode;

  // ── Form state ────────────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showNegativePrompt, setShowNegativePrompt] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('Veo 3.1 - Fast');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [error, setError] = useState<string | null>(null);

  // ── Image state ───────────────────────────────────────────────────────────
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [endImagePreview, setEndImagePreview] = useState<string | null>(null);
  const [endImageBase64, setEndImageBase64] = useState<string | null>(null);

  // ── Right panel ───────────────────────────────────────────────────────────
  const [rightPanelFilter, setRightPanelFilter] = useState<RightFilter>('all');
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endFileInputRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Auto-switch model on mode change ─────────────────────────────────────
  useEffect(() => {
    if (mode === 'image') setSelectedModel('Imagen 4');
    else setSelectedModel('Veo 3.1 - Fast');
  }, [mode]);

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowModelDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Upload handlers ───────────────────────────────────────────────────────
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, isEndFrame = false) => {
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
    },
    []
  );

  const removeImage = useCallback((isEndFrame = false) => {
    if (isEndFrame) {
      setEndImagePreview(null);
      setEndImageBase64(null);
      if (endFileInputRef.current) endFileInputRef.current.value = '';
    } else {
      setImagePreview(null);
      setImageBase64(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  // ── Generation handler ────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
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
      onJobCreated(job);
      startPolling(job.job_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isGenerating, mode, selectedModel, aspectRatio, imageBase64, endImageBase64, onJobCreated, startPolling, setIsGenerating]);

  // ── Ctrl+Enter shortcut ───────────────────────────────────────────────────
  const handlePromptKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate]
  );

  // ── Filtered jobs for right panel ─────────────────────────────────────────
  const filteredJobs = jobs.filter((job) => {
    if (rightPanelFilter === 'all') return true;
    if (rightPanelFilter === 'images') return job.mode === 'image';
    if (rightPanelFilter === 'videos') return job.mode !== 'image';
    if (rightPanelFilter === 'active') return isActiveJob(job.status);
    return true;
  });

  const activeCount = jobs.filter((j) => isActiveJob(j.status)).length;

  const currentModels = mode === 'image' ? IMAGE_MODELS : VIDEO_MODELS;
  const currentModelObj = currentModels.find((m) => m.id === selectedModel) ?? currentModels[0];

  const showImageUpload = mode === 'frame_to_video' || mode === 'video_mix';
  const showEndFrame = mode === 'frame_to_video';

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Left: Creation Panel ── */}
      <div className="w-full md:w-[420px] lg:w-[460px] flex flex-col border-r border-white/[0.06] bg-[#111214] overflow-y-auto shrink-0">

        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500/15">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <span className="text-sm font-semibold text-white">สร้างผลงาน</span>
          </div>

          {/* Main tabs */}
          <div className="flex gap-0 border-b border-white/[0.06]">
            {(
              [
                { id: 'video' as MainTab, label: 'สร้างวิดีโอ', Icon: Video },
                { id: 'image' as MainTab, label: 'สร้างรูปภาพ', Icon: ImagePlus },
              ] as { id: MainTab; label: string; Icon: typeof Video }[]
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setMainTab(id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                  mainTab === id
                    ? 'text-violet-400 border-violet-400'
                    : 'text-neutral-500 border-transparent hover:text-neutral-300'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Video sub-mode pills */}
          <AnimatePresence initial={false}>
            {mainTab === 'video' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 flex-wrap">
                  {(
                    [
                      { id: 'video' as VideoSubMode, label: 'Text to Video', Icon: Film },
                      { id: 'frame_to_video' as VideoSubMode, label: 'Image to Video', Icon: Video },
                      { id: 'video_mix' as VideoSubMode, label: 'Video Mix', Icon: Blend },
                    ] as { id: VideoSubMode; label: string; Icon: typeof Film }[]
                  ).map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      onClick={() => setVideoSubMode(id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                        videoSubMode === id
                          ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                          : 'border-white/[0.08] text-neutral-500 hover:text-neutral-300 hover:border-white/[0.14] bg-white/[0.02]'
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Image upload section (frame_to_video / video_mix) */}
          <AnimatePresence initial={false}>
            {showImageUpload && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-3"
              >
                {/* Start frame / reference image */}
                <Dropzone
                  label={mode === 'video_mix' ? 'ภาพอ้างอิง' : 'ภาพเริ่มต้น (Start Frame)'}
                  required
                  preview={imagePreview}
                  inputRef={fileInputRef}
                  onUpload={(e) => handleImageUpload(e, false)}
                  onRemove={() => removeImage(false)}
                />

                {/* End frame (frame_to_video only) */}
                {showEndFrame && (
                  <Dropzone
                    label="ภาพสิ้นสุด (End Frame)"
                    preview={endImagePreview}
                    inputRef={endFileInputRef}
                    onUpload={(e) => handleImageUpload(e, true)}
                    onRemove={() => removeImage(true)}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Prompt textarea */}
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400 font-medium">Prompt</label>
            <textarea
              ref={promptRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handlePromptKeyDown}
              rows={6}
              maxLength={2000}
              placeholder={getModePromptPlaceholder(mode)}
              className={cn(
                'w-full resize-none rounded-xl px-3.5 py-3 text-sm text-neutral-200',
                'bg-white/[0.04] border border-white/[0.08]',
                'placeholder:text-neutral-600',
                'focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.06]',
                'transition-all leading-relaxed'
              )}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neutral-700">{prompt.length}/2000</span>
            </div>
          </div>

          {/* Negative prompt (collapsible) */}
          <div className="space-y-1.5">
            <button
              onClick={() => setShowNegativePrompt((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
              aria-expanded={showNegativePrompt}
            >
              {showNegativePrompt ? (
                <Minus className="h-3 w-3" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              Negative Prompt
            </button>
            <AnimatePresence initial={false}>
              {showNegativePrompt && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <textarea
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    rows={3}
                    placeholder="สิ่งที่ไม่ต้องการในภาพ เช่น blurry, low quality, distorted..."
                    className={cn(
                      'w-full resize-none rounded-xl px-3.5 py-3 text-sm text-neutral-200',
                      'bg-white/[0.04] border border-white/[0.08]',
                      'placeholder:text-neutral-600',
                      'focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.06]',
                      'transition-all leading-relaxed'
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Model selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400 font-medium">โมเดล</label>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowModelDropdown((v) => !v)}
                className={cn(
                  'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm',
                  'bg-white/[0.04] border border-white/[0.08]',
                  'hover:border-white/[0.14] hover:bg-white/[0.06] transition-all',
                  showModelDropdown && 'border-violet-500/40 bg-white/[0.06]'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-neutral-200">{currentModelObj?.name}</span>
                  {currentModelObj?.tag && (
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded font-medium',
                      currentModelObj.tag === 'Recommended'
                        ? 'bg-violet-500/20 text-violet-300'
                        : currentModelObj.tag === 'Fast'
                        ? 'bg-cyan-500/15 text-cyan-300'
                        : 'bg-amber-500/15 text-amber-300'
                    )}>
                      {currentModelObj.tag}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-neutral-500 transition-transform duration-200',
                    showModelDropdown && 'rotate-180'
                  )}
                />
              </button>

              <AnimatePresence>
                {showModelDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      'absolute left-0 right-0 top-full mt-1.5 z-50',
                      'rounded-xl border border-white/[0.08] bg-[#1a1c1f]',
                      'shadow-2xl shadow-black/60 overflow-hidden'
                    )}
                  >
                    {currentModels.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedModel(m.id);
                          setShowModelDropdown(false);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors',
                          'hover:bg-white/[0.04]',
                          selectedModel === m.id
                            ? 'text-violet-300 bg-violet-500/10'
                            : 'text-neutral-300'
                        )}
                      >
                        <span>{m.name}</span>
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded font-medium',
                          m.tag === 'Recommended'
                            ? 'bg-violet-500/20 text-violet-300'
                            : m.tag === 'Fast'
                            ? 'bg-cyan-500/15 text-cyan-300'
                            : 'bg-amber-500/15 text-amber-300'
                        )}>
                          {m.tag}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Aspect ratio */}
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400 font-medium">สัดส่วนภาพ</label>
            <div className="flex gap-2">
              {ASPECT_RATIOS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => setAspectRatio(value)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-all',
                    aspectRatio === value
                      ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                      : 'border-white/[0.08] text-neutral-500 hover:text-neutral-300 hover:border-white/[0.14] bg-white/[0.02]'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 leading-relaxed">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate button */}
          <div className="space-y-2 pb-2">
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl',
                'bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400',
                'text-white font-semibold text-sm',
                'shadow-lg shadow-violet-500/20',
                'transition-all duration-200',
                'hover:shadow-violet-500/30 hover:brightness-110 active:scale-[0.99]',
                'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100'
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  สร้างเลย
                </>
              )}
            </button>

            {/* Ctrl+Enter hint */}
            <p className="text-center text-[10px] text-neutral-700">
              กด{' '}
              <kbd className="px-1 py-0.5 rounded bg-white/[0.06] text-neutral-600 font-mono text-[9px]">
                Ctrl
              </kbd>
              {' + '}
              <kbd className="px-1 py-0.5 rounded bg-white/[0.06] text-neutral-600 font-mono text-[9px]">
                Enter
              </kbd>
              {' '}เพื่อสร้างได้เลย
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: Output Gallery (hidden on mobile) ── */}
      <div className="hidden md:flex flex-1 flex-col bg-[#0a0a0a] overflow-hidden">

        {/* Right panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">ผลงานล่าสุด</span>
            {jobs.length > 0 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-500 tabular-nums">
                {jobs.length}
              </span>
            )}
            {activeCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                {activeCount} กำลังสร้าง
              </span>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-0.5">
            {(
              [
                { id: 'all' as RightFilter, label: 'ทั้งหมด' },
                { id: 'images' as RightFilter, label: 'รูปภาพ' },
                { id: 'videos' as RightFilter, label: 'วิดีโอ' },
                { id: 'active' as RightFilter, label: 'กำลังสร้าง' },
              ] as { id: RightFilter; label: string }[]
            ).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setRightPanelFilter(id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  rightPanelFilter === id
                    ? 'bg-violet-500/15 text-violet-300'
                    : 'text-neutral-600 hover:text-neutral-400 hover:bg-white/[0.04]'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery */}
        <div className="flex-1 overflow-y-auto">
          {filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-neutral-700" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-neutral-500 font-medium">
                  {rightPanelFilter === 'active'
                    ? 'ไม่มีงานที่กำลังสร้าง'
                    : 'เริ่มสร้างผลงานแรกของคุณ'}
                </p>
                <p className="text-xs text-neutral-700 leading-relaxed">
                  {rightPanelFilter === 'active'
                    ? 'งานทั้งหมดเสร็จสมบูรณ์แล้ว'
                    : 'พิมพ์ prompt แล้วกดสร้างเลย เพื่อเริ่มต้น'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
              <AnimatePresence mode="popLayout">
                {filteredJobs.map((job) => (
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
          )}
        </div>
      </div>
    </div>
  );
}
