'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Lock } from 'lucide-react';
import Image from 'next/image';
import { getModelById, getModelKey } from '@/lib/byteplus';
import { cn } from '@/lib/utils';

interface DbModel {
  key: string;
  id: string;
  name: string;
  provider: string;
  icon: string;
  tier: string;
  isFree: boolean;
  modelType: 'chat' | 'image' | 'video';
  apiProvider: string;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  onModelDisplayChange?: (info: { name: string; icon: string; provider: string } | null) => void;
  variant?: 'default' | 'compact';
}

export function ModelSelector({ selectedModel, onModelChange, onModelDisplayChange, variant = 'default' }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 260 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [dbModels, setDbModels] = useState<DbModel[]>([]);
  const [modelTiers, setModelTiers] = useState<Record<string, string>>({});
  const [userPlan, setUserPlan] = useState<string>('free');
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Fetch active models from DB (single source of truth)
  useEffect(() => {
    fetch('/api/models/active')
      .then(r => r.json())
      .then(data => {
        setDbModels(data.models || []);
        setModelTiers(data.modelTiers || {});
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Fetch user's current plan
  useEffect(() => {
    const sim = typeof window !== 'undefined' ? sessionStorage.getItem('simulate_plan') : null;
    const url = sim ? `/api/user/usage?simulate=${sim}` : '/api/user/usage';
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.plan) setUserPlan(data.plan);
        if (data.budget?.unlimited) setIsUnlimited(true);
        else setIsUnlimited(false);
      })
      .catch(() => {});
  }, []);

  const isFreeUser = userPlan === 'free' && !isUnlimited;

  // Split models by type (all from DB — active only)
  const chatModels = dbModels.filter(m => m.modelType === 'chat');
  const imageModels = dbModels.filter(m => m.modelType === 'image');
  const videoModels = dbModels.filter(m => m.modelType === 'video');

  // Helper: check if a model is paid
  const isModelPaid = (modelKey: string) => {
    const tier = modelTiers[modelKey];
    return tier && tier !== 'free';
  };

  // For free users: split into free and paid (locked) models
  const freeChatModels = isFreeUser ? chatModels.filter(m => !isModelPaid(m.key)) : chatModels;
  const paidChatModels = isFreeUser ? chatModels.filter(m => isModelPaid(m.key)) : [];
  const freeImageModels = isFreeUser ? imageModels.filter(m => !isModelPaid(m.key)) : imageModels;
  const paidImageModels = isFreeUser ? imageModels.filter(m => isModelPaid(m.key)) : [];
  const freeVideoModels = isFreeUser ? videoModels.filter(m => !isModelPaid(m.key)) : videoModels;
  const paidVideoModels = isFreeUser ? videoModels.filter(m => isModelPaid(m.key)) : [];
  const allLockedModels = [...paidChatModels, ...paidImageModels, ...paidVideoModels];

  const allAvailable = [...freeChatModels, ...freeImageModels, ...freeVideoModels];

  // Find current model from DB list, fallback to byteplus registry, then first available
  const currentDbModel = dbModels.find(m => m.id === selectedModel || m.key === selectedModel);
  const currentModel = currentDbModel
    ? { ...currentDbModel, isLocked: false }
    : getModelById(selectedModel) || (chatModels[0] ? { ...chatModels[0], isLocked: false } : null);

  // Report current model display info to parent
  useEffect(() => {
    if (!onModelDisplayChange) return;
    if (currentDbModel) {
      onModelDisplayChange({ name: currentDbModel.name, icon: currentDbModel.icon, provider: currentDbModel.provider });
    } else {
      onModelDisplayChange(null);
    }
  }, [currentDbModel?.key, currentDbModel?.name, selectedModel]);

  // Auto-fallback: if selected model is not in active list, switch to first available
  useEffect(() => {
    if (!loaded || dbModels.length === 0) return;

    const selectedKey = getModelKey(selectedModel) || selectedModel;
    const isInActiveList = dbModels.some(m => m.id === selectedModel || m.key === selectedKey);
    const isPaidAndFreeUser = isFreeUser && isModelPaid(selectedKey);

    if (!isInActiveList || isPaidAndFreeUser) {
      const firstAvailable = freeChatModels[0] || freeImageModels[0] || freeVideoModels[0];
      if (firstAvailable && firstAvailable.id !== selectedModel) {
        onModelChange(firstAvailable.id);
      }
    }
  }, [loaded, dbModels, userPlan, selectedModel]);

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

    if (left + dropdownWidth > window.innerWidth - padding) {
      left = window.innerWidth - dropdownWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }
    if (top + dropdownHeight > window.innerHeight - padding) {
      const topAbove = rect.top - dropdownHeight - 8;
      if (topAbove > padding) {
        top = topAbove;
      }
    }

    setDropdownPosition({ top, left, width: dropdownWidth });
  };

  useEffect(() => {
    if (isOpen) calculatePosition();
  }, [isOpen]);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const dropdownEl = document.getElementById('model-selector-dropdown');
        if (dropdownEl && dropdownEl.contains(event.target as Node)) return;
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelect = (modelId: string, isLocked: boolean) => {
    if (isLocked) return;
    onModelChange(modelId);
    setIsOpen(false);
  };

  // Dropdown content (rendered in portal)
  const dropdownContent = (
    <AnimatePresence>
      {isOpen && (
        <>
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
            {/* Header */}
            <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  เลือกโมเดล AI
                </span>
                {isFreeUser ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    ฟรี {allAvailable.length} โมเดล
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    {allAvailable.length} โมเดล
                  </span>
                )}
              </div>
            </div>

            {/* Models List */}
            <div className="max-h-[420px] overflow-y-auto overscroll-contain">
              {freeChatModels.length > 0 && (
                <ModelGroup
                  label="Chat / LLM"
                  labelColor="text-emerald-600 dark:text-emerald-400"
                  models={freeChatModels}
                  selectedModel={selectedModel}
                  onSelect={handleSelect}
                  startIndex={0}
                  modelTiers={modelTiers}
                  isFreeUser={isFreeUser}
                />
              )}

              {freeImageModels.length > 0 && (
                <ModelGroup
                  label="Image Generation"
                  labelColor="text-violet-600 dark:text-violet-400"
                  badge={{ text: 'IMG', color: 'bg-violet-500' }}
                  models={freeImageModels}
                  selectedModel={selectedModel}
                  onSelect={handleSelect}
                  startIndex={freeChatModels.length}
                  showBorder
                  modelTiers={modelTiers}
                  isFreeUser={isFreeUser}
                />
              )}

              {freeVideoModels.length > 0 && (
                <ModelGroup
                  label="Video Generation"
                  labelColor="text-pink-600 dark:text-pink-400"
                  badge={{ text: 'VID', color: 'bg-pink-500' }}
                  models={freeVideoModels}
                  selectedModel={selectedModel}
                  onSelect={handleSelect}
                  startIndex={freeChatModels.length + freeImageModels.length}
                  showBorder
                  modelTiers={modelTiers}
                  isFreeUser={isFreeUser}
                />
              )}

              {/* Locked Models Section (free users only) */}
              {allLockedModels.length > 0 && (
                <div className="py-1 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="px-3 py-1.5">
                    <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                      สมาชิกเท่านั้น
                    </span>
                  </div>
                  {allLockedModels.map((model, index) => (
                    <motion.button
                      key={model.key}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: (allAvailable.length + index) * 0.02 }}
                      onClick={() => handleSelect(model.id, true)}
                      disabled
                      className="w-full flex items-center gap-2.5 px-3 py-2 opacity-50 cursor-not-allowed"
                    >
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
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium truncate text-neutral-500 dark:text-neutral-400">
                            {model.name}
                          </span>
                          <span className="shrink-0 px-1 py-0.5 text-[7px] font-bold rounded bg-blue-500 text-white leading-none">
                            สมาชิก
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

            {/* Footer - Upgrade CTA (free users only) */}
            {isFreeUser && (
              <div className="px-3 py-2 bg-gradient-to-r from-primary-50 to-amber-50 dark:from-primary-950/30 dark:to-amber-950/30 border-t border-neutral-200 dark:border-neutral-700">
                <a href="/pricing" className="w-full block text-center text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                  อัปเกรดเพื่อปลดล็อคทุกโมเดล →
                </a>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={containerRef} className="relative">
      {variant === 'compact' ? (
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
          <div className="relative">
            <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
              <Image
                src={`${currentModel?.icon || '/images/models/byteplus.svg'}?v=3`}
                alt={currentModel?.provider || 'AI'}
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-neutral-800" />
          </div>

          <div className="text-left min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                {currentModel?.name || 'Select Model'}
              </span>
              {currentModel && !isModelPaid(currentDbModel?.key || getModelKey(selectedModel) || selectedModel) && (
                <span className="px-1 py-0.5 rounded bg-emerald-500 text-white text-[8px] font-bold">
                  ฟรี
                </span>
              )}
              {currentModel && isModelPaid(currentDbModel?.key || getModelKey(selectedModel) || selectedModel) && (
                <span className="px-1 py-0.5 rounded bg-blue-500 text-white text-[8px] font-bold">
                  สมาชิก
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

          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          </motion.div>
        </motion.button>
      )}

      {isMounted && createPortal(dropdownContent, document.body)}
    </div>
  );
}

// ─── ModelGroup sub-component ────────────────────────────

interface ModelGroupProps {
  label: string;
  labelColor: string;
  badge?: { text: string; color: string };
  models: DbModel[];
  selectedModel: string;
  onSelect: (modelId: string, isLocked: boolean) => void;
  startIndex: number;
  showBorder?: boolean;
  modelTiers: Record<string, string>;
  isFreeUser: boolean;
}

function ModelGroup({ label, labelColor, badge, models, selectedModel, onSelect, startIndex, showBorder, modelTiers, isFreeUser }: ModelGroupProps) {
  return (
    <div className={cn('py-1', showBorder && 'border-t border-neutral-200 dark:border-neutral-700')}>
      <div className="px-3 py-1.5">
        <span className={cn('text-[10px] font-semibold uppercase tracking-wider', labelColor)}>
          {label}
        </span>
      </div>
      {models.map((model, index) => {
        const isSelected = model.id === selectedModel || model.key === selectedModel;
        const tier = modelTiers[model.key];
        const isPaid = tier && tier !== 'free';

        return (
          <motion.button
            key={model.key}
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
                {isPaid ? (
                  <span className="shrink-0 px-1 py-0.5 text-[7px] font-bold rounded bg-blue-500 text-white leading-none">
                    สมาชิก
                  </span>
                ) : (
                  <span className="shrink-0 px-1 py-0.5 text-[7px] font-bold rounded bg-emerald-500 text-white leading-none">
                    ฟรี
                  </span>
                )}
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
