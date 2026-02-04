'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, Clock, Hash } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { getModelById } from '@/lib/openrouter';
import { type Message } from '@/store/chatStore';
import { cn, formatMessageTime } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isLast?: boolean;
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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30"
                >
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-primary-500"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  />
                  <span className="text-[10px] font-medium text-primary-600 dark:text-primary-400">
                    กำลังพิมพ์...
                  </span>
                </motion.div>
              )}
            </div>

            {/* Message Text with Streaming Effect */}
            <div className="prose prose-sm sm:prose-base prose-neutral dark:prose-invert max-w-none">
              <div className="relative">
                <p className="text-sm sm:text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap m-0">
                  {displayContent}
                  {/* Typing cursor */}
                  {message.isStreaming && (
                    <motion.span
                      className="inline-block w-0.5 h-4 bg-primary-500 ml-0.5 align-middle"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                  )}
                </p>
              </div>
            </div>

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
