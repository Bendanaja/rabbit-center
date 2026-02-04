import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId, getTypingDelay } from '@/lib/utils';
import { AI_MODELS, MOCK_RESPONSES, type ModelId } from '@/lib/constants';
import { soundManager } from '@/lib/sounds';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  modelId?: ModelId;
  // New fields for streaming animation
  isStreaming?: boolean;
  streamedContent?: string;
  responseTime?: number; // in seconds
  wordCount?: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  modelId: ModelId;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatState {
  chats: Chat[];
  activeChat: string | null;
  selectedModel: ModelId;
  isTyping: boolean;
  sidebarOpen: boolean;
  streamingMessageId: string | null;

  // Actions
  createChat: () => string;
  deleteChat: (chatId: string) => void;
  setActiveChat: (chatId: string) => void;
  setSelectedModel: (modelId: ModelId) => void;
  sendMessage: (content: string) => Promise<void>;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  updateStreamedContent: (messageId: string, content: string) => void;
}

// Generate mock AI response
function generateMockResponse(userMessage: string, modelId: ModelId): string {
  const model = AI_MODELS.find(m => m.id === modelId);
  const randomResponse = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];

  const responses: Record<string, string> = {
    hello: `สวัสดีครับ! ผมคือ ${model?.name || 'ผู้ช่วย AI'} ยินดีให้บริการครับ วันนี้ให้ช่วยอะไรดีครับ?`,
    help: `ยินดีช่วยเหลือครับ! ในฐานะ ${model?.name || 'AI'} ผมสามารถช่วยเรื่องการเขียน การวิเคราะห์ การเขียนโค้ด งานสร้างสรรค์ และอื่นๆ อีกมากมาย คุณต้องการให้ช่วยเรื่องอะไรครับ?`,
    test: `นี่คือการตอบกลับทดสอบจาก ${model?.name || 'AI model'} ครับ ทุกอย่างทำงานปกติ! ถามผมได้เลยครับ`,
    สวัสดี: `สวัสดีครับ! ผมคือ ${model?.name || 'ผู้ช่วย AI'} พร้อมให้บริการแล้วครับ มีอะไรให้ช่วยไหมครับ?`,
  };

  const lowerMessage = userMessage.toLowerCase();
  for (const [key, response] of Object.entries(responses)) {
    if (lowerMessage.includes(key)) {
      return response;
    }
  }

  return `${randomResponse}\n\nในฐานะ ${model?.name || 'ผู้ช่วย AI'} จาก ${model?.provider || 'ผู้ให้บริการ'} ผมได้รับข้อความของคุณเกี่ยวกับ "${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}" เรียบร้อยแล้ว\n\nนี่คือการตอบกลับจำลองสำหรับการสาธิต ในระบบจริง คุณจะได้รับคำตอบที่ลึกซึ้งและตรงประเด็นจาก ${model?.name || 'AI'} API โดยตรงครับ`;
}

// Simulate streaming text with character-by-character for smoother animation
async function* streamText(text: string, onChar?: () => void, onWord?: () => void): AsyncGenerator<string> {
  let accumulated = '';
  let wordBuffer = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    accumulated += char;
    wordBuffer += char;

    // Check if we completed a word (space, newline, or punctuation)
    if (char === ' ' || char === '\n' || /[.,!?;:]/.test(char)) {
      onWord?.();
      wordBuffer = '';
    } else {
      // Play typing sound occasionally (not every char for performance)
      if (Math.random() < 0.3) {
        onChar?.();
      }
    }

    yield accumulated;

    // Variable delay for natural feel
    // Faster for regular characters, slight pause at punctuation
    let delay = 15 + Math.random() * 25; // Base: 15-40ms per char
    if (/[.,!?;:\n]/.test(char)) {
      delay = 80 + Math.random() * 120; // Pause at punctuation: 80-200ms
    } else if (char === ' ') {
      delay = 30 + Math.random() * 40; // Slight pause at spaces: 30-70ms
    }

    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChat: null,
      selectedModel: 'gpt-3.5',
      isTyping: false,
      sidebarOpen: true,
      streamingMessageId: null,

      createChat: () => {
        const id = generateId();
        const newChat: Chat = {
          id,
          title: 'แชทใหม่',
          messages: [],
          modelId: get().selectedModel,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set(state => ({
          chats: [newChat, ...state.chats],
          activeChat: id,
        }));

        return id;
      },

      deleteChat: (chatId) => {
        set(state => {
          const newChats = state.chats.filter(c => c.id !== chatId);
          return {
            chats: newChats,
            activeChat: state.activeChat === chatId
              ? (newChats[0]?.id || null)
              : state.activeChat,
          };
        });
      },

      setActiveChat: (chatId) => {
        const chat = get().chats.find(c => c.id === chatId);
        if (chat) {
          set({
            activeChat: chatId,
            selectedModel: chat.modelId,
          });
        }
      },

      setSelectedModel: (modelId) => {
        set({ selectedModel: modelId });

        const { activeChat, chats } = get();
        if (activeChat) {
          set({
            chats: chats.map(chat =>
              chat.id === activeChat
                ? { ...chat, modelId }
                : chat
            ),
          });
        }
      },

      updateStreamedContent: (messageId, content) => {
        set(state => ({
          chats: state.chats.map(chat => ({
            ...chat,
            messages: chat.messages.map(m =>
              m.id === messageId
                ? { ...m, streamedContent: content }
                : m
            ),
          })),
        }));
      },

      sendMessage: async (content) => {
        const { activeChat, selectedModel } = get();
        const startTime = Date.now();

        let chatId = activeChat;
        if (!chatId) {
          chatId = get().createChat();
        }

        const userMessage: Message = {
          id: generateId(),
          role: 'user',
          content,
          timestamp: new Date(),
        };

        // Add user message
        set(state => ({
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [...chat.messages, userMessage],
                  title: chat.messages.length === 0
                    ? content.substring(0, 30) + (content.length > 30 ? '...' : '')
                    : chat.title,
                  updatedAt: new Date(),
                }
              : chat
          ),
        }));

        // Start typing indicator
        set({ isTyping: true });

        // Generate response
        const response = generateMockResponse(content, selectedModel);
        const wordCount = response.split(/\s+/).length;

        // Create assistant message with streaming flag
        const assistantMessageId = generateId();
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          modelId: selectedModel,
          isStreaming: true,
          streamedContent: '',
          wordCount,
        };

        // Small initial delay to simulate thinking
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

        // Add assistant message with streaming flag
        set(state => ({
          isTyping: false,
          streamingMessageId: assistantMessageId,
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [...chat.messages, assistantMessage],
                  updatedAt: new Date(),
                }
              : chat
          ),
        }));

        // Stream the content with sound effects
        for await (const streamedContent of streamText(
          response,
          () => soundManager.playTypingSound(),
          () => soundManager.playWordSound()
        )) {
          get().updateStreamedContent(assistantMessageId, streamedContent);
        }

        // Play completion sound
        soundManager.playCompleteSound();

        // Calculate response time
        const responseTime = (Date.now() - startTime) / 1000;

        // Mark streaming as complete
        set(state => ({
          streamingMessageId: null,
          chats: state.chats.map(chat => ({
            ...chat,
            messages: chat.messages.map(m =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    isStreaming: false,
                    streamedContent: response,
                    responseTime,
                  }
                : m
            ),
          })),
        }));
      },

      toggleSidebar: () => {
        set(state => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },
    }),
    {
      name: 'rabbitai-chat-storage',
      partialize: (state) => ({
        chats: state.chats.map(chat => ({
          ...chat,
          createdAt: chat.createdAt.toISOString(),
          updatedAt: chat.updatedAt.toISOString(),
          messages: chat.messages.map(m => ({
            ...m,
            timestamp: m.timestamp.toISOString(),
            isStreaming: false, // Never persist streaming state
          })),
        })),
        selectedModel: state.selectedModel,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.chats = state.chats.map((chat: Chat & { createdAt: string | Date; updatedAt: string | Date }) => ({
            ...chat,
            createdAt: new Date(chat.createdAt),
            updatedAt: new Date(chat.updatedAt),
            messages: chat.messages.map((m: Message & { timestamp: string | Date }) => ({
              ...m,
              timestamp: new Date(m.timestamp),
              isStreaming: false,
            })),
          }));
        }
      },
    }
  )
);
