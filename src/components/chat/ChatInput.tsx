'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Mic, Image as ImageIcon, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  isGenerating?: boolean;
  onStop?: () => void;
}

export function ChatInput({ onSend, isGenerating = false, onStop }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [message]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isGenerating) return;

    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    onSend(trimmedMessage);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const charCount = message.length;
  const maxChars = 4000;

  return (
    <div className="px-3 sm:px-4 py-3 sm:py-4">
      {/* Floating Input Container */}
      <motion.div
        initial={false}
        animate={{
          boxShadow: isFocused
            ? '0 0 0 2px rgba(220, 38, 38, 0.1), 0 4px 20px -4px rgba(0, 0, 0, 0.1)'
            : '0 2px 12px -4px rgba(0, 0, 0, 0.08)',
        }}
        className={cn(
          'relative rounded-2xl transition-all duration-300',
          'bg-neutral-50 dark:bg-neutral-900',
          'border border-neutral-200 dark:border-neutral-800',
          isFocused && 'border-primary-300 dark:border-primary-700 bg-white dark:bg-neutral-800'
        )}
      >
        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="ส่งข้อความถึง RabbitHub..."
            disabled={isGenerating}
            rows={1}
            className={cn(
              'w-full px-4 sm:px-5 py-3 sm:py-4 pr-24 sm:pr-32 resize-none',
              'bg-transparent',
              'text-sm sm:text-[15px] text-neutral-900 dark:text-white',
              'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
              'focus:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'min-h-[52px] max-h-[200px]'
            )}
          />
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between px-2 sm:px-3 py-2 border-t border-neutral-100 dark:border-neutral-800/50">
          {/* Left Actions */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <ActionButton
              icon={Paperclip}
              label="แนบไฟล์"
              onClick={() => {}}
            />
            <ActionButton
              icon={ImageIcon}
              label="รูปภาพ"
              onClick={() => {}}
            />
            <ActionButton
              icon={Mic}
              label="เสียง"
              onClick={() => {}}
            />
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Character Counter */}
            <AnimatePresence>
              {message.length > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={cn(
                    'text-[10px] sm:text-xs tabular-nums transition-colors',
                    charCount > maxChars * 0.9
                      ? 'text-amber-500'
                      : 'text-neutral-400'
                  )}
                >
                  {charCount.toLocaleString()}/{maxChars.toLocaleString()}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Send/Stop Button */}
            {isGenerating ? (
              <motion.button
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStop}
                className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
              >
                <StopCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!message.trim()}
                className={cn(
                  'flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl transition-all duration-200',
                  message.trim()
                    ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/25'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
                )}
              >
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Disclaimer */}
      <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-neutral-400 dark:text-neutral-500 text-center">
        RabbitHub อาจให้ข้อมูลที่ไม่ถูกต้อง กรุณาตรวจสอบข้อมูลสำคัญ
      </p>
    </div>
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
        'p-2 rounded-lg transition-colors',
        active
          ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
          : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
      )}
      title={label}
    >
      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
    </motion.button>
  );
}
