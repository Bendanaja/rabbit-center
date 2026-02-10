'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, Clock, Hash, Download, ImagePlus, Video } from 'lucide-react';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { getModelById } from '@/lib/openrouter';
import { type Message } from '@/store/chatStore';
import { cn, formatMessageTime } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isLast?: boolean;
}

// Parse content for generated media markers
interface ParsedContent {
  type: 'text' | 'image' | 'video';
  content: string; // text content or URL(s)
  urls?: string[];
}

function parseMessageContent(content: string): ParsedContent[] {
  const parts: ParsedContent[] = [];

  // Match [GENERATED_IMAGE]...[/GENERATED_IMAGE]
  const imageRegex = /\[GENERATED_IMAGE\]\n?([\s\S]*?)\n?\[\/GENERATED_IMAGE\]/g;
  const videoRegex = /\[GENERATED_VIDEO\]\n?([\s\S]*?)\n?\[\/GENERATED_VIDEO\]/g;

  // Find all matches with positions
  const matches: { index: number; length: number; type: 'image' | 'video'; urls: string[] }[] = [];

  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    const urls = match[1].split('\n').map(u => u.trim()).filter(Boolean);
    matches.push({ index: match.index, length: match[0].length, type: 'image', urls });
  }
  while ((match = videoRegex.exec(content)) !== null) {
    const urls = match[1].split('\n').map(u => u.trim()).filter(Boolean);
    matches.push({ index: match.index, length: match[0].length, type: 'video', urls });
  }

  // Sort by position
  matches.sort((a, b) => a.index - b.index);

  if (matches.length === 0) {
    return [{ type: 'text', content }];
  }

  let lastIndex = 0;
  for (const m of matches) {
    // Text before this match
    if (m.index > lastIndex) {
      const text = content.slice(lastIndex, m.index).trim();
      if (text) parts.push({ type: 'text', content: text });
    }
    parts.push({ type: m.type, content: m.urls.join('\n'), urls: m.urls });
    lastIndex = m.index + m.length;
  }

  // Remaining text after last match
  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim();
    if (text) parts.push({ type: 'text', content: text });
  }

  return parts;
}

export function MessageBubble({ message, isLast = false }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const isUser = message.role === 'user';

  // Use getModelById from openrouter to find model by OpenRouter ID
  const model = message.modelId
    ? getModelById(message.modelId)
    : null;

  // Use streamed content if available and streaming, otherwise use full content
  const displayContent = message.isStreaming
    ? (message.streamedContent || '')
    : message.content;

  // Parse content for media markers
  const parsedContent = useMemo(() => parseMessageContent(displayContent), [displayContent]);
  const hasMedia = parsedContent.some(p => p.type === 'image' || p.type === 'video');

  // Calculate current word count during streaming
  const currentWordCount = useMemo(() => {
    return displayContent.split(/\s+/).filter(Boolean).length;
  }, [displayContent]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group py-4 sm:py-6',
        isUser ? 'flex justify-end' : ''
      )}
    >
      {isUser ? (
        // User Message - Right aligned, clean bubble
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-[85%] sm:max-w-[75%]"
        >
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl rounded-br-md shadow-lg shadow-primary-500/20">
            <p className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
          <p className="text-[10px] sm:text-xs text-neutral-400 mt-1.5 text-right pr-1">
            {formatMessageTime(message.timestamp)}
          </p>
        </motion.div>
      ) : (
        // AI Message - Full width with avatar
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-3 sm:gap-4"
        >
          {/* AI Avatar */}
          <div className="shrink-0">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-lg overflow-hidden shadow-md"
            >
              {model?.icon ? (
                <Image src={model.icon} alt={model.name} fill className="object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <span className="text-white text-xs sm:text-sm">AI</span>
                </div>
              )}
            </motion.div>
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            {/* Model Name & Time */}
            <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
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

            {/* Message Content - Text and/or Media */}
            {hasMedia ? (
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
                  // Text part
                  return (
                    <p key={`txt-${idx}`} className="text-sm sm:text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap m-0">
                      {part.content}
                    </p>
                  );
                })}
              </div>
            ) : (
              // Regular text message
              <div className="prose prose-sm sm:prose-base prose-neutral dark:prose-invert max-w-none">
                <div className="relative">
                  <p className="text-sm sm:text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap m-0">
                    {displayContent}
                    {/* Typing cursor */}
                    {message.isStreaming && (
                      <span
                        className="inline-block w-0.5 h-4 bg-primary-500 ml-0.5 align-middle animate-[cursorBlink_1s_step-end_infinite]"
                      />
                    )}
                  </p>
                </div>
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
                  <ActionButton
                    icon={RotateCcw}
                    label="สร้างใหม่"
                    onClick={() => {}}
                  />
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
  const handleDownload = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `rabbithub-image-${Date.now()}-${index}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
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
            className="relative group/img rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-lg"
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
              <div className="absolute bottom-3 right-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDownload(url, i)}
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
  );
}

// Generated Video Block Component
function GeneratedVideoBlock({ url }: { url: string }) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `rabbithub-video-${Date.now()}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
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

      {/* Video player */}
      <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-lg bg-neutral-900">
        <video
          src={url}
          controls
          playsInline
          className="w-full max-h-[400px] rounded-xl"
          preload="metadata"
        />
        {/* Download button */}
        <div className="flex justify-end px-3 py-2 bg-neutral-800/50">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/20 text-pink-400 text-xs font-medium hover:bg-pink-500/30 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            ดาวน์โหลดวิดีโอ
          </motion.button>
        </div>
      </div>
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
        'flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors',
        active
          ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
          : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
      )}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
}
