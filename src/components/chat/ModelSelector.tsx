'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Lock, Ban } from 'lucide-react';
import Image from 'next/image';
import { getAvailableModels, getLockedModels, getImageModels, getVideoModels, getModelById } from '@/lib/byteplus';
import type { ModelType } from '@/lib/byteplus';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  variant?: 'default' | 'compact';
}

export function ModelSelector({ selectedModel, onModelChange, variant = 'default' }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 260 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [disabledModels, setDisabledModels] = useState<string[]>([]);

  // Fetch disabled models from admin settings
  useEffect(() => {
    fetch('/api/models/active')
      .then(r => r.json())
      .then(data => setDisabledModels(data.disabledModels || []))
      .catch(() => {});
  }, []);

  const allChatModels = getAvailableModels();
  const allImageModels = getImageModels();
  const allVideoModels = getVideoModels();
  const lockedModels = getLockedModels();

  // Filter out admin-disabled models
  const chatModels = allChatModels.filter(m => !disabledModels.includes(m.key));
  const imageModels = allImageModels.filter(m => !disabledModels.includes(m.key));
  const videoModels = allVideoModels.filter(m => !disabledModels.includes(m.key));
  const allAvailable = [...chatModels, ...imageModels, ...videoModels];

  const currentModel = getModelById(selectedModel) || chatModels[0];

  // Set mounted for portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate dropdown position with viewport boundary check
  const calculatePosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = 260;
    const dropdownHeight = 320;
    const padding = 16;

    let top = rect.bottom + 8;
    let left = rect.left;

    // Check right edge overflow
    if (left + dropdownWidth > window.innerWidth - padding) {
      left = window.innerWidth - dropdownWidth - padding;
    }

    // Check left edge overflow
    if (left < padding) {
      left = padding;
    }

    // Check bottom edge overflow - if needed, position above the button
    if (top + dropdownHeight > window.innerHeight - padding) {
      const topAbove = rect.top - dropdownHeight - 8;
      if (topAbove > padding) {
        top = topAbove;
      }
    }

    setDropdownPosition({
      top,
      left,
      width: dropdownWidth,
    });
  };

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen) {
      calculatePosition();
    }
  }, [isOpen]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => calculatePosition();

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const dropdownEl = document.getElementById('model-selector-dropdown');
        if (dropdownEl && dropdownEl.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelect = (modelId: string, isLocked: boolean) => {
    if (isLocked) return;
    onModelChange(modelId);
    setIsOpen(false);
  };

  // Dropdown content (will be rendered in portal)
  const dropdownContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />

          <motion.div
            id="model-selector-dropdown"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              maxWidth: 'calc(100vw - 32px)',
              zIndex: 9999,
            }}
            className={cn(
              'rounded-xl overflow-hidden',
              'bg-white dark:bg-neutral-900',
              'border border-neutral-200 dark:border-neutral-700',
              'shadow-xl shadow-black/20'
            )}
          >
            {/* Compact Header */}
            <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  เลือกโมเดล AI
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  ฟรี {allAvailable.length} โมเดล
                </span>
              </div>
            </div>

            {/* Models List - Compact */}
            <div className="max-h-[420px] overflow-y-auto overscroll-contain">
              {/* Chat Models */}
              {chatModels.length > 0 && (
                <ModelGroup
                  label="Chat / LLM"
                  labelColor="text-emerald-600 dark:text-emerald-400"
                  models={chatModels}
                  selectedModel={selectedModel}
                  onSelect={handleSelect}
                  startIndex={0}
                />
              )}

              {/* Image Models */}
              {imageModels.length > 0 && (
                <ModelGroup
                  label="Image Generation"
                  labelColor="text-violet-600 dark:text-violet-400"
                  badge={{ text: 'IMG', color: 'bg-violet-500' }}
                  models={imageModels}
                  selectedModel={selectedModel}
                  onSelect={handleSelect}
                  startIndex={chatModels.length}
                  showBorder
                />
              )}

              {/* Video Models */}
              {videoModels.length > 0 && (
                <ModelGroup
                  label="Video Generation"
                  labelColor="text-pink-600 dark:text-pink-400"
                  badge={{ text: 'VID', color: 'bg-pink-500' }}
                  models={videoModels}
                  selectedModel={selectedModel}
                  onSelect={handleSelect}
                  startIndex={chatModels.length + imageModels.length}
                  showBorder
                />
              )}

              {/* Locked Models Section */}
              {lockedModels.length > 0 && (
                <div className="py-1 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="px-3 py-1.5">
                    <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                      ต้องอัปเกรด Pro
                    </span>
                  </div>
                  {lockedModels.map((model, index) => (
                    <motion.button
                      key={model.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: (allAvailable.length + index) * 0.02 }}
                      onClick={() => handleSelect(model.id, true)}
                      disabled
                      className="w-full flex items-center gap-2.5 px-3 py-2 opacity-50 cursor-not-allowed"
                    >
                      {/* Icon - Logo (locked) */}
                      <div className="relative h-7 w-7 rounded-md overflow-hidden border shrink-0 border-neutral-200 dark:border-neutral-700">
                        <Image
                          src={`${model.icon}?v=3`}
                          alt={model.provider}
                          fill
                          className="object-cover grayscale"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Lock className="h-3 w-3 text-white" />
                        </div>
                      </div>

                      {/* Info - Compact */}
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium truncate text-neutral-500 dark:text-neutral-400">
                            {model.name}
                          </span>
                          <span className="shrink-0 px-1 py-0.5 text-[7px] font-bold rounded bg-amber-500 text-white leading-none">
                            PRO
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">
                          {model.provider}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Upgrade CTA */}
            <div className="px-3 py-2 bg-gradient-to-r from-primary-50 to-amber-50 dark:from-primary-950/30 dark:to-amber-950/30 border-t border-neutral-200 dark:border-neutral-700">
              <button className="w-full text-center text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                อัปเกรดเป็น Pro เพื่อปลดล็อคทุกโมเดล →
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={containerRef} className="relative">
      {variant === 'compact' ? (
        /* Compact Trigger - for header use */
        <motion.button
          ref={buttonRef}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200',
            'bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800',
            isOpen && 'bg-neutral-100 dark:bg-neutral-800'
          )}
        >
          <div className="relative h-6 w-6 rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-700">
            <Image
              src={`${currentModel?.icon || '/images/models/byteplus.svg'}?v=3`}
              alt={currentModel?.provider || 'AI'}
              fill
              className="object-cover"
            />
          </div>
          <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate max-w-[120px]">
            {currentModel?.name || 'Select Model'}
          </span>
          {currentModel?.modelType === 'image' && (
            <span className="px-1 py-0.5 rounded bg-violet-500 text-white text-[7px] font-bold leading-none">IMG</span>
          )}
          {currentModel?.modelType === 'video' && (
            <span className="px-1 py-0.5 rounded bg-pink-500 text-white text-[7px] font-bold leading-none">VID</span>
          )}
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
          </motion.div>
        </motion.button>
      ) : (
        /* Default Trigger - for welcome screen */
        <motion.button
          ref={buttonRef}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'relative flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200',
            'bg-white/90 dark:bg-neutral-800/90',
            'backdrop-blur-xl',
            'border border-neutral-200 dark:border-neutral-700',
            'shadow-md',
            'hover:shadow-lg',
            isOpen && 'ring-2 ring-primary-500/50'
          )}
        >
          {/* Model Icon */}
          <div className="relative">
            <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
              <Image
                src={`${currentModel?.icon || '/images/models/byteplus.svg'}?v=3`}
                alt={currentModel?.provider || 'AI'}
                fill
                className="object-cover"
              />
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-neutral-800" />
          </div>

          {/* Model Info */}
          <div className="text-left min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                {currentModel?.name || 'Select Model'}
              </span>
              {currentModel?.isFree && (
                <span className="px-1 py-0.5 rounded bg-emerald-500 text-white text-[8px] font-bold">
                  FREE
                </span>
              )}
              {currentModel?.modelType === 'image' && (
                <span className="px-1 py-0.5 rounded bg-violet-500 text-white text-[8px] font-bold">
                  IMG
                </span>
              )}
              {currentModel?.modelType === 'video' && (
                <span className="px-1 py-0.5 rounded bg-pink-500 text-white text-[8px] font-bold">
                  VID
                </span>
              )}
            </div>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
              {currentModel?.provider || 'BytePlus'}
            </span>
          </div>

          {/* Chevron */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          </motion.div>
        </motion.button>
      )}

      {/* Dropdown rendered in Portal */}
      {isMounted && createPortal(dropdownContent, document.body)}
    </div>
  );
}

// ─── ModelGroup sub-component ────────────────────────────

interface ModelGroupProps {
  label: string;
  labelColor: string;
  badge?: { text: string; color: string };
  models: Array<{ key: string; id: string; name: string; provider: string; icon: string; isFree: boolean; modelType: string }>;
  selectedModel: string;
  onSelect: (modelId: string, isLocked: boolean) => void;
  startIndex: number;
  showBorder?: boolean;
}

function ModelGroup({ label, labelColor, badge, models, selectedModel, onSelect, startIndex, showBorder }: ModelGroupProps) {
  return (
    <div className={cn('py-1', showBorder && 'border-t border-neutral-200 dark:border-neutral-700')}>
      <div className="px-3 py-1.5">
        <span className={cn('text-[10px] font-semibold uppercase tracking-wider', labelColor)}>
          {label}
        </span>
      </div>
      {models.map((model, index) => {
        const isSelected = model.id === selectedModel;

        return (
          <motion.button
            key={model.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: (startIndex + index) * 0.02 }}
            onClick={() => onSelect(model.id, false)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 transition-all duration-100',
              isSelected && 'bg-primary-50 dark:bg-primary-950/50',
              !isSelected && 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
            )}
          >
            <div className={cn(
              'relative h-7 w-7 rounded-md overflow-hidden border shrink-0',
              isSelected
                ? 'border-primary-500'
                : 'border-neutral-200 dark:border-neutral-700'
            )}>
              <Image
                src={`${model.icon}?v=3`}
                alt={model.provider}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  'text-xs font-medium truncate',
                  isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-neutral-900 dark:text-white'
                )}>
                  {model.name}
                </span>
                <span className="shrink-0 px-1 py-0.5 text-[7px] font-bold rounded bg-emerald-500 text-white leading-none">
                  FREE
                </span>
                {badge && (
                  <span className={cn('shrink-0 px-1 py-0.5 text-[7px] font-bold rounded text-white leading-none', badge.color)}>
                    {badge.text}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">
                {model.provider}
              </p>
            </div>

            {isSelected && (
              <div className="h-4 w-4 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                <Check className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
