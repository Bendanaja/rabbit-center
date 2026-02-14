'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Sparkles, Zap, Brain, Code, Languages, Lightbulb, Loader2, Clock, Hash, AlertCircle, RotateCcw, ImagePlus, Video, Download } from 'lucide-react';
import { toast } from 'sonner';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { getGreeting, cn } from '@/lib/utils';
import { useChat } from '@/hooks/useChat';
import { useAI } from '@/hooks/useAI';
import { getModelById, getModelType, buildContextMessages } from '@/lib/byteplus';
import { authFetch, getAuthToken } from '@/lib/api-client';
import { PROMPT_TEMPLATES, PROMPT_CATEGORIES } from '@/lib/prompt-templates';
import type { Message } from '@/types/database';
import type { ModelId } from '@/lib/constants';

interface ChatWindowProps {
  chatId: string | null;
  userId: string;
  onChatCreated?: (chatId: string) => void;
  onCreateChat?: () => Promise<void>;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  onMessageSent?: () => void;
}

export function ChatWindow({ chatId, userId, onChatCreated, onCreateChat, selectedModel, onModelChange, onMessageSent }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

  const { chat, messages, loading, sendMessage, updateChatTitle, refetch } = useChat(chatId || undefined);
  const { isGenerating, generate, stop } = useAI();

  const [streamingContent, setStreamingContent] = useState('');
  const [displayedContent, setDisplayedContent] = useState(''); // For typewriter effect
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [streamingDone, setStreamingDone] = useState(false); // Track when onDone fires but stream still open
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);
  const [mediaGenerating, setMediaGenerating] = useState<'image' | 'video' | null>(null);
  const [videoProgress, setVideoProgress] = useState<string>('');
  const [contextUsage, setContextUsage] = useState<number>(0);
  const lastMessageRef = useRef<string | null>(null);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);
  const fullContentRef = useRef<string>('');
  const displayedLengthRef = useRef<number>(0);
  const pendingMessageRef = useRef<string | null>(null);
  const videoPollingRef = useRef<NodeJS.Timeout | null>(null);
  // Track active chatId to prevent cross-chat message leakage
  const activeChatIdRef = useRef<string | null>(chatId);

  // Auto-compact: cache summary of dropped messages
  const compactSummaryRef = useRef<string | null>(null);
  const compactedCountRef = useRef<number>(0);

  // Build context with auto-compaction using seed-1-6-flash for dropped messages
  const buildContextWithCompact = useCallback(async (
    allMsgs: { role: 'user' | 'assistant' | 'system'; content: string }[],
    maxTokens: number,
  ): Promise<{ contextMessages: { role: 'user' | 'assistant' | 'system'; content: string }[]; usagePercent: number }> => {
    const { messages: fittingMessages, usagePercent } = buildContextMessages(allMsgs, maxTokens);
    const droppedCount = allMsgs.length - fittingMessages.length;

    if (droppedCount === 0) {
      return { contextMessages: fittingMessages, usagePercent };
    }

    // Use cached summary if we already summarized this many messages
    if (compactSummaryRef.current && compactedCountRef.current === droppedCount) {
      const summaryMsg: { role: 'user' | 'assistant' | 'system'; content: string } = {
        role: 'system',
        content: `[สรุปบทสนทนาก่อนหน้า]: ${compactSummaryRef.current}`,
      };
      return { contextMessages: [summaryMsg, ...fittingMessages], usagePercent };
    }

    // Call compact API to summarize dropped messages
    const droppedMessages = allMsgs.slice(0, droppedCount);
    try {
      const response = await authFetch('/api/ai/compact', {
        method: 'POST',
        body: JSON.stringify({ messages: droppedMessages }),
      });

      if (response.ok) {
        const { summary } = await response.json();
        compactSummaryRef.current = summary;
        compactedCountRef.current = droppedCount;

        const summaryMsg: { role: 'user' | 'assistant' | 'system'; content: string } = {
          role: 'system',
          content: `[สรุปบทสนทนาก่อนหน้า]: ${summary}`,
        };
        return { contextMessages: [summaryMsg, ...fittingMessages], usagePercent };
      }
    } catch (err) {
      console.error('Auto-compact failed, using truncated context:', err);
    }

    // Fallback: just use fitting messages without summary
    return { contextMessages: fittingMessages, usagePercent };
  }, []);

  // Sync local messages with fetched messages from DB
  // Simple approach: only sync on initial load, otherwise let local state be the truth
  useEffect(() => {
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
  }, [messages, loading, isInitialLoad]);

  // Reset on chat change - IMPORTANT: abort generation & clear everything when switching chats
  useEffect(() => {
    activeChatIdRef.current = chatId;
    // Abort any in-flight AI generation from the previous chat
    stop();
    setIsInitialLoad(true);
    setLocalMessages([]); // Clear messages when switching chats
    setResponseTime(null);
    setDisplayedContent('');
    setStreamingContent('');
    setAiError(null);
    fullContentRef.current = '';
    displayedLengthRef.current = 0;
    compactSummaryRef.current = null;
    compactedCountRef.current = 0;
    setContextUsage(0);
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
    }
  }, [chatId]);

  // Cleanup typewriter and video polling on unmount
  useEffect(() => {
    return () => {
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
      }
      if (videoPollingRef.current) {
        clearTimeout(videoPollingRef.current);
      }
    };
  }, []);

  // Update selected model when chat changes (only if the stored model_id is valid)
  useEffect(() => {
    if (chat?.model_id && chat.model_id !== selectedModel) {
      // Only sync if model_id exists in the MODELS registry; skip stale/invalid IDs
      const model = getModelById(chat.model_id);
      if (model) {
        onModelChange(chat.model_id);
      }
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
    setAiError(null);
    lastMessageRef.current = content;

    // Save user message to database
    const { error: sendError } = await sendMessage(content, 'user');
    if (sendError) {
      console.error('Failed to save user message:', sendError);
      return;
    }

    // Prepare messages for AI (auto-compact by token count, summarize dropped messages)
    const modelDef = getModelById(selectedModel);
    const maxTokens = modelDef?.maxContextTokens || 128_000;
    const allContextMsgs = [...localMessages, userMessage].map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));
    const { contextMessages, usagePercent } = await buildContextWithCompact(allContextMsgs, maxTokens);
    setContextUsage(usagePercent);

    // Reset streaming content and start timer
    setStreamingContent('');
    setDisplayedContent('');
    setStreamingDone(false);
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
          // Guard: ignore chunks if user switched to a different chat
          if (activeChatIdRef.current !== targetChatId) return;

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
          // Guard: don't apply results if user switched to a different chat
          if (activeChatIdRef.current !== targetChatId) {
            // Cleanup streaming state silently
            if (typewriterRef.current) {
              clearInterval(typewriterRef.current);
              typewriterRef.current = null;
            }
            return;
          }

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

            // Final guard after delay: user may have switched during the 300ms wait
            if (activeChatIdRef.current !== targetChatId) return;

            // Mark streaming as done to hide typing indicator immediately
            setStreamingDone(true);

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

            // Refresh usage after message sent
            onMessageSent?.();
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
          // Guard: don't show errors from a different chat's generation
          if (activeChatIdRef.current !== targetChatId) return;

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
          const errorMsg = error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
          setAiError(errorMsg);
          toast.error(errorMsg);
        },
        onTitleUpdate: (newTitle) => {
          // Title updated in background
        },
      }
    );
  }, [localMessages, selectedModel, sendMessage, generate]);

  // Handle /image command
  const handleImageGeneration = useCallback(async (prompt: string, targetChatId: string, imageModelId?: string) => {
    const modelToUse = imageModelId || 'seedream-5-0-260128';
    const isCommand = !imageModelId; // if no explicit model, it came from /image command

    // Add user message
    const userMessage: Message = {
      id: `temp-user-${crypto.randomUUID()}`,
      chat_id: targetChatId,
      role: 'user',
      content: isCommand ? `/image ${prompt}` : prompt,
      model_id: null,
      tokens_used: null,
      created_at: new Date().toISOString(),
    };
    setLocalMessages(prev => [...prev, userMessage]);
    await sendMessage(isCommand ? `/image ${prompt}` : prompt, 'user');

    setMediaGenerating('image');
    setAiError(null);

    try {
      const token = await getAuthToken();
      const response = await authFetch('/api/ai/image/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt, model: modelToUse, size: '1024x1024' }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Image generation failed');
      }

      const data = await response.json();
      const imageUrls = (data.images || [])
        .map((img: { url?: string; b64_json?: string }) => img.url || (img.b64_json ? `data:image/png;base64,${img.b64_json}` : ''))
        .filter(Boolean);

      if (imageUrls.length === 0) {
        throw new Error('ไม่สามารถสร้างภาพได้');
      }

      // Add AI response with image
      const aiMessage: Message = {
        id: `img-${crypto.randomUUID()}`,
        chat_id: targetChatId,
        role: 'assistant',
        content: `[GENERATED_IMAGE]\n${imageUrls.join('\n')}\n[/GENERATED_IMAGE]\n\nสร้างภาพจาก: "${prompt}"`,
        model_id: modelToUse,
        tokens_used: null,
        created_at: new Date().toISOString(),
      };
      setLocalMessages(prev => [...prev, aiMessage]);
      await sendMessage(aiMessage.content, 'assistant');
      toast.success('สร้างภาพเสร็จแล้ว');
      onMessageSent?.();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างภาพ';
      setAiError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setMediaGenerating(null);
    }
  }, [sendMessage, onMessageSent]);

  // Handle /video command
  const handleVideoGeneration = useCallback(async (prompt: string, targetChatId: string, videoModelId?: string) => {
    const modelToUse = videoModelId || 'seedance-2-0-260128';
    const isCommand = !videoModelId;

    const userMessage: Message = {
      id: `temp-user-${crypto.randomUUID()}`,
      chat_id: targetChatId,
      role: 'user',
      content: isCommand ? `/video ${prompt}` : prompt,
      model_id: null,
      tokens_used: null,
      created_at: new Date().toISOString(),
    };
    setLocalMessages(prev => [...prev, userMessage]);
    await sendMessage(isCommand ? `/video ${prompt}` : prompt, 'user');

    setMediaGenerating('video');
    setVideoProgress('กำลังเริ่มสร้างวิดีโอ...');
    setAiError(null);

    try {
      const response = await authFetch('/api/ai/video/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt, model: modelToUse }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Video generation failed');
      }

      const { taskId } = await response.json();
      setVideoProgress('กำลังสร้างวิดีโอ... อาจใช้เวลา 1-3 นาที');

      // Poll for status
      const pollStatus = async (): Promise<string> => {
        return new Promise((resolve, reject) => {
          const poll = async () => {
            try {
              const statusRes = await authFetch(`/api/ai/video/status?taskId=${taskId}`);
              const status = await statusRes.json();

              if (status.status === 'completed' && status.videoUrl) {
                resolve(status.videoUrl);
              } else if (status.status === 'failed') {
                reject(new Error(status.error || 'Video generation failed'));
              } else {
                setVideoProgress('กำลังสร้างวิดีโอ... กรุณารอสักครู่');
                videoPollingRef.current = setTimeout(poll, 5000);
              }
            } catch (err) {
              reject(err);
            }
          };
          poll();
        });
      };

      const videoUrl = await pollStatus();

      const aiMessage: Message = {
        id: `vid-${crypto.randomUUID()}`,
        chat_id: targetChatId,
        role: 'assistant',
        content: `[GENERATED_VIDEO]\n${videoUrl}\n[/GENERATED_VIDEO]\n\nสร้างวิดีโอจาก: "${prompt}"`,
        model_id: modelToUse,
        tokens_used: null,
        created_at: new Date().toISOString(),
      };
      setLocalMessages(prev => [...prev, aiMessage]);
      await sendMessage(aiMessage.content, 'assistant');
      toast.success('สร้างวิดีโอเสร็จแล้ว');
      onMessageSent?.();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างวิดีโอ';
      setAiError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setMediaGenerating(null);
      setVideoProgress('');
      if (videoPollingRef.current) {
        clearTimeout(videoPollingRef.current);
        videoPollingRef.current = null;
      }
    }
  }, [sendMessage]);

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

    // Detect /image command
    if (content.startsWith('/image ')) {
      const prompt = content.slice(7).trim();
      if (prompt) {
        await handleImageGeneration(prompt, chatId);
        return;
      }
    }

    // Detect /video command
    if (content.startsWith('/video ')) {
      const prompt = content.slice(7).trim();
      if (prompt) {
        await handleVideoGeneration(prompt, chatId);
        return;
      }
    }

    // Auto-route based on selected model type
    const modelType = getModelType(selectedModel);
    if (modelType === 'image') {
      await handleImageGeneration(content, chatId, selectedModel);
      return;
    }
    if (modelType === 'video') {
      await handleVideoGeneration(content, chatId, selectedModel);
      return;
    }

    await handleSendMessageInternal(content, chatId);
  }, [chatId, onCreateChat, handleSendMessageInternal, handleImageGeneration, handleVideoGeneration]);

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

  const handleRetry = useCallback(() => {
    if (lastMessageRef.current && chatId) {
      setAiError(null);
      // Remove the last user message and re-send
      const lastMsg = lastMessageRef.current;
      setLocalMessages(prev => {
        // Remove the last user message (to re-add it)
        const idx = prev.findLastIndex(m => m.role === 'user' && m.content === lastMsg);
        if (idx >= 0) return prev.slice(0, idx);
        return prev;
      });
      handleSendMessageInternal(lastMsg, chatId);
    }
  }, [chatId, handleSendMessageInternal]);

  // Handle edit user message: update content, remove subsequent messages, resend
  const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!chatId) return;

    // Find the message index
    const msgIndex = localMessages.findIndex(m => m.id === messageId);
    if (msgIndex < 0) return;

    // Update the message content and remove all messages after it
    const updatedMessage = { ...localMessages[msgIndex], content: newContent };
    setLocalMessages(prev => [...prev.slice(0, msgIndex), updatedMessage]);

    // Update the message in the database (best effort, don't block)
    authFetch(`/api/chat/${chatId}/messages`, {
      method: 'PATCH',
      body: JSON.stringify({ messageId, content: newContent }),
    }).catch(err => console.error('Failed to update message in DB:', err));

    // Delete subsequent messages from DB (messages after the edited one)
    // We don't have a bulk delete by ID range, so just let the new messages overwrite
    // The local state is the source of truth during this session

    // Re-send the edited message to AI
    setAiError(null);
    lastMessageRef.current = newContent;

    // Prepare messages for AI context (messages up to but not including the edited one, plus the edited one)
    const editModelDef = getModelById(selectedModel);
    const editMaxTokens = editModelDef?.maxContextTokens || 128_000;
    const editAllMsgs = [...localMessages.slice(0, msgIndex), updatedMessage].map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));
    const { contextMessages, usagePercent: editUsage } = await buildContextWithCompact(editAllMsgs, editMaxTokens);
    setContextUsage(editUsage);

    // Reset streaming content and start timer
    setStreamingContent('');
    setDisplayedContent('');
    setStreamingDone(false);
    fullContentRef.current = '';
    displayedLengthRef.current = 0;
    startTimeRef.current = Date.now();

    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
    }

    const editTargetChatId = chatId;
    await generate(
      chatId,
      contextMessages,
      selectedModel,
      {
        onChunk: (chunk) => {
          if (activeChatIdRef.current !== editTargetChatId) return;
          fullContentRef.current += chunk;
          setStreamingContent(fullContentRef.current);
          if (!typewriterRef.current) {
            typewriterRef.current = setInterval(() => {
              if (displayedLengthRef.current < fullContentRef.current.length) {
                displayedLengthRef.current++;
                setDisplayedContent(fullContentRef.current.slice(0, displayedLengthRef.current));
              }
            }, 20);
          }
        },
        onDone: async (fullResponse, responseMessageId) => {
          if (activeChatIdRef.current !== editTargetChatId) {
            if (typewriterRef.current) { clearInterval(typewriterRef.current); typewriterRef.current = null; }
            return;
          }
          try {
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            setResponseTime(elapsed);
            if (typewriterRef.current) {
              clearInterval(typewriterRef.current);
              typewriterRef.current = null;
            }
            setDisplayedContent(fullResponse);
            await new Promise(resolve => setTimeout(resolve, 300));
            if (activeChatIdRef.current !== editTargetChatId) return;
            setStreamingDone(true);
            const aiMessage: Message = {
              id: responseMessageId || `ai-${crypto.randomUUID()}`,
              chat_id: editTargetChatId,
              role: 'assistant',
              content: fullResponse,
              model_id: selectedModel,
              tokens_used: null,
              created_at: new Date().toISOString(),
            };
            setLocalMessages(prev => [...prev, aiMessage]);
            setStreamingContent('');
            setDisplayedContent('');
            fullContentRef.current = '';
            displayedLengthRef.current = 0;
          } catch (error) {
            console.error('onDone error:', error);
            setStreamingContent('');
            setDisplayedContent('');
            fullContentRef.current = '';
            displayedLengthRef.current = 0;
          }
        },
        onError: (error) => {
          if (activeChatIdRef.current !== editTargetChatId) return;
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
          setAiError(error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
        },
        onTitleUpdate: () => {},
      }
    );
  }, [chatId, localMessages, selectedModel, generate]);

  // Handle regenerate AI response: re-send the preceding user message
  const handleRegenerate = useCallback(async (aiMessageId: string) => {
    if (!chatId) return;

    // Find the AI message
    const aiMsgIndex = localMessages.findIndex(m => m.id === aiMessageId);
    if (aiMsgIndex < 0) return;

    // Find the preceding user message
    let userMessage: Message | null = null;
    for (let i = aiMsgIndex - 1; i >= 0; i--) {
      if (localMessages[i].role === 'user') {
        userMessage = localMessages[i];
        break;
      }
    }
    if (!userMessage) return;

    // Remove the AI message from local state
    setLocalMessages(prev => prev.filter((_, idx) => idx !== aiMsgIndex));

    // Re-send the user message to get a new response
    setAiError(null);
    lastMessageRef.current = userMessage.content;

    // Prepare context (everything up to the AI message, excluding the AI message)
    const regenModelDef = getModelById(selectedModel);
    const regenMaxTokens = regenModelDef?.maxContextTokens || 128_000;
    const regenAllMsgs = localMessages.slice(0, aiMsgIndex).map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));
    const { contextMessages, usagePercent: regenUsage } = await buildContextWithCompact(regenAllMsgs, regenMaxTokens);
    setContextUsage(regenUsage);

    // Reset streaming
    setStreamingContent('');
    setDisplayedContent('');
    setStreamingDone(false);
    fullContentRef.current = '';
    displayedLengthRef.current = 0;
    startTimeRef.current = Date.now();

    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
    }

    const regenTargetChatId = chatId;
    await generate(
      chatId,
      contextMessages,
      selectedModel,
      {
        onChunk: (chunk) => {
          if (activeChatIdRef.current !== regenTargetChatId) return;
          fullContentRef.current += chunk;
          setStreamingContent(fullContentRef.current);
          if (!typewriterRef.current) {
            typewriterRef.current = setInterval(() => {
              if (displayedLengthRef.current < fullContentRef.current.length) {
                displayedLengthRef.current++;
                setDisplayedContent(fullContentRef.current.slice(0, displayedLengthRef.current));
              }
            }, 20);
          }
        },
        onDone: async (fullResponse, responseMessageId) => {
          if (activeChatIdRef.current !== regenTargetChatId) {
            if (typewriterRef.current) { clearInterval(typewriterRef.current); typewriterRef.current = null; }
            return;
          }
          try {
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            setResponseTime(elapsed);
            if (typewriterRef.current) {
              clearInterval(typewriterRef.current);
              typewriterRef.current = null;
            }
            setDisplayedContent(fullResponse);
            await new Promise(resolve => setTimeout(resolve, 300));
            if (activeChatIdRef.current !== regenTargetChatId) return;
            setStreamingDone(true);
            const aiMessage: Message = {
              id: responseMessageId || `ai-${crypto.randomUUID()}`,
              chat_id: regenTargetChatId,
              role: 'assistant',
              content: fullResponse,
              model_id: selectedModel,
              tokens_used: null,
              created_at: new Date().toISOString(),
            };
            setLocalMessages(prev => [...prev, aiMessage]);
            setStreamingContent('');
            setDisplayedContent('');
            fullContentRef.current = '';
            displayedLengthRef.current = 0;
          } catch (error) {
            console.error('onDone error:', error);
            setStreamingContent('');
            setDisplayedContent('');
            fullContentRef.current = '';
            displayedLengthRef.current = 0;
          }
        },
        onError: (error) => {
          if (activeChatIdRef.current !== regenTargetChatId) return;
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
          setAiError(error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
        },
        onTitleUpdate: () => {},
      }
    );
  }, [chatId, localMessages, selectedModel, generate]);

  const currentModel = getModelById(selectedModel) || getModelById('deepseek-v3-2-251201');

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
                    modelId: (message.model_id || undefined) as ModelId | undefined,
                  }}
                  isLast={index === filteredMessages.length - 1 && !isGenerating}
                  onEdit={!isGenerating ? handleEditMessage : undefined}
                  onRegenerate={!isGenerating ? handleRegenerate : undefined}
                />
              ))}
            </AnimatePresence>

            {/* Media Generation Progress */}
            <AnimatePresence>
              {mediaGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-4 py-6"
                >
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg',
                    mediaGenerating === 'image'
                      ? 'bg-gradient-to-br from-violet-500 to-purple-600'
                      : 'bg-gradient-to-br from-pink-500 to-rose-600'
                  )}>
                    {mediaGenerating === 'image' ? (
                      <ImagePlus className="h-4 w-4 text-white" />
                    ) : (
                      <Video className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-white">
                        {currentModel?.name || (mediaGenerating === 'image' ? 'Seedream 5.0' : 'Seedance 2.0')}
                      </span>
                      <div className={cn(
                        'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full',
                        mediaGenerating === 'image' ? 'bg-violet-500/20' : 'bg-pink-500/20'
                      )}>
                        <Loader2 className={cn(
                          'h-3 w-3 animate-spin',
                          mediaGenerating === 'image' ? 'text-violet-400' : 'text-pink-400'
                        )} />
                        <span className={cn(
                          'text-[10px] font-medium',
                          mediaGenerating === 'image' ? 'text-violet-400' : 'text-pink-400'
                        )}>
                          {mediaGenerating === 'image' ? 'กำลังสร้างภาพ...' : videoProgress || 'กำลังสร้างวิดีโอ...'}
                        </span>
                      </div>
                    </div>
                    {/* Progress animation */}
                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div
                        className={cn(
                          'h-full rounded-full',
                          mediaGenerating === 'image'
                            ? 'bg-gradient-to-r from-violet-500 to-purple-500'
                            : 'bg-gradient-to-r from-pink-500 to-rose-500'
                        )}
                        initial={{ width: '0%' }}
                        animate={{ width: mediaGenerating === 'image' ? '90%' : '60%' }}
                        transition={{ duration: mediaGenerating === 'image' ? 15 : 60, ease: 'linear' }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Streaming Response */}
            <AnimatePresence>
              {isGenerating && !streamingDone && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-4 py-6"
                >
                  <div className="relative h-6 w-6 sm:h-7 sm:w-7 rounded-full overflow-hidden shadow-lg shrink-0 border border-neutral-200 dark:border-neutral-700">
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
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30">
                        <div
                          className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-[navDotPulse_1s_ease-in-out_infinite]"
                          style={{ willChange: 'transform' }}
                        />
                        <span className="text-[10px] font-medium text-primary-600 dark:text-primary-400">
                          กำลังพิมพ์...
                        </span>
                      </div>
                    </div>

                    {displayedContent ? (
                      <>
                        <div className="prose prose-neutral dark:prose-invert max-w-none">
                          <p className="text-sm sm:text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap m-0">
                            {displayedContent}
                            <span
                              className="inline-block w-0.5 h-5 bg-primary-500 ml-0.5 align-middle animate-[cursorBlink_1s_step-end_infinite]"
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
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-2 h-2 rounded-full bg-primary-400 animate-[scalePulse_0.8s_ease-in-out_infinite]"
                            style={{ willChange: 'transform, opacity', animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message with retry */}
            <AnimatePresence>
              {aiError && !isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 my-4"
                >
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400 flex-1">
                    {aiError}
                  </p>
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors shrink-0"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    ลองใหม่
                  </button>
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
      <div className="bg-white dark:bg-neutral-950">
        <div className="max-w-3xl mx-auto">
          {/* Context usage indicator */}
          <AnimatePresence>
            {contextUsage > 0 && localMessages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-1"
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full rounded-full transition-colors duration-300',
                        contextUsage >= 90
                          ? 'bg-red-500'
                          : contextUsage >= 70
                            ? 'bg-amber-500'
                            : 'bg-primary-500/60'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(contextUsage, 100)}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <span className={cn(
                    'text-[10px] tabular-nums font-medium shrink-0',
                    contextUsage >= 90
                      ? 'text-red-500'
                      : contextUsage >= 70
                        ? 'text-amber-500'
                        : 'text-neutral-400'
                  )}>
                    Memory {contextUsage}%
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
  onSendMessage: (content: string) => void;
}

function WelcomeScreen({ onSendMessage }: WelcomeScreenProps) {
  const greeting = getGreeting();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredTemplates = activeCategory === 'all'
    ? PROMPT_TEMPLATES
    : PROMPT_TEMPLATES.filter(t => t.category === activeCategory);

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
              alt="RabbitHub"
              fill
              sizes="80px"
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500" />
          </div>
        </motion.div>

        {/* Greeting */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-neutral-900 dark:text-white mb-2 sm:mb-3"
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

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-wrap justify-center gap-2 mb-5"
        >
          {PROMPT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                activeCategory === cat.id
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              )}
            >
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* Template Cards Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3"
        >
          {filteredTemplates.slice(0, 6).map((template, index) => (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSendMessage(template.prompt)}
              className="group flex items-start gap-3 p-3 sm:p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-200 text-left"
            >
              <div className="text-xl shrink-0 mt-0.5">{template.icon}</div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {template.title}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5 truncate">
                  {template.description}
                </p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
