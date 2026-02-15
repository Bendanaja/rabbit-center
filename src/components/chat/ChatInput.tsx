'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Mic, Video, ImagePlus, StopCircle, Sparkles, Command, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  isGenerating?: boolean;
  onStop?: () => void;
  webSearchEnabled?: boolean;
  onToggleWebSearch?: () => void;
}

const SLASH_COMMANDS = [
  { command: '/image', description: 'สร้างภาพจากข้อความ', icon: ImagePlus, color: 'text-violet-400' },
  { command: '/video', description: 'สร้างวิดีโอจากข้อความ', icon: Video, color: 'text-pink-400' },
];

export function ChatInput({ onSend, isGenerating = false, onStop, webSearchEnabled = false, onToggleWebSearch }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState(0);
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

  // Show command suggestions when typing /
  useEffect(() => {
    if (message === '/') {
      setShowCommands(true);
      setSelectedCommand(0);
    } else if (message.startsWith('/')) {
      const filtered = SLASH_COMMANDS.filter(c =>
        c.command.startsWith(message.split(' ')[0])
      );
      setShowCommands(filtered.length > 0 && !message.includes(' '));
    } else {
      setShowCommands(false);
    }
  }, [message]);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isGenerating) return;

    setMessage('');
    setShowCommands(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    onSend(trimmedMessage);
  };

  const handleCommandSelect = (command: string) => {
    setMessage(command + ' ');
    setShowCommands(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommands) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommand(prev => (prev + 1) % SLASH_COMMANDS.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommand(prev => (prev - 1 + SLASH_COMMANDS.length) % SLASH_COMMANDS.length);
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        handleCommandSelect(SLASH_COMMANDS[selectedCommand].command);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Detect command mode for visual hint
  const isImageCommand = message.startsWith('/image ');
  const isVideoCommand = message.startsWith('/video ');
  const commandMode = isImageCommand ? 'image' : isVideoCommand ? 'video' : null;

  const charCount = message.length;
  const maxChars = 4000;

  return (
    <div className="px-3 sm:px-4 py-3 sm:py-4">
      {/* Slash Command Suggestions */}
      <AnimatePresence>
        {showCommands && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mb-2 rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-neutral-800 flex items-center gap-2">
              <Command className="h-3.5 w-3.5 text-neutral-500" />
              <span className="text-xs text-neutral-500">คำสั่ง</span>
            </div>
            {SLASH_COMMANDS.map((cmd, i) => (
              <button
                key={cmd.command}
                onClick={() => handleCommandSelect(cmd.command)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                  i === selectedCommand
                    ? 'bg-neutral-800'
                    : 'hover:bg-neutral-800/50'
                )}
              >
                <div className={cn('p-1.5 rounded-lg bg-neutral-800', i === selectedCommand && 'bg-neutral-700')}>
                  <cmd.icon className={cn('h-4 w-4', cmd.color)} />
                </div>
                <div>
                  <span className="text-sm font-medium text-white">{cmd.command}</span>
                  <p className="text-xs text-neutral-500">{cmd.description}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Input Container */}
      <motion.div
        initial={false}
        animate={{
          boxShadow: isFocused
            ? commandMode === 'image'
              ? '0 0 0 2px rgba(139, 92, 246, 0.3), 0 4px 20px -4px rgba(139, 92, 246, 0.15)'
              : commandMode === 'video'
              ? '0 0 0 2px rgba(236, 72, 153, 0.3), 0 4px 20px -4px rgba(236, 72, 153, 0.15)'
              : '0 0 0 2px rgba(220, 38, 38, 0.1), 0 4px 20px -4px rgba(0, 0, 0, 0.1)'
            : '0 2px 12px -4px rgba(0, 0, 0, 0.08)',
        }}
        className={cn(
          'relative rounded-3xl transition-all duration-300',
          'bg-neutral-50 dark:bg-neutral-900',
          'border border-neutral-200 dark:border-neutral-800',
          isFocused && !commandMode && 'border-primary-300 dark:border-primary-700 bg-white dark:bg-neutral-800',
          commandMode === 'image' && 'border-violet-500/50 dark:border-violet-500/50 bg-white dark:bg-neutral-800',
          commandMode === 'video' && 'border-pink-500/50 dark:border-pink-500/50 bg-white dark:bg-neutral-800',
        )}
      >
        {/* Command Mode / Web Search Badge */}
        <AnimatePresence>
          {(commandMode || webSearchEnabled) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pt-2 flex gap-2"
            >
              {commandMode && (
                <div className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
                  commandMode === 'image' && 'bg-violet-500/20 text-violet-400',
                  commandMode === 'video' && 'bg-pink-500/20 text-pink-400',
                )}>
                  {commandMode === 'image' ? <ImagePlus className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                  {commandMode === 'image' ? 'โหมดสร้างภาพ' : 'โหมดสร้างวิดีโอ'}
                </div>
              )}
              {webSearchEnabled && !commandMode && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-sky-500/20 text-sky-400">
                  <Globe className="h-3.5 w-3.5" />
                  ค้นหาเว็บเปิดอยู่
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={
              commandMode === 'image'
                ? 'อธิบายภาพที่ต้องการสร้าง...'
                : commandMode === 'video'
                ? 'อธิบายวิดีโอที่ต้องการสร้าง...'
                : 'ส่งข้อความถึง RabbitHub... (พิมพ์ / เพื่อดูคำสั่ง)'
            }
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
        <div className="flex items-center justify-between px-2 sm:px-3 py-2">
          {/* Left Actions */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <ActionButton
              icon={ImagePlus}
              label="สร้างภาพ"
              onClick={() => {
                setMessage('/image ');
                textareaRef.current?.focus();
              }}
              active={commandMode === 'image'}
              activeColor="text-violet-400 bg-violet-500/10"
            />
            <ActionButton
              icon={Video}
              label="สร้างวิดีโอ"
              onClick={() => {
                setMessage('/video ');
                textareaRef.current?.focus();
              }}
              active={commandMode === 'video'}
              activeColor="text-pink-400 bg-pink-500/10"
            />
            <ActionButton
              icon={Globe}
              label="ค้นหาเว็บ"
              onClick={() => onToggleWebSearch?.()}
              active={webSearchEnabled}
              activeColor="text-sky-400 bg-sky-500/10"
            />
            <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1" />
            <ActionButton
              icon={Paperclip}
              label="แนบไฟล์"
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
                    ? commandMode === 'image'
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25'
                      : commandMode === 'video'
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-500/25'
                      : 'bg-gradient-to-r from-primary-600 to-rose-600 text-white shadow-lg shadow-primary-500/25'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
                )}
              >
                {commandMode ? (
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
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
  activeColor?: string;
}

function ActionButton({ icon: Icon, label, onClick, active, activeColor }: ActionButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'p-2 rounded-lg transition-colors',
        active && activeColor
          ? activeColor
          : active
          ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
          : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
      )}
      title={label}
    >
      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
    </motion.button>
  );
}
