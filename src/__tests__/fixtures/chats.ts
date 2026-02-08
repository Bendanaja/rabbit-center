// Test chat fixtures for RabbitHub

import type { Chat, Message } from '@/store/chatStore';

export const createTestMessage = (overrides: Partial<Message> = {}): Message => ({
  id: `msg-${Math.random().toString(36).slice(2)}`,
  role: 'user',
  content: 'Test message content',
  timestamp: new Date('2024-01-15T10:00:00'),
  ...overrides,
});

export const createTestChat = (overrides: Partial<Chat> = {}): Chat => ({
  id: `chat-${Math.random().toString(36).slice(2)}`,
  title: 'Test Chat',
  messages: [],
  modelId: 'gpt-3.5',
  createdAt: new Date('2024-01-15T09:00:00'),
  updatedAt: new Date('2024-01-15T10:00:00'),
  ...overrides,
});

export const testChats = {
  empty: createTestChat({
    id: 'chat-empty',
    title: 'Empty Chat',
    messages: [],
  }),

  withUserMessage: createTestChat({
    id: 'chat-user-msg',
    title: 'Chat with User Message',
    messages: [
      createTestMessage({
        id: 'msg-user-1',
        role: 'user',
        content: 'Hello, AI!',
      }),
    ],
  }),

  withConversation: createTestChat({
    id: 'chat-conversation',
    title: 'Chat with Conversation',
    messages: [
      createTestMessage({
        id: 'msg-conv-1',
        role: 'user',
        content: 'What is TypeScript?',
        timestamp: new Date('2024-01-15T10:00:00'),
      }),
      createTestMessage({
        id: 'msg-conv-2',
        role: 'assistant',
        content: 'TypeScript is a strongly typed programming language that builds on JavaScript.',
        timestamp: new Date('2024-01-15T10:00:05'),
        modelId: 'gpt-3.5',
      }),
      createTestMessage({
        id: 'msg-conv-3',
        role: 'user',
        content: 'How do I use it?',
        timestamp: new Date('2024-01-15T10:01:00'),
      }),
      createTestMessage({
        id: 'msg-conv-4',
        role: 'assistant',
        content: 'You can start using TypeScript by installing it via npm and creating a tsconfig.json file.',
        timestamp: new Date('2024-01-15T10:01:05'),
        modelId: 'gpt-3.5',
      }),
    ],
  }),

  withStreamingMessage: createTestChat({
    id: 'chat-streaming',
    title: 'Chat with Streaming',
    messages: [
      createTestMessage({
        id: 'msg-stream-1',
        role: 'user',
        content: 'Tell me a story',
      }),
      createTestMessage({
        id: 'msg-stream-2',
        role: 'assistant',
        content: 'Once upon a time...',
        isStreaming: true,
        streamedContent: 'Once upon',
      }),
    ],
  }),

  withDifferentModels: createTestChat({
    id: 'chat-models',
    title: 'Chat with Different Models',
    modelId: 'gpt-4',
    messages: [
      createTestMessage({
        id: 'msg-model-1',
        role: 'user',
        content: 'Question for GPT-4',
      }),
      createTestMessage({
        id: 'msg-model-2',
        role: 'assistant',
        content: 'Response from GPT-4',
        modelId: 'gpt-4',
      }),
    ],
  }),
} as const;

export const testMessages = {
  user: createTestMessage({
    id: 'msg-test-user',
    role: 'user',
    content: 'User test message',
  }),

  assistant: createTestMessage({
    id: 'msg-test-assistant',
    role: 'assistant',
    content: 'Assistant test message',
    modelId: 'gpt-3.5',
  }),

  long: createTestMessage({
    id: 'msg-test-long',
    role: 'user',
    content: 'A'.repeat(4000),
  }),

  withEmoji: createTestMessage({
    id: 'msg-test-emoji',
    role: 'user',
    content: 'Hello! How are you today? Let me know if you need help.',
  }),

  thai: createTestMessage({
    id: 'msg-test-thai',
    role: 'user',
    content: 'สวัสดีครับ ช่วยเขียนโค้ด Python ให้หน่อยได้ไหมครับ',
  }),
} as const;
