# RabbitAI Testing Strategy

## Executive Summary

This document outlines a comprehensive testing strategy for RabbitAI, an AI chat platform built with Next.js 16, Supabase, Stripe, and multiple AI APIs.

---

## 1. Testing Tools Recommendation

### Primary Stack

| Tool | Purpose | Rationale |
|------|---------|-----------|
| **Vitest** | Unit & Integration Tests | Native ESM support, faster than Jest, excellent TypeScript support, compatible with Next.js 16 |
| **React Testing Library** | Component Tests | Tests user behavior, not implementation details |
| **Playwright** | E2E Tests | Cross-browser support, excellent async handling, built-in test generation |
| **MSW (Mock Service Worker)** | API Mocking | Intercepts network requests for reliable testing |

### Installation

```bash
# Core testing dependencies
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event

# E2E testing
npm install -D @playwright/test

# API mocking
npm install -D msw

# Coverage
npm install -D @vitest/coverage-v8
```

---

## 2. Test File Structure

```
rabbit_center/
├── src/
│   ├── __tests__/              # Global test utilities
│   │   ├── setup.ts            # Test setup file
│   │   ├── test-utils.tsx      # Custom render, providers
│   │   ├── mocks/
│   │   │   ├── handlers.ts     # MSW handlers
│   │   │   ├── server.ts       # MSW server setup
│   │   │   ├── supabase.ts     # Supabase mocks
│   │   │   └── stripe.ts       # Stripe mocks
│   │   └── fixtures/
│   │       ├── users.ts        # Test user data
│   │       ├── chats.ts        # Test chat data
│   │       └── messages.ts     # Test message data
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   └── Button.test.tsx        # Co-located unit test
│   │   └── chat/
│   │       ├── ChatInput.tsx
│   │       └── ChatInput.test.tsx
│   │
│   ├── store/
│   │   ├── chatStore.ts
│   │   └── chatStore.test.ts
│   │
│   └── lib/
│       ├── utils.ts
│       └── utils.test.ts
│
├── e2e/                        # Playwright E2E tests
│   ├── auth.spec.ts
│   ├── chat.spec.ts
│   ├── payment.spec.ts
│   └── fixtures/
│       └── auth.ts
│
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

---

## 3. Configuration Files

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 4. Test Categories & Priority

### Priority 1: Critical Path (Must Have)

| Category | Coverage Target | Files |
|----------|----------------|-------|
| Auth Flow | 95% | Login, Signup, Session |
| Chat Core | 90% | Send/Receive Messages |
| Payment | 95% | Stripe Integration |
| Data Store | 90% | Zustand Store |

### Priority 2: Important (Should Have)

| Category | Coverage Target | Files |
|----------|----------------|-------|
| UI Components | 80% | Button, Input, Card |
| Utility Functions | 95% | utils.ts, constants.ts |
| AI Model Selection | 85% | ModelSelector |
| Theme System | 75% | ThemeProvider |

### Priority 3: Nice to Have

| Category | Coverage Target | Files |
|----------|----------------|-------|
| Animations | 50% | FadeIn, SlideIn |
| Layout Components | 70% | Navbar, Footer, Sidebar |

---

## 5. Unit Tests

### 5.1 Utility Functions (`src/lib/utils.test.ts`)

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  formatPrice,
  formatMessageTime,
  formatChatDate,
  generateId,
  getTypingDelay,
  getGreeting,
  truncate,
  debounce,
  isMobile,
  getInitials,
} from './utils';

describe('cn (classname merger)', () => {
  it('merges multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
  });

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null)).toBe('base');
  });
});

describe('formatPrice', () => {
  it('formats Thai Baht correctly', () => {
    const result = formatPrice(299);
    expect(result).toContain('299');
    expect(result).toMatch(/฿|THB/);
  });

  it('handles zero', () => {
    const result = formatPrice(0);
    expect(result).toContain('0');
  });

  it('handles large numbers with no decimals', () => {
    const result = formatPrice(1499);
    expect(result).not.toContain('.');
  });
});

describe('formatMessageTime', () => {
  it('formats time in 24-hour format', () => {
    const date = new Date('2024-01-15T14:30:00');
    const result = formatMessageTime(date);
    expect(result).toMatch(/14:30|14.30/);
  });

  it('handles midnight', () => {
    const date = new Date('2024-01-15T00:00:00');
    const result = formatMessageTime(date);
    expect(result).toMatch(/0:00|00:00|0.00|00.00/);
  });
});

describe('formatChatDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "today" for today\'s date', () => {
    const today = new Date('2024-01-15T10:00:00');
    expect(formatChatDate(today)).toBe('วันนี้');
  });

  it('returns "yesterday" for yesterday', () => {
    const yesterday = new Date('2024-01-14T10:00:00');
    expect(formatChatDate(yesterday)).toBe('เมื่อวาน');
  });

  it('returns "X days ago" for dates within a week', () => {
    const threeDaysAgo = new Date('2024-01-12T10:00:00');
    expect(formatChatDate(threeDaysAgo)).toBe('3 วันที่แล้ว');
  });

  it('returns formatted date for older dates', () => {
    const oldDate = new Date('2024-01-01T10:00:00');
    const result = formatChatDate(oldDate);
    expect(result).not.toBe('วันนี้');
    expect(result).not.toBe('เมื่อวาน');
  });
});

describe('generateId', () => {
  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it('generates string IDs', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('generates IDs with expected length', () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(5);
  });
});

describe('getTypingDelay', () => {
  it('returns minimum delay for empty text', () => {
    expect(getTypingDelay('')).toBeGreaterThanOrEqual(500);
  });

  it('increases delay with more words', () => {
    const shortDelay = getTypingDelay('hello');
    const longDelay = getTypingDelay('hello world this is a longer message');
    expect(longDelay).toBeGreaterThan(shortDelay);
  });

  it('caps at 3 seconds', () => {
    const veryLongText = Array(100).fill('word').join(' ');
    expect(getTypingDelay(veryLongText)).toBeLessThanOrEqual(3000);
  });
});

describe('getGreeting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns morning greeting before noon', () => {
    vi.setSystemTime(new Date('2024-01-15T09:00:00'));
    expect(getGreeting()).toBe('สวัสดีตอนเช้า');
  });

  it('returns afternoon greeting between 12-17', () => {
    vi.setSystemTime(new Date('2024-01-15T14:00:00'));
    expect(getGreeting()).toBe('สวัสดีตอนบ่าย');
  });

  it('returns evening greeting after 17', () => {
    vi.setSystemTime(new Date('2024-01-15T19:00:00'));
    expect(getGreeting()).toBe('สวัสดีตอนเย็น');
  });
});

describe('truncate', () => {
  it('does not truncate short text', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates long text with ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });

  it('handles exact length', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resets timer on subsequent calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('isMobile', () => {
  it('returns false on server (no window)', () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;
    expect(isMobile()).toBe(false);
    global.window = originalWindow;
  });
});

describe('getInitials', () => {
  it('returns first two initials', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('handles single name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('limits to two characters', () => {
    expect(getInitials('John Michael Doe')).toBe('JM');
  });

  it('returns uppercase', () => {
    expect(getInitials('john doe')).toBe('JD');
  });
});
```

### 5.2 Zustand Store Tests (`src/store/chatStore.test.ts`)

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { useChatStore } from './chatStore';

// Mock sound manager
vi.mock('@/lib/sounds', () => ({
  soundManager: {
    playTypingSound: vi.fn(),
    playWordSound: vi.fn(),
    playCompleteSound: vi.fn(),
  },
}));

describe('chatStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useChatStore.setState({
      chats: [],
      activeChat: null,
      selectedModel: 'gpt-3.5',
      isTyping: false,
      sidebarOpen: true,
      streamingMessageId: null,
    });
  });

  describe('createChat', () => {
    it('creates a new chat with unique ID', () => {
      const { createChat } = useChatStore.getState();

      const chatId = createChat();
      const state = useChatStore.getState();

      expect(chatId).toBeDefined();
      expect(state.chats).toHaveLength(1);
      expect(state.chats[0].id).toBe(chatId);
      expect(state.activeChat).toBe(chatId);
    });

    it('sets new chat as active', () => {
      const { createChat } = useChatStore.getState();

      const chatId = createChat();

      expect(useChatStore.getState().activeChat).toBe(chatId);
    });

    it('uses selected model for new chat', () => {
      useChatStore.setState({ selectedModel: 'gpt-4' });
      const { createChat } = useChatStore.getState();

      createChat();

      expect(useChatStore.getState().chats[0].modelId).toBe('gpt-4');
    });

    it('prepends new chat to list', () => {
      const { createChat } = useChatStore.getState();

      const firstId = createChat();
      const secondId = createChat();

      const state = useChatStore.getState();
      expect(state.chats[0].id).toBe(secondId);
      expect(state.chats[1].id).toBe(firstId);
    });
  });

  describe('deleteChat', () => {
    it('removes chat from list', () => {
      const { createChat, deleteChat } = useChatStore.getState();

      const chatId = createChat();
      deleteChat(chatId);

      expect(useChatStore.getState().chats).toHaveLength(0);
    });

    it('sets next chat as active when deleting active chat', () => {
      const { createChat, deleteChat } = useChatStore.getState();

      const firstId = createChat();
      const secondId = createChat();

      deleteChat(secondId);

      expect(useChatStore.getState().activeChat).toBe(firstId);
    });

    it('sets activeChat to null when deleting last chat', () => {
      const { createChat, deleteChat } = useChatStore.getState();

      const chatId = createChat();
      deleteChat(chatId);

      expect(useChatStore.getState().activeChat).toBeNull();
    });

    it('does not change activeChat when deleting non-active chat', () => {
      const { createChat, deleteChat, setActiveChat } = useChatStore.getState();

      const firstId = createChat();
      const secondId = createChat();
      setActiveChat(firstId);

      deleteChat(secondId);

      expect(useChatStore.getState().activeChat).toBe(firstId);
    });
  });

  describe('setActiveChat', () => {
    it('sets the active chat', () => {
      const { createChat, setActiveChat } = useChatStore.getState();

      const firstId = createChat();
      const secondId = createChat();
      setActiveChat(firstId);

      expect(useChatStore.getState().activeChat).toBe(firstId);
    });

    it('updates selectedModel to match chat model', () => {
      useChatStore.setState({ selectedModel: 'gpt-3.5' });
      const { createChat, setActiveChat, setSelectedModel } = useChatStore.getState();

      const firstId = createChat();
      setSelectedModel('gpt-4');
      const secondId = createChat();

      setActiveChat(firstId);

      expect(useChatStore.getState().selectedModel).toBe('gpt-3.5');
    });

    it('does nothing for non-existent chat', () => {
      const { createChat, setActiveChat } = useChatStore.getState();

      const chatId = createChat();
      setActiveChat('non-existent');

      expect(useChatStore.getState().activeChat).toBe(chatId);
    });
  });

  describe('setSelectedModel', () => {
    it('updates selected model', () => {
      const { setSelectedModel } = useChatStore.getState();

      setSelectedModel('gpt-4');

      expect(useChatStore.getState().selectedModel).toBe('gpt-4');
    });

    it('updates active chat model', () => {
      const { createChat, setSelectedModel } = useChatStore.getState();

      const chatId = createChat();
      setSelectedModel('claude-3-opus');

      const chat = useChatStore.getState().chats.find(c => c.id === chatId);
      expect(chat?.modelId).toBe('claude-3-opus');
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('creates chat if none active', async () => {
      const { sendMessage } = useChatStore.getState();

      const promise = sendMessage('Hello');

      // Fast-forward past initial delay
      await vi.advanceTimersByTimeAsync(1000);

      expect(useChatStore.getState().chats.length).toBeGreaterThan(0);
    });

    it('adds user message to chat', async () => {
      const { createChat, sendMessage } = useChatStore.getState();

      createChat();
      const promise = sendMessage('Hello');

      await vi.advanceTimersByTimeAsync(100);

      const state = useChatStore.getState();
      const chat = state.chats.find(c => c.id === state.activeChat);
      expect(chat?.messages[0].role).toBe('user');
      expect(chat?.messages[0].content).toBe('Hello');
    });

    it('updates chat title from first message', async () => {
      const { createChat, sendMessage } = useChatStore.getState();

      createChat();
      const promise = sendMessage('This is a very long first message that should be truncated');

      await vi.advanceTimersByTimeAsync(100);

      const state = useChatStore.getState();
      const chat = state.chats.find(c => c.id === state.activeChat);
      expect(chat?.title).toContain('This is a very long first');
      expect(chat?.title.endsWith('...')).toBe(true);
    });

    it('sets isTyping while processing', async () => {
      const { createChat, sendMessage } = useChatStore.getState();

      createChat();
      const promise = sendMessage('Hello');

      expect(useChatStore.getState().isTyping).toBe(true);
    });
  });

  describe('toggleSidebar', () => {
    it('toggles sidebar state', () => {
      const { toggleSidebar } = useChatStore.getState();

      expect(useChatStore.getState().sidebarOpen).toBe(true);
      toggleSidebar();
      expect(useChatStore.getState().sidebarOpen).toBe(false);
      toggleSidebar();
      expect(useChatStore.getState().sidebarOpen).toBe(true);
    });
  });

  describe('setSidebarOpen', () => {
    it('sets sidebar to specific state', () => {
      const { setSidebarOpen } = useChatStore.getState();

      setSidebarOpen(false);
      expect(useChatStore.getState().sidebarOpen).toBe(false);

      setSidebarOpen(true);
      expect(useChatStore.getState().sidebarOpen).toBe(true);
    });
  });
});
```

### 5.3 UI Component Tests (`src/components/ui/Button.test.tsx`)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  describe('rendering', () => {
    it('renders children correctly', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('renders with left icon', () => {
      render(
        <Button leftIcon={<span data-testid="left-icon">L</span>}>
          With Icon
        </Button>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders with right icon', () => {
      render(
        <Button rightIcon={<span data-testid="right-icon">R</span>}>
          With Icon
        </Button>
      );
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('applies primary variant styles by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-600');
    });

    it('applies secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-neutral-100');
    });

    it('applies ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
    });

    it('applies outline variant styles', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
    });

    it('applies danger variant styles', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600');
    });
  });

  describe('sizes', () => {
    it('applies small size', () => {
      render(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-8');
    });

    it('applies medium size by default', () => {
      render(<Button>Medium</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-10');
    });

    it('applies large size', () => {
      render(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-12');
    });
  });

  describe('states', () => {
    it('can be disabled', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows loading spinner when isLoading', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button.querySelector('svg.animate-spin')).toBeInTheDocument();
    });

    it('hides content when loading', () => {
      render(
        <Button isLoading leftIcon={<span data-testid="icon">I</span>}>
          Content
        </Button>
      );
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button disabled onClick={handleClick}>Click</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button isLoading onClick={handleClick}>Click</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('asChild', () => {
    it('renders as Slot when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByRole('link', { name: /link button/i });
      expect(link).toHaveAttribute('href', '/test');
    });
  });

  describe('accessibility', () => {
    it('has correct role', () => {
      render(<Button>Accessible</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      render(<Button aria-label="Close dialog">X</Button>);
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    });

    it('can be focused', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });
});
```

---

## 6. Integration Tests

### 6.1 Chat Functionality (`src/components/chat/ChatInput.test.tsx`)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from './ChatInput';
import { useChatStore } from '@/store/chatStore';

// Mock the store
vi.mock('@/store/chatStore', () => ({
  useChatStore: vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ChatInput', () => {
  const mockSendMessage = vi.fn();
  const mockStore = {
    sendMessage: mockSendMessage,
    isTyping: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useChatStore as any).mockReturnValue(mockStore);
  });

  describe('rendering', () => {
    it('renders textarea with placeholder', () => {
      render(<ChatInput />);
      expect(screen.getByPlaceholderText(/ส่งข้อความถึง RabbitAI/i)).toBeInTheDocument();
    });

    it('renders send button', () => {
      render(<ChatInput />);
      expect(screen.getByRole('button', { name: '' })).toBeInTheDocument(); // Send icon button
    });

    it('renders action buttons (attach, image, mic)', () => {
      render(<ChatInput />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(4); // attach, image, mic, send
    });
  });

  describe('message input', () => {
    it('updates value when typing', async () => {
      const user = userEvent.setup();
      render(<ChatInput />);

      const textarea = screen.getByPlaceholderText(/ส่งข้อความถึง RabbitAI/i);
      await user.type(textarea, 'Hello world');

      expect(textarea).toHaveValue('Hello world');
    });

    it('shows character count when typing', async () => {
      const user = userEvent.setup();
      render(<ChatInput />);

      const textarea = screen.getByPlaceholderText(/ส่งข้อความถึง RabbitAI/i);
      await user.type(textarea, 'Hello');

      await waitFor(() => {
        expect(screen.getByText(/5\/4,000/)).toBeInTheDocument();
      });
    });

    it('auto-focuses on mount', () => {
      render(<ChatInput />);
      const textarea = screen.getByPlaceholderText(/ส่งข้อความถึง RabbitAI/i);
      expect(textarea).toHaveFocus();
    });
  });

  describe('sending messages', () => {
    it('sends message on Enter key', async () => {
      const user = userEvent.setup();
      render(<ChatInput />);

      const textarea = screen.getByPlaceholderText(/ส่งข้อความถึง RabbitAI/i);
      await user.type(textarea, 'Hello{Enter}');

      expect(mockSendMessage).toHaveBeenCalledWith('Hello');
    });

    it('does not send on Shift+Enter (allows newline)', async () => {
      const user = userEvent.setup();
      render(<ChatInput />);

      const textarea = screen.getByPlaceholderText(/ส่งข้อความถึง RabbitAI/i);
      await user.type(textarea, 'Hello{Shift>}{Enter}{/Shift}world');

      expect(mockSendMessage).not.toHaveBeenCalled();
      expect(textarea).toHaveValue('Hello\nworld');
    });

    it('clears input after sending', async () => {
      const user = userEvent.setup();
      render(<ChatInput />);

      const textarea = screen.getByPlaceholderText(/ส่งข้อความถึง RabbitAI/i);
      await user.type(textarea, 'Hello{Enter}');

      expect(textarea).toHaveValue('');
    });

    it('trims whitespace before sending', async () => {
      const user = userEvent.setup();
      render(<ChatInput />);

      const textarea = screen.getByPlaceholderText(/ส่งข้อความถึง RabbitAI/i);
      await user.type(textarea, '  Hello  {Enter}');

      expect(mockSendMessage).toHaveBeenCalledWith('Hello');
    });

    it('does not send empty messages', async () => {
      const user = userEvent.setup();
      render(<ChatInput />);

      const textarea = screen.getByPlaceholderText(/ส่งข้อความถึง RabbitAI/i);
      await user.type(textarea, '   {Enter}');

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('uses custom onSend callback if provided', async () => {
      const user = userEvent.setup();
      const customOnSend = vi.fn();
      render(<ChatInput onSend={customOnSend} />);

      const textarea = screen.getByPlaceholderText(/ส่งข้อความถึง RabbitAI/i);
      await user.type(textarea, 'Hello{Enter}');

      expect(customOnSend).toHaveBeenCalledWith('Hello');
      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('typing state', () => {
    it('disables input when typing', () => {
      (useChatStore as any).mockReturnValue({ ...mockStore, isTyping: true });
      render(<ChatInput />);

      const textarea = screen.getByPlaceholderText(/ส่งข้อความถึง RabbitAI/i);
      expect(textarea).toBeDisabled();
    });

    it('shows stop button when typing', () => {
      (useChatStore as any).mockReturnValue({ ...mockStore, isTyping: true });
      render(<ChatInput />);

      // StopCircle icon should be visible
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('does not send when already typing', async () => {
      (useChatStore as any).mockReturnValue({ ...mockStore, isTyping: true });
      const user = userEvent.setup();
      render(<ChatInput />);

      const textarea = screen.getByPlaceholderText(/ส่งข้อความถึง RabbitAI/i);
      // Force enable for test
      (textarea as HTMLTextAreaElement).disabled = false;
      await user.type(textarea, 'Hello');

      // Try clicking send (should be disabled/hidden)
      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });
});
```

### 6.2 Auth Flow Integration Test

```typescript
// src/app/auth/__tests__/login.integration.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../login/page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('LoginPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('form validation', () => {
    it('requires email field', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i });
      await user.click(submitButton);

      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      expect(emailInput).toBeInvalid();
    });

    it('requires password field', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i });
      await user.click(submitButton);

      const passwordInput = screen.getByPlaceholderText(/ใส่รหัสผ่านของคุณ/i);
      expect(passwordInput).toBeInvalid();
    });
  });

  describe('password visibility toggle', () => {
    it('toggles password visibility', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordInput = screen.getByPlaceholderText(/ใส่รหัสผ่านของคุณ/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon
      await user.click(toggleButton);

      expect(passwordInput).toHaveAttribute('type', 'text');
    });
  });

  describe('form submission', () => {
    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByPlaceholderText(/you@example.com/i), 'test@example.com');
      await user.type(screen.getByPlaceholderText(/ใส่รหัสผ่านของคุณ/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i });
      await user.click(submitButton);

      // Button should show loading state
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('navigation links', () => {
    it('has link to signup page', () => {
      render(<LoginPage />);

      const signupLink = screen.getByRole('link', { name: /สมัครฟรี/i });
      expect(signupLink).toHaveAttribute('href', '/auth/signup');
    });

    it('has link to home page via logo', () => {
      render(<LoginPage />);

      const logoLinks = screen.getAllByRole('link');
      const homeLink = logoLinks.find(link => link.getAttribute('href') === '/');
      expect(homeLink).toBeInTheDocument();
    });
  });

  describe('social login buttons', () => {
    it('renders Google login button', () => {
      render(<LoginPage />);
      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
    });

    it('renders GitHub login button', () => {
      render(<LoginPage />);
      expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
    });
  });
});
```

---

## 7. E2E Tests (Playwright)

### 7.1 Auth Flow (`e2e/auth.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login');
    });

    test('displays login form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /ยินดีต้อนรับกลับ/i })).toBeVisible();
      await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
      await expect(page.getByPlaceholder(/ใส่รหัสผ่านของคุณ/i)).toBeVisible();
    });

    test('validates required fields', async ({ page }) => {
      await page.getByRole('button', { name: /เข้าสู่ระบบ/i }).click();

      // Browser validation should prevent submission
      const emailInput = page.getByPlaceholder(/you@example.com/i);
      await expect(emailInput).toBeFocused();
    });

    test('shows password when toggle clicked', async ({ page }) => {
      const passwordInput = page.getByPlaceholder(/ใส่รหัสผ่านของคุณ/i);
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click the eye icon (toggle button)
      await page.locator('button:has(svg)').filter({ has: page.locator('svg') }).last().click();

      await expect(passwordInput).toHaveAttribute('type', 'text');
    });

    test('navigates to signup page', async ({ page }) => {
      await page.getByRole('link', { name: /สมัครฟรี/i }).click();
      await expect(page).toHaveURL('/auth/signup');
    });

    test('shows loading state on submit', async ({ page }) => {
      await page.getByPlaceholder(/you@example.com/i).fill('test@example.com');
      await page.getByPlaceholder(/ใส่รหัสผ่านของคุณ/i).fill('password123');

      const submitButton = page.getByRole('button', { name: /เข้าสู่ระบบ/i });
      await submitButton.click();

      // Should show loading spinner
      await expect(submitButton.locator('svg.animate-spin')).toBeVisible();
    });
  });

  test.describe('Signup Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/signup');
    });

    test('displays signup form', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('navigates to login page', async ({ page }) => {
      await page.getByRole('link', { name: /เข้าสู่ระบบ/i }).click();
      await expect(page).toHaveURL('/auth/login');
    });
  });
});
```

### 7.2 Chat Flow (`e2e/chat.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat');
  });

  test.describe('Welcome Screen', () => {
    test('displays welcome message', async ({ page }) => {
      await expect(page.getByText(/วันนี้ให้ผมช่วยอะไรดีครับ/i)).toBeVisible();
    });

    test('shows suggestion cards', async ({ page }) => {
      await expect(page.getByText(/ช่วยเขียนโค้ด Python/i)).toBeVisible();
      await expect(page.getByText(/อธิบาย Quantum Computing/i)).toBeVisible();
    });

    test('displays model selector', async ({ page }) => {
      await expect(page.getByText(/GPT/i)).toBeVisible();
    });
  });

  test.describe('Sending Messages', () => {
    test('sends message via Enter key', async ({ page }) => {
      const input = page.getByPlaceholder(/ส่งข้อความถึง RabbitAI/i);

      await input.fill('Hello RabbitAI');
      await input.press('Enter');

      // Message should appear in chat
      await expect(page.getByText('Hello RabbitAI')).toBeVisible();
    });

    test('shows typing indicator after sending', async ({ page }) => {
      const input = page.getByPlaceholder(/ส่งข้อความถึง RabbitAI/i);

      await input.fill('Test message');
      await input.press('Enter');

      // Typing indicator should appear (3 animated dots)
      await expect(page.locator('.animate-pulse, [class*="animate"]')).toBeVisible({ timeout: 2000 });
    });

    test('receives AI response', async ({ page }) => {
      const input = page.getByPlaceholder(/ส่งข้อความถึง RabbitAI/i);

      await input.fill('สวัสดี');
      await input.press('Enter');

      // Wait for response
      await expect(page.getByText(/สวัสดีครับ/i)).toBeVisible({ timeout: 10000 });
    });

    test('clicking suggestion sends message', async ({ page }) => {
      await page.getByText(/ช่วยเขียนโค้ด Python/i).click();

      // Message should appear
      await expect(page.getByText(/ช่วยเขียนโค้ด Python/i)).toBeVisible();
    });
  });

  test.describe('Chat Input', () => {
    test('prevents sending empty messages', async ({ page }) => {
      const input = page.getByPlaceholder(/ส่งข้อความถึง RabbitAI/i);
      const sendButton = page.locator('button:has(svg)').last();

      await expect(sendButton).toBeDisabled();

      await input.fill('   ');
      await expect(sendButton).toBeDisabled();
    });

    test('allows multi-line input with Shift+Enter', async ({ page }) => {
      const input = page.getByPlaceholder(/ส่งข้อความถึง RabbitAI/i);

      await input.fill('Line 1');
      await input.press('Shift+Enter');
      await input.type('Line 2');

      const value = await input.inputValue();
      expect(value).toContain('\n');
    });

    test('shows character counter when typing', async ({ page }) => {
      const input = page.getByPlaceholder(/ส่งข้อความถึง RabbitAI/i);

      await input.fill('Hello');

      await expect(page.getByText(/5\/4,000/i)).toBeVisible();
    });
  });

  test.describe('Model Selection', () => {
    test('can change AI model', async ({ page }) => {
      // Click model selector
      await page.getByText(/GPT-3.5/i).click();

      // Select different model
      await page.getByText(/GPT-4/i).click();

      // Verify selection changed
      await expect(page.getByText(/GPT-4/i).first()).toBeVisible();
    });
  });
});
```

### 7.3 Payment Flow (`e2e/payment.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/payment');
  });

  test.describe('Payment Method Selection', () => {
    test('displays all payment options', async ({ page }) => {
      await expect(page.getByText(/บัตรเครดิต.*เดบิต/i)).toBeVisible();
      await expect(page.getByText(/Thai QR.*พร้อมเพย์/i)).toBeVisible();
      await expect(page.getByText(/โอนผ่านธนาคาร/i)).toBeVisible();
    });

    test('credit card is selected by default', async ({ page }) => {
      const cardOption = page.getByText(/บัตรเครดิต.*เดบิต/i).locator('..');
      await expect(cardOption).toHaveClass(/border-primary/);
    });

    test('can switch to PromptPay', async ({ page }) => {
      await page.getByText(/Thai QR.*พร้อมเพย์/i).click();

      // QR code should be visible
      await expect(page.getByText(/สแกน QR Code/i)).toBeVisible();
    });

    test('can switch to bank transfer', async ({ page }) => {
      await page.getByText(/โอนผ่านธนาคาร/i).click();

      // Bank selection should be visible
      await expect(page.getByText(/เลือกธนาคารของคุณ/i)).toBeVisible();
    });
  });

  test.describe('Credit Card Form', () => {
    test('displays card input fields', async ({ page }) => {
      await expect(page.getByPlaceholder(/1234 5678/i)).toBeVisible();
      await expect(page.getByPlaceholder(/MM\/YY/i)).toBeVisible();
      await expect(page.getByPlaceholder(/123/i)).toBeVisible();
    });

    test('formats card number with spaces', async ({ page }) => {
      const cardInput = page.getByPlaceholder(/1234 5678/i);
      await cardInput.fill('4242424242424242');

      await expect(cardInput).toHaveValue('4242 4242 4242 4242');
    });

    test('formats expiry date', async ({ page }) => {
      const expiryInput = page.getByPlaceholder(/MM\/YY/i);
      await expiryInput.fill('1225');

      await expect(expiryInput).toHaveValue('12/25');
    });

    test('shows card brand icon for Visa', async ({ page }) => {
      const cardInput = page.getByPlaceholder(/1234 5678/i);
      await cardInput.fill('4242');

      // Visa icon should appear
      await expect(page.locator('svg').filter({ has: page.locator('path[fill="white"]') })).toBeVisible();
    });

    test('validates card before enabling submit', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /ชำระเงิน/i });
      await expect(submitButton).toBeDisabled();

      // Fill valid card details
      await page.getByPlaceholder(/1234 5678/i).fill('4242424242424242');
      await page.getByPlaceholder(/MM\/YY/i).fill('1225');
      await page.getByPlaceholder(/123/i).fill('123');
      await page.getByPlaceholder(/SOMCHAI/i).fill('JOHN DOE');

      await expect(submitButton).toBeEnabled();
    });
  });

  test.describe('PromptPay QR', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByText(/Thai QR.*พร้อมเพย์/i).click();
    });

    test('displays QR code', async ({ page }) => {
      await expect(page.locator('div').filter({ hasText: /สแกน QR Code/i })).toBeVisible();
    });

    test('shows countdown timer', async ({ page }) => {
      await expect(page.getByText(/\d{2}:\d{2}/)).toBeVisible();
    });

    test('displays supported banks', async ({ page }) => {
      await expect(page.getByText(/รองรับทุกธนาคาร/i)).toBeVisible();
    });

    test('can refresh QR code', async ({ page }) => {
      await page.getByRole('button', { name: /รีเฟรช QR/i }).click();
      // Timer should reset
      await expect(page.getByText(/15:00/)).toBeVisible();
    });
  });

  test.describe('Order Summary', () => {
    test('displays plan details', async ({ page }) => {
      await expect(page.getByText(/แผน โปร/i)).toBeVisible();
      await expect(page.getByText(/฿299/)).toBeVisible();
    });

    test('shows features list', async ({ page }) => {
      await expect(page.getByText(/ข้อความไม่จำกัด/i)).toBeVisible();
    });
  });

  test.describe('Payment Success', () => {
    test('shows success message after payment', async ({ page }) => {
      // Fill card details
      await page.getByPlaceholder(/1234 5678/i).fill('4242424242424242');
      await page.getByPlaceholder(/MM\/YY/i).fill('1225');
      await page.getByPlaceholder(/123/i).fill('123');
      await page.getByPlaceholder(/SOMCHAI/i).fill('JOHN DOE');

      // Submit
      await page.getByRole('button', { name: /ชำระเงิน/i }).click();

      // Wait for success
      await expect(page.getByText(/ชำระเงินสำเร็จ/i)).toBeVisible({ timeout: 10000 });
    });
  });
});
```

---

## 8. Security Tests

### 8.1 Security Test Suite (`src/__tests__/security/security.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';

describe('Security Tests', () => {
  describe('XSS Prevention', () => {
    it('sanitizes user input in messages', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      // Test that the input is escaped or sanitized
      const sanitized = escapeHtml(maliciousInput);
      expect(sanitized).not.toContain('<script>');
    });

    it('prevents script injection in chat display', () => {
      const message = {
        content: '<img src=x onerror="alert(1)">',
        role: 'user' as const,
      };
      // Render should escape this
      expect(message.content).toContain('onerror');
      // In actual render, this should be escaped
    });

    it('escapes HTML entities in user names', () => {
      const name = '<script>evil()</script>';
      const initials = getInitials(name);
      expect(initials).not.toContain('<');
    });
  });

  describe('Input Validation', () => {
    it('rejects excessively long messages', () => {
      const longMessage = 'a'.repeat(10000);
      const maxLength = 4000;
      expect(longMessage.length).toBeGreaterThan(maxLength);
      // Input should be truncated or rejected
    });

    it('validates email format', () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.th'];
      const invalidEmails = ['notanemail', '@nodomain.com', 'no@', ''];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });

    it('sanitizes file upload names', () => {
      const maliciousName = '../../../etc/passwd';
      const sanitized = sanitizeFileName(maliciousName);
      expect(sanitized).not.toContain('..');
    });
  });

  describe('Authentication Checks', () => {
    it('rejects requests without valid session', () => {
      // Mock unauthenticated request
      const isAuthenticated = false;
      expect(isAuthenticated).toBe(false);
      // Should redirect or return 401
    });

    it('validates JWT token structure', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const invalidToken = 'not.a.valid.token';

      expect(isValidJWTStructure(validToken)).toBe(true);
      expect(isValidJWTStructure(invalidToken)).toBe(false);
    });

    it('prevents session fixation', () => {
      // Session ID should change after login
      const preLoginSession = 'session123';
      const postLoginSession = 'session456';
      expect(preLoginSession).not.toBe(postLoginSession);
    });
  });

  describe('Rate Limiting', () => {
    it('tracks request count per user', () => {
      const rateLimiter = createRateLimiter({ maxRequests: 100, windowMs: 60000 });

      for (let i = 0; i < 100; i++) {
        expect(rateLimiter.check('user1')).toBe(true);
      }

      expect(rateLimiter.check('user1')).toBe(false);
    });

    it('resets after time window', async () => {
      const rateLimiter = createRateLimiter({ maxRequests: 1, windowMs: 100 });

      expect(rateLimiter.check('user1')).toBe(true);
      expect(rateLimiter.check('user1')).toBe(false);

      await new Promise(r => setTimeout(r, 150));

      expect(rateLimiter.check('user1')).toBe(true);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('parameterizes database queries', () => {
      const userInput = "'; DROP TABLE users; --";
      const parameterized = createParameterizedQuery('SELECT * FROM users WHERE id = $1', [userInput]);

      expect(parameterized.text).not.toContain('DROP TABLE');
      expect(parameterized.values).toContain(userInput);
    });
  });

  describe('CSRF Protection', () => {
    it('validates CSRF token on state-changing requests', () => {
      const validToken = 'abc123';
      const sessionToken = 'abc123';

      expect(validateCSRFToken(validToken, sessionToken)).toBe(true);
      expect(validateCSRFToken('invalid', sessionToken)).toBe(false);
    });
  });
});

// Helper functions (would be in actual implementation)
function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (match) => {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return escapeMap[match];
  });
}

function getInitials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().substring(0, 2);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_');
}

function isValidJWTStructure(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3 && parts.every(p => p.length > 0);
}

function createRateLimiter(options: { maxRequests: number; windowMs: number }) {
  const requests = new Map<string, { count: number; timestamp: number }>();

  return {
    check(userId: string): boolean {
      const now = Date.now();
      const userRequests = requests.get(userId);

      if (!userRequests || now - userRequests.timestamp > options.windowMs) {
        requests.set(userId, { count: 1, timestamp: now });
        return true;
      }

      if (userRequests.count >= options.maxRequests) {
        return false;
      }

      userRequests.count++;
      return true;
    },
  };
}

function createParameterizedQuery(text: string, values: any[]) {
  return { text, values };
}

function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken;
}
```

---

## 9. Performance Tests

### 9.1 Load Testing with k6 (`performance/load-test.js`)

```javascript
// Install: npm install -g k6
// Run: k6 run performance/load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const chatLatency = new Trend('chat_latency');

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 100 }, // Spike to 100 users
    { duration: '1m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    errors: ['rate<0.1'],              // Error rate under 10%
    chat_latency: ['p(95)<3000'],      // Chat responses under 3s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test 1: Homepage load
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads quickly': (r) => r.timings.duration < 1000,
  });

  // Test 2: Chat page load
  const chatRes = http.get(`${BASE_URL}/chat`);
  check(chatRes, {
    'chat page status is 200': (r) => r.status === 200,
  });

  // Test 3: Simulate sending a message (mock API)
  const startTime = Date.now();
  const messageRes = http.post(
    `${BASE_URL}/api/chat`,
    JSON.stringify({
      message: 'Hello, this is a test message',
      modelId: 'gpt-3.5',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  const latency = Date.now() - startTime;
  chatLatency.add(latency);

  const messageSuccess = check(messageRes, {
    'message sent successfully': (r) => r.status === 200 || r.status === 201,
  });

  if (!messageSuccess) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  // Test 4: Pricing page
  const pricingRes = http.get(`${BASE_URL}/pricing`);
  check(pricingRes, {
    'pricing page loads': (r) => r.status === 200,
  });

  sleep(1); // Think time between iterations
}

export function handleSummary(data) {
  return {
    'performance/summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  // Simplified text summary
  return `
Performance Test Results:
========================
Total Requests: ${data.metrics.http_reqs.values.count}
Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
p95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
Error Rate: ${(data.metrics.errors?.values?.rate * 100 || 0).toFixed(2)}%
Chat Latency (p95): ${data.metrics.chat_latency?.values['p(95)']?.toFixed(2) || 'N/A'}ms
  `;
}
```

### 9.2 Component Performance Tests

```typescript
// src/__tests__/performance/components.perf.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChatStore } from '@/store/chatStore';

// Mock dependencies
vi.mock('@/store/chatStore');
vi.mock('framer-motion', () => ({
  motion: { div: 'div', button: 'button', span: 'span' },
  AnimatePresence: ({ children }: any) => children,
}));

describe('Component Performance', () => {
  it('renders ChatWindow with 100 messages in under 100ms', () => {
    const messages = Array.from({ length: 100 }, (_, i) => ({
      id: `msg-${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Test message ${i}`,
      timestamp: new Date(),
    }));

    (useChatStore as any).mockReturnValue({
      chats: [{ id: '1', messages }],
      activeChat: '1',
      isTyping: false,
      selectedModel: 'gpt-3.5',
    });

    const startTime = performance.now();
    render(<ChatWindow />);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(100);
  });

  it('renders 1000 messages with virtualization', () => {
    const messages = Array.from({ length: 1000 }, (_, i) => ({
      id: `msg-${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Test message ${i}`,
      timestamp: new Date(),
    }));

    (useChatStore as any).mockReturnValue({
      chats: [{ id: '1', messages }],
      activeChat: '1',
      isTyping: false,
      selectedModel: 'gpt-3.5',
    });

    const startTime = performance.now();
    render(<ChatWindow />);
    const endTime = performance.now();

    // Should still be fast with virtualization
    expect(endTime - startTime).toBeLessThan(500);
  });
});
```

---

## 10. CI/CD Integration

### GitHub Actions Workflow (`.github/workflows/test.yml`)

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  CI: true
  NODE_ENV: test

jobs:
  unit-tests:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run type-check

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: unit-tests

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e -- --project=chromium

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  performance-test:
    name: Performance Tests
    runs-on: ubuntu-latest
    needs: [unit-tests, e2e-tests]
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Start server
        run: npm start &

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run k6 load test
        uses: grafana/k6-action@v0.3.1
        with:
          filename: performance/load-test.js
```

### Package.json Scripts Update

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:unit": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:all": "npm run test:unit && npm run test:e2e"
  }
}
```

---

## 11. Coverage Targets

| Category | Target | Priority |
|----------|--------|----------|
| **Statements** | 80% | P1 |
| **Branches** | 75% | P1 |
| **Functions** | 80% | P1 |
| **Lines** | 80% | P1 |

### Per-Module Targets

| Module | Statement | Branch | Function |
|--------|-----------|--------|----------|
| `lib/utils.ts` | 95% | 90% | 95% |
| `store/chatStore.ts` | 90% | 85% | 90% |
| `components/ui/*` | 85% | 80% | 85% |
| `components/chat/*` | 85% | 80% | 85% |
| `app/auth/*` | 90% | 85% | 90% |
| `app/payment/*` | 90% | 85% | 90% |

---

## 12. Test Data Management

### Fixtures Structure

```typescript
// src/__tests__/fixtures/users.ts
export const testUsers = {
  free: {
    id: 'user-free-001',
    email: 'free@test.com',
    plan: 'free',
    name: 'Free User',
  },
  pro: {
    id: 'user-pro-001',
    email: 'pro@test.com',
    plan: 'pro',
    name: 'Pro User',
  },
  enterprise: {
    id: 'user-ent-001',
    email: 'enterprise@test.com',
    plan: 'enterprise',
    name: 'Enterprise User',
  },
};

// src/__tests__/fixtures/chats.ts
export const testChats = {
  empty: {
    id: 'chat-empty',
    title: 'Empty Chat',
    messages: [],
    modelId: 'gpt-3.5',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  withMessages: {
    id: 'chat-with-messages',
    title: 'Chat with Messages',
    messages: [
      { id: 'msg-1', role: 'user', content: 'Hello', timestamp: new Date() },
      { id: 'msg-2', role: 'assistant', content: 'Hi there!', timestamp: new Date() },
    ],
    modelId: 'gpt-4',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};
```

---

## 13. Summary & Recommendations

### Immediate Actions (Week 1)

1. Install testing dependencies (Vitest, Playwright, Testing Library)
2. Set up configuration files
3. Write tests for `lib/utils.ts` (high value, easy to test)
4. Write tests for `chatStore.ts`

### Short-term (Weeks 2-3)

1. Add component tests for UI components
2. Set up E2E tests for critical paths (auth, chat)
3. Configure CI/CD pipeline

### Medium-term (Weeks 4-6)

1. Add payment flow E2E tests
2. Implement security test suite
3. Set up performance testing
4. Reach 80% coverage target

### Best Practices

1. **Test Naming**: Use descriptive names that explain the behavior
2. **AAA Pattern**: Arrange, Act, Assert in every test
3. **Isolation**: Each test should be independent
4. **Speed**: Unit tests < 100ms, Integration < 1s
5. **Determinism**: No flaky tests; use proper async handling

---

*Document Version: 1.0*
*Last Updated: 2024*
*Author: Tester Agent*
