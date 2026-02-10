'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Video, Download, Loader2, ChevronDown, Sparkles, Upload, X, ImagePlus } from 'lucide-react';
import { getVideoModels } from '@/lib/openrouter';
import { cn } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';

interface VideoResult {
  taskId: string;
  status: 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
  prompt: string;
}

export function VideoGenerator() {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const videoModels = getVideoModels();

  // Set default model
  if (!selectedModel && videoModels.length > 0) {
    setSelectedModel(videoModels[videoModels.length - 1].id);
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const pollStatus = useCallback((taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await authFetch(`/api/ai/video/status?taskId=${taskId}`);
        if (!response.ok) return;

        const data = await response.json();

        setVideos(prev =>
          prev.map(v =>
            v.taskId === taskId
              ? { ...v, status: data.status, videoUrl: data.videoUrl, error: data.error }
              : v
          )
        );

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
          pollingRef.current.delete(taskId);
        }
      } catch {
        // Keep polling on network errors
      }
    }, 5000);

    pollingRef.current.set(taskId, interval);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        // Convert to base64 data URL for the API
        imageUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(imageFile);
        });
      }

      const response = await authFetch('/api/ai/video/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: selectedModel,
          ...(imageUrl ? { image_url: imageUrl } : {}),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Generation failed: ${response.status}`);
      }

      const data = await response.json();
      const taskId = data.taskId;

      const newVideo: VideoResult = {
        taskId,
        status: 'processing',
        prompt: prompt.trim(),
      };

      setVideos(prev => [newVideo, ...prev]);
      pollStatus(taskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างวิดีโอ');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (videoUrl: string, index: number) => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rabbithub-video-${Date.now()}-${index}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(videoUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-900 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
            <Video className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">สร้างวิดีโอ AI</h1>
            <p className="text-xs text-neutral-400">Powered by BytePlus Seedance</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 space-y-6">
          {/* Prompt Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-neutral-300">
              คำอธิบายวิดีโอ
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="อธิบายวิดีโอที่ต้องการสร้าง..."
              rows={3}
              className={cn(
                'w-full px-4 py-3 rounded-xl resize-none',
                'bg-neutral-800 border border-neutral-700',
                'text-white placeholder-neutral-500',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500',
                'transition-all duration-200'
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleGenerate();
                }
              }}
            />
          </div>

          {/* Image Upload (optional for I2V) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-400">
              ภาพต้นฉบับ (ไม่บังคับ - สำหรับโหมด Image-to-Video)
            </label>
            {imagePreview ? (
              <div className="relative inline-block">
                <div className="relative h-32 w-32 rounded-xl overflow-hidden border border-neutral-700">
                  <Image
                    src={imagePreview}
                    alt="Upload preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-neutral-700',
                  'text-sm text-neutral-500 hover:text-neutral-300 hover:border-neutral-500',
                  'transition-colors'
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
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Options Row */}
          <div className="flex flex-wrap gap-3">
            {/* Model Selector */}
            <div className="flex-1 min-w-[200px]">
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
                    'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
                    'cursor-pointer'
                  )}
                >
                  {videoModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: isGenerating ? 1 : 1.02 }}
            whileTap={{ scale: isGenerating ? 1 : 0.98 }}
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all',
              'bg-gradient-to-r from-blue-500 to-cyan-600 text-white',
              'hover:from-blue-600 hover:to-cyan-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'shadow-lg shadow-blue-500/20'
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
                สร้างวิดีโอ
              </>
            )}
          </motion.button>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-red-900/20 border border-red-800/50 text-sm text-red-400"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Video Results */}
          {videos.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-neutral-300">
                วิดีโอที่สร้าง ({videos.length})
              </h2>
              <AnimatePresence mode="popLayout">
                {videos.map((video, index) => (
                  <motion.div
                    key={video.taskId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    layout
                    className="rounded-xl border border-neutral-700 bg-neutral-800/50 overflow-hidden"
                  >
                    {video.status === 'processing' && (
                      <div className="flex items-center gap-3 p-4">
                        <div className="relative">
                          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {video.prompt}
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            กำลังสร้างวิดีโอ... อาจใช้เวลาสักครู่
                          </p>
                          <div className="mt-2 h-1.5 rounded-full bg-neutral-700 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                              initial={{ width: '5%' }}
                              animate={{ width: '80%' }}
                              transition={{ duration: 60, ease: 'linear' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {video.status === 'completed' && video.videoUrl && (
                      <div>
                        <video
                          src={video.videoUrl}
                          controls
                          className="w-full rounded-t-xl"
                          playsInline
                        />
                        <div className="flex items-center justify-between p-3 border-t border-neutral-700">
                          <p className="text-xs text-neutral-400 truncate flex-1">
                            {video.prompt}
                          </p>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDownload(video.videoUrl!, index)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                            ดาวน์โหลด
                          </motion.button>
                        </div>
                      </div>
                    )}

                    {video.status === 'failed' && (
                      <div className="p-4">
                        <p className="text-sm text-red-400">
                          สร้างวิดีโอไม่สำเร็จ: {video.error || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1 truncate">
                          {video.prompt}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Empty State */}
          {videos.length === 0 && !isGenerating && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-2xl bg-neutral-800/50 mb-4">
                <Video className="h-10 w-10 text-neutral-600" />
              </div>
              <p className="text-neutral-500 text-sm">
                พิมพ์คำอธิบายวิดีโอแล้วกด "สร้างวิดีโอ" เพื่อเริ่มต้น
              </p>
              <p className="text-neutral-600 text-xs mt-1">
                สามารถอัปโหลดภาพเพื่อใช้โหมด Image-to-Video ได้
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
