'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, Clock, Hash, Download, ImagePlus, Video, Pencil, X, Globe, Loader2, AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
const VideoPlayer = dynamic(() => import('@/components/ui/VideoPlayer').then(mod => ({ default: mod.VideoPlayer })), { ssr: false });
import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { getModelById } from '@/lib/byteplus';
import { type Message } from '@/store/chatStore';
import { cn, formatMessageTime } from '@/lib/utils';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ModelInfo {
  name: string;
  icon: string;
  provider: string;
}

interface MessageBubbleProps {
  message: Message;
  isLast?: boolean;
  modelInfo?: ModelInfo | null;
  onEdit?: (messageId: string, newContent: string) => void;
  onRegenerate?: (messageId: string) => void;
}

// Parse content for generated media markers
interface WebSource {
  title: string;
  url: string;
  description: string;
}

interface ParsedContent {
  type: 'text' | 'image' | 'video' | 'web_sources';
  content: string;
  urls?: string[];
  sources?: WebSource[];
}

function parseWebSources(raw: string): WebSource[] {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const sources: WebSource[] = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.title && parsed.url) {
        sources.push({ title: parsed.title, url: parsed.url, description: parsed.description || '' });
      }
    } catch {
      // Skip invalid JSON lines
    }
  }
  return sources;
}

function parseMessageContent(content: string): ParsedContent[] {
  const parts: ParsedContent[] = [];

  const imageRegex = /\[GENERATED_IMAGE\]\n?([\s\S]*?)\n?\[\/GENERATED_IMAGE\]/g;
  const videoRegex = /\[GENERATED_VIDEO\]\n?([\s\S]*?)\n?\[\/GENERATED_VIDEO\]/g;
  const webSourcesRegex = /\[WEB_SOURCES\]\n?([\s\S]*?)\n?\[\/WEB_SOURCES\]/g;

  const matches: { index: number; length: number; type: 'image' | 'video' | 'web_sources'; urls: string[]; sources?: WebSource[] }[] = [];

  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    const urls = match[1].split('\n').map(u => u.trim()).filter(Boolean);
    matches.push({ index: match.index, length: match[0].length, type: 'image', urls });
  }
  while ((match = videoRegex.exec(content)) !== null) {
    const urls = match[1].split('\n').map(u => u.trim()).filter(Boolean);
    matches.push({ index: match.index, length: match[0].length, type: 'video', urls });
  }
  while ((match = webSourcesRegex.exec(content)) !== null) {
    const sources = parseWebSources(match[1]);
    if (sources.length > 0) {
      matches.push({ index: match.index, length: match[0].length, type: 'web_sources', urls: [], sources });
    }
  }

  matches.sort((a, b) => a.index - b.index);

  if (matches.length === 0) {
    return [{ type: 'text', content }];
  }

  let lastIndex = 0;
  for (const m of matches) {
    if (m.index > lastIndex) {
      const text = content.slice(lastIndex, m.index).trim();
      if (text) parts.push({ type: 'text', content: text });
    }
    if (m.type === 'web_sources') {
      parts.push({ type: 'web_sources', content: '', sources: m.sources });
    } else {
      parts.push({ type: m.type, content: m.urls.join('\n'), urls: m.urls });
    }
    lastIndex = m.index + m.length;
  }

  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim();
    if (text) parts.push({ type: 'text', content: text });
  }

  return parts;
}

export function MessageBubble({ message, isLast = false, modelInfo, onEdit, onRegenerate }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isUser = message.role === 'user';

  // Auto-focus and auto-resize textarea when editing starts
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      editTextareaRef.current.style.height = 'auto';
      editTextareaRef.current.style.height = editTextareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditContent(message.content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleSaveEdit = () => {
    const trimmed = editContent.trim();
    if (trimmed && trimmed !== message.content && onEdit) {
      onEdit(message.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Find model definition: props modelInfo (from DB) → MODELS registry → derive from ID
  const model = message.modelId
    ? ((() => {
        // Prefer admin-configured info from DB (passed via modelInfo prop)
        if (modelInfo) {
          const base = getModelById(message.modelId);
          return {
            id: message.modelId,
            name: modelInfo.name,
            provider: modelInfo.provider,
            icon: modelInfo.icon,
            isFree: base?.isFree ?? false,
            isLocked: base?.isLocked ?? false,
            modelType: base?.modelType ?? ('chat' as const),
            apiProvider: base?.apiProvider ?? ('byteplus' as const),
          };
        }
        return null;
      })() || getModelById(message.modelId) || (() => {
        const mid = message.modelId!;
        const hasSlash = mid.includes('/');
        return {
          id: mid,
          name: hasSlash
            ? (mid.split('/').pop()?.replace(/:.*$/, '') || mid)
            : mid,
          provider: hasSlash
            ? ((mid.split('/')[0] || 'AI').charAt(0).toUpperCase() + (mid.split('/')[0] || '').slice(1))
            : 'AI',
          icon: hasSlash
            ? `/images/models/${mid.split('/')[0]?.toLowerCase() || 'byteplus'}.svg`
            : '/images/models/byteplus.svg',
          isFree: false,
          isLocked: false,
          modelType: 'chat' as const,
          apiProvider: hasSlash ? 'openrouter' as const : 'byteplus' as const,
        };
      })())
    : null;

  // Use streamed content if available and streaming, otherwise use full content
  const displayContent = message.isStreaming
    ? (message.streamedContent || '')
    : message.content;

  // Parse content for media markers
  const parsedContent = useMemo(() => parseMessageContent(displayContent), [displayContent]);
  const hasMedia = parsedContent.some(p => p.type === 'image' || p.type === 'video' || p.type === 'web_sources');

  // Video generation status from metadata (for persistent video polling)
  const videoMeta = message.metadata as Record<string, unknown> | null;
  const videoStatus = videoMeta?.videoStatus as string | undefined;

  // Calculate current word count during streaming
  const currentWordCount = useMemo(() => {
    return displayContent.split(/\s+/).filter(Boolean).length;
  }, [displayContent]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('คัดลอกแล้ว');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group py-3 sm:py-4',
        isUser ? 'flex justify-end' : ''
      )}
    >
      {isUser ? (
        // User Message - Right aligned, polished bubble
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-[85%] sm:max-w-[70%]"
        >
          {isEditing ? (
            // Inline edit mode
            <div className="space-y-2">
              <textarea
                ref={editTextareaRef}
                value={editContent}
                onChange={(e) => {
                  setEditContent(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onKeyDown={handleEditKeyDown}
                className="w-full px-4 py-3 rounded-2xl border-2 border-primary-400 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm sm:text-[15px] leading-relaxed resize-none focus:outline-none focus:border-primary-500"
                rows={1}
              />
              <div className="flex justify-end gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  ยกเลิก
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim() || editContent.trim() === message.content}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  บันทึกและส่ง
                </motion.button>
              </div>
            </div>
          ) : (
            // Normal display mode
            <div className="space-y-2">
              {/* Attached images */}
              {(() => {
                const attachments = (message.metadata?.attachments as { url: string; contentType?: string; fileName?: string }[] | undefined);
                if (!attachments || attachments.length === 0) return null;
                // Only render safe URLs (https or data:image)
                const safeAttachments = attachments.filter(att =>
                  att.url.startsWith('https://') || att.url.startsWith('data:image/')
                );
                if (safeAttachments.length === 0) return null;
                return (
                  <div className={cn('grid gap-1.5', safeAttachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
                    {safeAttachments.map((att, i) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={i}
                        src={att.url}
                        alt={att.fileName || `Attachment ${i + 1}`}
                        className="rounded-xl max-h-[200px] w-auto object-cover border border-neutral-200 dark:border-neutral-700"
                        loading="lazy"
                      />
                    ))}
                  </div>
                );
              })()}
              <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-rose-700 text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl rounded-br-sm shadow-lg shadow-primary-600/30 ring-1 ring-white/10">
                <div className="absolute inset-0 rounded-2xl rounded-br-sm bg-gradient-to-t from-black/5 to-white/5 pointer-events-none" />
                <p className="relative text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap">
                  {message.content === '(แนบรูปภาพ)' ? '' : message.content}
                </p>
              </div>
            </div>
          )}
          {/* Timestamp + Edit button row */}
          <div className="flex items-center justify-end gap-1.5 mt-2 pr-1">
            {!isEditing && onEdit && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleStartEdit}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 backdrop-blur-sm"
                title="แก้ไข"
              >
                <Pencil className="h-3 w-3" />
              </motion.button>
            )}
            <p className="text-[10px] sm:text-xs text-neutral-400">
              {formatMessageTime(message.timestamp)}
            </p>
          </div>
        </motion.div>
      ) : (
        // AI Message - Full width with avatar and card
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-3 sm:gap-3.5 max-w-[95%] sm:max-w-[85%]"
        >
          {/* AI Avatar */}
          <div className="shrink-0 mt-0.5">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-xl overflow-hidden shadow-md ring-1 ring-neutral-200 dark:ring-neutral-700"
            >
              {model?.icon ? (
                <Image src={model.icon} alt={model.name} fill className="object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">AI</span>
                </div>
              )}
            </motion.div>
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0 bg-neutral-50 dark:bg-neutral-900/80 rounded-2xl rounded-tl-sm px-4 sm:px-5 py-3 sm:py-4 border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
            {/* Model Name & Time */}
            <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
              <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white">
                {model?.name || 'AI'}
              </span>
              <span className="text-[10px] sm:text-xs text-neutral-400">
                {formatMessageTime(message.timestamp)}
              </span>

              {/* Streaming indicator */}
              {message.isStreaming && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-[navDotPulse_1s_ease-in-out_infinite]"
                    style={{ willChange: 'transform' }}
                  />
                  <span className="text-[10px] font-medium text-primary-600 dark:text-primary-400">
                    กำลังพิมพ์...
                  </span>
                </div>
              )}
            </div>

            {/* Message Content - Text, Media, or Video Status */}
            {videoStatus === 'pending' ? (
              <VideoGeneratingBlock model={videoMeta?.videoModel as string} />
            ) : videoStatus === 'failed' ? (
              <VideoFailedBlock error={videoMeta?.videoError as string | undefined} />
            ) : hasMedia ? (
              // Render parsed content with media
              <div className="space-y-3">
                {parsedContent.map((part, idx) => {
                  if (part.type === 'image' && part.urls) {
                    return (
                      <GeneratedImageBlock key={`img-${idx}`} urls={part.urls} />
                    );
                  }
                  if (part.type === 'video' && part.urls) {
                    return (
                      <GeneratedVideoBlock key={`vid-${idx}`} url={part.urls[0]} />
                    );
                  }
                  if (part.type === 'web_sources' && part.sources) {
                    return (
                      <WebSourcesBlock key={`src-${idx}`} sources={part.sources} />
                    );
                  }
                  // Text part - render as markdown
                  return (
                    <MarkdownRenderer key={`txt-${idx}`} content={part.content} />
                  );
                })}
              </div>
            ) : (
              // Regular text message - render as markdown
              <div className="relative">
                <MarkdownRenderer content={displayContent} />
                {/* Typing cursor */}
                {message.isStreaming && (
                  <span
                    className="inline-block w-0.5 h-4 bg-primary-500 ml-0.5 align-middle animate-[cursorBlink_1s_step-end_infinite]"
                  />
                )}
              </div>
            )}

            {/* Stats Bar - Shows after streaming completes */}
            <AnimatePresence>
              {!message.isStreaming && (message.responseTime || message.wordCount) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3 mt-2 text-[10px] sm:text-xs text-neutral-400"
                >
                  {message.responseTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>ตอบใน {message.responseTime.toFixed(1)} วินาที</span>
                    </div>
                  )}
                  {message.wordCount && (
                    <div className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      <span>{message.wordCount} คำ</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Word count during streaming */}
            <AnimatePresence>
              {message.isStreaming && currentWordCount > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1 mt-2 text-[10px] sm:text-xs text-neutral-400"
                >
                  <Hash className="h-3 w-3" />
                  <motion.span
                    key={currentWordCount}
                    initial={{ y: -5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="tabular-nums"
                  >
                    {currentWordCount} คำ
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons - Only show when not streaming */}
            <AnimatePresence>
              {!message.isStreaming && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={cn(
                    'flex items-center gap-1 mt-2 sm:mt-3 transition-opacity duration-200',
                    'opacity-0 group-hover:opacity-100',
                    isLast && 'opacity-100'
                  )}
                >
                  <ActionButton
                    icon={copied ? Check : Copy}
                    label={copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                    onClick={handleCopy}
                    active={copied}
                  />
                  <ActionButton
                    icon={ThumbsUp}
                    label="ดี"
                    onClick={() => setFeedback('up')}
                    active={feedback === 'up'}
                  />
                  <ActionButton
                    icon={ThumbsDown}
                    label="ไม่ดี"
                    onClick={() => setFeedback('down')}
                    active={feedback === 'down'}
                  />
                  {onRegenerate && (
                    <ActionButton
                      icon={RotateCcw}
                      label="สร้างใหม่"
                      onClick={() => onRegenerate(message.id)}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Generated Image Block Component
function GeneratedImageBlock({ urls }: { urls: string[] }) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const handleDownload = (e: React.MouseEvent, url: string, index: number) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = `rabbithub-image-${Date.now()}-${index}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-2"
      >
        {/* Header badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/15 text-violet-400">
          <ImagePlus className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">ภาพที่สร้างโดย AI</span>
        </div>

        {/* Image grid */}
        <div className={cn(
          'grid gap-2',
          urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
        )}>
          {urls.map((url, i) => (
            <div
              key={i}
              onClick={() => setLightboxUrl(url)}
              className="relative group/img rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-lg cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Generated image ${i + 1}`}
                className="w-full h-auto max-h-[400px] object-contain bg-neutral-100 dark:bg-neutral-800"
                loading="lazy"
              />
              {/* Overlay with download button */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-200">
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleDownload(e, url, i)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 text-neutral-800 text-xs font-medium shadow-lg backdrop-blur-sm hover:bg-white transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    ดาวน์โหลด
                  </motion.button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-pointer"
            onClick={() => setLightboxUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxUrl}
                alt="Full size"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
              {/* Close & Download buttons */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => handleDownload(e, lightboxUrl, 0)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 text-neutral-800 text-xs font-medium shadow-lg backdrop-blur-sm hover:bg-white transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  ดาวน์โหลด
                </motion.button>
                <button
                  onClick={() => setLightboxUrl(null)}
                  className="p-2 rounded-lg bg-white/90 text-neutral-800 shadow-lg backdrop-blur-sm hover:bg-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Generated Video Block Component
function GeneratedVideoBlock({ url }: { url: string }) {
  const [showFullscreen, setShowFullscreen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-2"
      >
        {/* Header badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/15 text-pink-400">
          <Video className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">วิดีโอที่สร้างโดย AI</span>
        </div>

        {/* Custom Video Player with expand button */}
        <div className="relative group/vid rounded-xl overflow-hidden">
          <VideoPlayer src={url} compact />
          <button
            onClick={() => setShowFullscreen(true)}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/80 hover:text-white hover:bg-black/80 opacity-0 group-hover/vid:opacity-100 transition-opacity backdrop-blur-sm"
            title="ขยาย"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </button>
        </div>
      </motion.div>

      {/* Fullscreen Video Lightbox */}
      <AnimatePresence>
        {showFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowFullscreen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <VideoPlayer src={url} />
              <button
                onClick={() => setShowFullscreen(false)}
                className="absolute top-3 right-3 p-2 rounded-lg bg-white/90 text-neutral-800 shadow-lg backdrop-blur-sm hover:bg-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Video Generating Block - Shows while video is being created
function VideoGeneratingBlock({ model }: { model?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-3"
    >
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/15 text-pink-400">
        <Video className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">กำลังสร้างวิดีโอ</span>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-6 flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 text-pink-500 animate-spin" />
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            กำลังสร้างวิดีโอ...
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {model ? `โมเดล: ${model}` : 'อาจใช้เวลาสักครู่'}
          </p>
        </div>
        {/* Animated progress bar */}
        <div className="w-full max-w-xs h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ width: '40%' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// Video Failed Block - Shows when video generation failed
function VideoFailedBlock({ error }: { error?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-2"
    >
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400">
        <Video className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">สร้างวิดีโอไม่สำเร็จ</span>
      </div>

      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            ไม่สามารถสร้างวิดีโอได้
          </p>
          {error && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
              {error}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Web Sources Block Component - ChatGPT-style compact pills with favicons
function WebSourcesBlock({ sources }: { sources: WebSource[] }) {
  const [expanded, setExpanded] = useState(false);

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-3"
    >
      {/* Compact header pill */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors mb-2 group/toggle"
      >
        {/* Stacked favicons */}
        <div className="flex -space-x-1.5">
          {sources.slice(0, 3).map((source, i) => {
            const favicon = getFaviconUrl(source.url);
            return favicon ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={i}
                src={favicon}
                alt=""
                className="w-4 h-4 rounded-full border border-white dark:border-neutral-800 bg-white"
              />
            ) : (
              <div key={i} className="w-4 h-4 rounded-full border border-white dark:border-neutral-800 bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center">
                <Globe className="h-2.5 w-2.5 text-neutral-500" />
              </div>
            );
          })}
        </div>
        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
          แหล่งข้อมูล {sources.length} รายการ
        </span>
        <motion.svg
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-3 h-3 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      {/* Expandable source pills */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 pb-1">
              {sources.map((source, i) => {
                const favicon = getFaviconUrl(source.url);
                const domain = getDomain(source.url);
                return (
                  <a
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all group/pill max-w-xs"
                  >
                    {favicon ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={favicon} alt="" className="w-4 h-4 rounded-sm shrink-0" />
                    ) : (
                      <Globe className="h-4 w-4 text-neutral-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-neutral-700 dark:text-neutral-200 truncate group-hover/pill:text-primary-600 dark:group-hover/pill:text-primary-400 transition-colors">
                        {source.title}
                      </p>
                      <p className="text-[10px] text-neutral-400 truncate">
                        {domain}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  active?: boolean;
}

function ActionButton({ icon: Icon, label, onClick, active }: ActionButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200',
        active
          ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 shadow-sm'
          : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80'
      )}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
}
