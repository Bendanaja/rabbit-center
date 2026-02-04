'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Sparkles, Zap, Brain, Code, Languages, Lightbulb, Loader2, Clock, Hash } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ModelSelector } from './ModelSelector';
import { getGreeting } from '@/lib/utils';
import { useChat } from '@/hooks/useChat';
import { useAI } from '@/hooks/useAI';
import { getModelById } from '@/lib/openrouter';
import { authFetch } from '@/lib/api-client';
import type { Message } from '@/types/database';

interface ChatWindowProps {
  chatId: string | null;
  userId: string;
  onChatCreated?: (chatId: string) => void;
  onCreateChat?: () => Promise<void>;
}

export function ChatWindow({ chatId, userId, onChatCreated, onCreateChat }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

  const { chat, messages, loading, sendMessage, updateChatTitle, refetch } = useChat(chatId || undefined);
  const { isGenerating, generate, stop } = useAI();

  const [selectedModel, setSelectedModel] = useState('stepfun/step-3.5-flash:free');
  const [streamingContent, setStreamingContent] = useState('');
  const [displayedContent, setDisplayedContent] = useState(''); // For typewriter effect
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);
  const fullContentRef = useRef<string>('');
  const displayedLengthRef = useRef<number>(0);
  const pendingMessageRef = useRef<string | null>(null);

  // Sync local messages with fetched messages from DB
  // Simple approach: only sync on initial load, otherwise let local state be the truth
  useEffect(() => {
    // Skip during generation
    if (isGenerating) return;

    // Skip while loading
    if (loading) return;

    // Initial load with messages from DB
    if (isInitialLoad && messages.length > 0) {
      setLocalMessages(messages);
      setIsInitialLoad(false);
    }
    // Initial load but no messages (new chat) - mark as ready
    else if (isInitialLoad && messages.length === 0) {
      setIsInitialLoad(false);
    }
  }, [messages, loading, isInitialLoad, isGenerating]);

  // Reset on chat change - IMPORTANT: clear everything when switching chats
  useEffect(() => {
    setIsInitialLoad(true);
    setLocalMessages([]); // Clear messages when switching chats
    setResponseTime(null);
    setDisplayedContent('');
    setStreamingContent('');
    fullContentRef.current = '';
    displayedLengthRef.current = 0;
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
    }
  }, [chatId]);

  // Cleanup typewriter on unmount
  useEffect(() => {
    return () => {
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
      }
    };
  }, []);

  // Update selected model when chat changes
  useEffect(() => {
    if (chat?.model_id) {
      setSelectedModel(chat.model_id);
    }
  }, [chat?.model_id]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [localMessages, streamingContent, isGenerating]);

  // Send pending message when chatId becomes available
  useEffect(() => {
    if (chatId && pendingMessageRef.current && !loading) {
      const pendingMessage = pendingMessageRef.current;
      pendingMessageRef.current = null;
      // Small delay to ensure chat is ready
      setTimeout(() => {
        handleSendMessageInternal(pendingMessage, chatId);
      }, 100);
    }
  }, [chatId, loading]);

  // Internal function that sends message with explicit chatId
  const handleSendMessageInternal = useCallback(async (content: string, targetChatId: string) => {
    if (!content.trim() || !targetChatId) return;

    // Add user message to local state immediately
    const userMessage: Message = {
      id: `temp-user-${crypto.randomUUID()}`,
      chat_id: targetChatId,
      role: 'user',
      content,
      model_id: null,
      tokens_used: null,
      created_at: new Date().toISOString(),
    };

    setLocalMessages(prev => [...prev, userMessage]);
    setResponseTime(null);

    // Save user message to database
    const { error: sendError } = await sendMessage(content, 'user');
    if (sendError) {
      console.error('Failed to save user message:', sendError);
      return;
    }

    // Prepare messages for AI (only send last 20 messages for context)
    const contextMessages = [...localMessages.slice(-19), userMessage].map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    // Reset streaming content and start timer
    setStreamingContent('');
    setDisplayedContent('');
    fullContentRef.current = '';
    displayedLengthRef.current = 0;
    startTimeRef.current = Date.now();

    // Clear any existing typewriter animation
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
    }

    // Generate AI response
    await generate(
      targetChatId,
      contextMessages,
      selectedModel,
      {
        onChunk: (chunk) => {
          // Accumulate full content
          fullContentRef.current += chunk;
          setStreamingContent(fullContentRef.current);

          // Start typewriter if not already running
          if (!typewriterRef.current) {
            typewriterRef.current = setInterval(() => {
              if (displayedLengthRef.current < fullContentRef.current.length) {
                displayedLengthRef.current++;
                setDisplayedContent(fullContentRef.current.slice(0, displayedLengthRef.current));
              }
            }, 20); // 20ms per character
          }
        },
        onDone: async (fullResponse, messageId) => {
          try {
            // Calculate response time
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            setResponseTime(elapsed);

            // Clear typewriter immediately
            if (typewriterRef.current) {
              clearInterval(typewriterRef.current);
              typewriterRef.current = null;
            }

            // Show full content immediately (no waiting for typewriter)
            setDisplayedContent(fullResponse);

            // Small delay before transitioning
            await new Promise(resolve => setTimeout(resolve, 300));

            // Add AI message to local state
            const aiMessage: Message = {
              id: messageId || `ai-${crypto.randomUUID()}`,
              chat_id: targetChatId,
              role: 'assistant',
              content: fullResponse,
              model_id: selectedModel,
              tokens_used: null,
              created_at: new Date().toISOString(),
            };

            setLocalMessages(prev => [...prev, aiMessage]);

            // Reset streaming state
            setStreamingContent('');
            setDisplayedContent('');
            fullContentRef.current = '';
            displayedLengthRef.current = 0;
          } catch (error) {
            console.error('onDone error:', error);
            // Still cleanup even on error
            setStreamingContent('');
            setDisplayedContent('');
            fullContentRef.current = '';
            displayedLengthRef.current = 0;
          }
        },
        onError: (error) => {
          console.error('AI generation error:', error);
          if (typewriterRef.current) {
            clearInterval(typewriterRef.current);
            typewriterRef.current = null;
          }
          setStreamingContent('');
          setDisplayedContent('');
          fullContentRef.current = '';
          displayedLengthRef.current = 0;
          setResponseTime(null);
        },
        onTitleUpdate: (newTitle) => {
          // Title updated in background
        },
      }
    );
  }, [localMessages, selectedModel, sendMessage, generate]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Create new chat if none exists
    if (!chatId && onCreateChat) {
      // Store the pending message
      pendingMessageRef.current = content;
      await onCreateChat();
      // The message will be sent via useEffect when chatId becomes available
      return;
    }

    if (!chatId) return;

    await handleSendMessageInternal(content, chatId);
  }, [chatId, onCreateChat, handleSendMessageInternal]);

  const handleModelChange = async (modelId: string) => {
    setSelectedModel(modelId);

    // Update chat model in database if chat exists
    if (chatId) {
      try {
        await authFetch(`/api/chat/${chatId}`, {
          method: 'PATCH',
          body: JSON.stringify({ model_id: modelId }),
        });
      } catch (error) {
        console.error('Failed to update model:', error);
      }
    }
  };

  const handleStop = useCallback(async () => {
    stop();

    // Save partial response if there's content
    const partialContent = fullContentRef.current;
    if (partialContent && chatId) {
      // Clear typewriter
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
        typewriterRef.current = null;
      }

      // Add AI message with partial content to local state
      const partialMessage: Message = {
        id: `partial-${crypto.randomUUID()}`,
        chat_id: chatId,
        role: 'assistant',
        content: partialContent + '\n\n_(ถูกหยุดกลางทาง)_',
        model_id: selectedModel,
        tokens_used: null,
        created_at: new Date().toISOString(),
      };

      setLocalMessages(prev => [...prev, partialMessage]);

      // Save partial response to database
      try {
        await sendMessage(partialContent + '\n\n_(ถูกหยุดกลางทาง)_', 'assistant');
      } catch (error) {
        console.error('Failed to save partial message:', error);
      }
    }

    // Reset streaming state
    setStreamingContent('');
    setDisplayedContent('');
    fullContentRef.current = '';
    displayedLengthRef.current = 0;
  }, [stop, chatId, selectedModel, sendMessage]);

  const currentModel = getModelById(selectedModel);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950">
      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : localMessages.length === 0 && !isGenerating ? (
          <WelcomeScreen
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
            <AnimatePresence mode="sync" initial={false}>
              {localMessages
                .filter(m => m.role === 'user' || m.role === 'assistant')
                .map((message, index, filteredMessages) => (
                <MessageBubble
                  key={`msg-${message.id}`}
                  message={{
                    id: message.id,
                    role: message.role as 'user' | 'assistant',
                    content: message.content,
                    timestamp: new Date(message.created_at),
                    modelId: (message.model_id || undefined) as 'gpt-4' | 'gpt-3.5' | 'claude-3-opus' | 'claude-2' | 'gemini-pro' | 'mistral-large' | 'llama-3-70b' | undefined,
                  }}
                  isLast={index === filteredMessages.length - 1 && !isGenerating}
                />
              ))}
            </AnimatePresence>

            {/* Streaming Response */}
            <AnimatePresence>
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-4 py-6"
                >
                  <div className="relative h-8 w-8 rounded-lg overflow-hidden shadow-lg shrink-0 border border-neutral-200 dark:border-neutral-700">
                    {currentModel?.icon ? (
                      <Image
                        src={currentModel.icon}
                        alt={currentModel.provider || 'AI'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">AI</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Model name and typing indicator */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {currentModel?.name || 'AI'}
                      </span>
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
                    </div>

                    {displayedContent ? (
                      <>
                        <div className="prose prose-neutral dark:prose-invert max-w-none">
                          <p className="text-sm sm:text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap m-0">
                            {displayedContent}
                            <motion.span
                              className="inline-block w-0.5 h-5 bg-primary-500 ml-0.5 align-middle"
                              animate={{ opacity: [1, 0] }}
                              transition={{ duration: 0.5, repeat: Infinity }}
                            />
                          </p>
                        </div>
                        {/* Word count during streaming */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-3 mt-2 text-[10px] sm:text-xs text-neutral-400"
                        >
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            <motion.span
                              key={displayedContent.split(/\s+/).filter(Boolean).length}
                              initial={{ scale: 1.2 }}
                              animate={{ scale: 1 }}
                              className="tabular-nums"
                            >
                              {displayedContent.split(/\s+/).filter(Boolean).length} คำ
                            </motion.span>
                          </div>
                        </motion.div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 w-fit">
                        <motion.span
                          className="w-2 h-2 rounded-full bg-primary-400"
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                        />
                        <motion.span
                          className="w-2 h-2 rounded-full bg-primary-400"
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }}
                        />
                        <motion.span
                          className="w-2 h-2 rounded-full bg-primary-400"
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Response time indicator (shows after AI finishes) */}
            <AnimatePresence>
              {responseTime !== null && !isGenerating && localMessages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2 py-2 text-xs text-neutral-400"
                >
                  <Clock className="h-3 w-3" />
                  <span>ตอบใน {responseTime.toFixed(1)} วินาที</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={handleSendMessage}
            isGenerating={isGenerating}
            onStop={handleStop}
          />
        </div>
      </div>
    </div>
  );
}

interface WelcomeScreenProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  onSendMessage: (content: string) => void;
}

function WelcomeScreen({ selectedModel, onModelChange, onSendMessage }: WelcomeScreenProps) {
  const greeting = getGreeting();

  const suggestions = [
    { icon: Code, text: 'ช่วยเขียนโค้ด Python สำหรับเว็บ scraping', color: 'text-blue-500' },
    { icon: Lightbulb, text: 'อธิบาย Quantum Computing แบบง่ายๆ', color: 'text-amber-500' },
    { icon: Languages, text: 'แปลข้อความนี้เป็นภาษาอังกฤษ', color: 'text-green-500' },
    { icon: Brain, text: 'วิเคราะห์ข้อดีข้อเสียของการลงทุน', color: 'text-purple-500' },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative mx-auto mb-6 sm:mb-8"
        >
          <div className="relative h-16 w-16 sm:h-20 sm:w-20 mx-auto rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="/images/logo.jpg"
              alt="RabbitAI"
              fill
              className="object-cover"
              priority
            />
          </div>
          <motion.div
            className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500" />
          </motion.div>
        </motion.div>

        {/* Greeting */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-neutral-900 dark:text-white mb-2 sm:mb-3"
        >
          {greeting}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400 mb-6 sm:mb-8"
        >
          วันนี้ให้ผมช่วยอะไรดีครับ?
        </motion.p>

        {/* Model Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center mb-8 sm:mb-10"
        >
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={onModelChange}
          />
        </motion.div>

        {/* Suggestions Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3"
        >
          {suggestions.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.text}
              icon={suggestion.icon}
              text={suggestion.text}
              color={suggestion.color}
              delay={0.6 + index * 0.1}
              onClick={() => onSendMessage(suggestion.text)}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

interface SuggestionCardProps {
  icon: React.ElementType;
  text: string;
  color: string;
  delay: number;
  onClick: () => void;
}

function SuggestionCard({ icon: Icon, text, color, delay, onClick }: SuggestionCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex items-start gap-3 p-3 sm:p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-200 text-left"
    >
      <div className={`p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 transition-colors ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors leading-relaxed">
        {text}
      </span>
    </motion.button>
  );
}
