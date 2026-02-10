'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ImagePlus, Download, Loader2, ChevronDown, Sparkles, X } from 'lucide-react';
import { getImageModels } from '@/lib/openrouter';
import { cn } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';

const IMAGE_SIZES = [
  { label: '1024 x 1024', value: '1024x1024' },
  { label: '1024 x 768', value: '1024x768' },
  { label: '768 x 1024', value: '768x1024' },
  { label: '512 x 512', value: '512x512' },
];

interface GeneratedImage {
  url?: string;
  b64_json?: string;
}

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const imageModels = getImageModels();

  // Set default model
  if (!selectedModel && imageModels.length > 0) {
    setSelectedModel(imageModels[imageModels.length - 1].id);
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await authFetch('/api/ai/image/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: selectedModel,
          size: selectedSize,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Generation failed: ${response.status}`);
      }

      const data = await response.json();
      setImages(prev => [...(data.images || []), ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างภาพ');
    } finally {
      setIsGenerating(false);
    }
  };

  const getImageSrc = (img: GeneratedImage) => {
    if (img.url) return img.url;
    if (img.b64_json) return `data:image/png;base64,${img.b64_json}`;
    return '';
  };

  const handleDownload = async (img: GeneratedImage, index: number) => {
    const src = getImageSrc(img);
    if (!src) return;

    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rabbithub-image-${Date.now()}-${index}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(src, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-900 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-violet-600">
            <ImagePlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">สร้างภาพ AI</h1>
            <p className="text-xs text-neutral-400">Powered by BytePlus Seedream</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 space-y-6">
          {/* Prompt Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-neutral-300">
              คำอธิบายภาพ
            </label>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="อธิบายภาพที่ต้องการสร้าง..."
              rows={3}
              className={cn(
                'w-full px-4 py-3 rounded-xl resize-none',
                'bg-neutral-800 border border-neutral-700',
                'text-white placeholder-neutral-500',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500',
                'transition-all duration-200'
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleGenerate();
                }
              }}
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
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
                    'cursor-pointer'
                  )}
                >
                  {imageModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            {/* Size Selector */}
            <div className="flex-1 min-w-[160px]">
              <label className="text-xs font-medium text-neutral-400 mb-1.5 block">
                ขนาด
              </label>
              <div className="relative">
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className={cn(
                    'w-full appearance-none px-3 py-2.5 pr-8 rounded-lg',
                    'bg-neutral-800 border border-neutral-700',
                    'text-sm text-white',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
                    'cursor-pointer'
                  )}
                >
                  {IMAGE_SIZES.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
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
              'bg-gradient-to-r from-pink-500 to-violet-600 text-white',
              'hover:from-pink-600 hover:to-violet-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'shadow-lg shadow-pink-500/20'
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                กำลังสร้างภาพ...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                สร้างภาพ
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

          {/* Generated Images Grid */}
          {images.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-neutral-300">
                ภาพที่สร้าง ({images.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {images.map((img, index) => {
                    const src = getImageSrc(img);
                    if (!src) return null;

                    return (
                      <motion.div
                        key={`${src.slice(0, 40)}-${index}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        layout
                        className="group relative rounded-xl overflow-hidden border border-neutral-700 bg-neutral-800"
                      >
                        <button
                          onClick={() => setPreviewImage(src)}
                          className="block w-full"
                        >
                          <div className="relative aspect-square">
                            <Image
                              src={src}
                              alt={`Generated image ${index + 1}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        </button>

                        {/* Overlay actions */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDownload(img, index)}
                            className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Empty State */}
          {images.length === 0 && !isGenerating && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-2xl bg-neutral-800/50 mb-4">
                <ImagePlus className="h-10 w-10 text-neutral-600" />
              </div>
              <p className="text-neutral-500 text-sm">
                พิมพ์คำอธิบายภาพแล้วกด "สร้างภาพ" เพื่อเริ่มต้น
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={() => setPreviewImage(null)}
            >
              <X className="h-5 w-5" />
            </motion.button>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={previewImage}
                alt="Preview"
                width={1024}
                height={1024}
                className="rounded-xl object-contain max-h-[90vh]"
                unoptimized
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
