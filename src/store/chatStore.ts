import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '@/lib/utils';
import { type ModelId } from '@/lib/constants';

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

  // Actions
  createChat: () => string;
  deleteChat: (chatId: string) => void;
  setActiveChat: (chatId: string) => void;
  setSelectedModel: (modelId: ModelId) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChat: null,
      selectedModel: 'gpt-oss-120b',
      isTyping: false,
      sidebarOpen: true,

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

      toggleSidebar: () => {
        set(state => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },
    }),
    {
      name: 'rabbithub-chat-storage',
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
