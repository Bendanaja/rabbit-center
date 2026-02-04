import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Custom providers wrapper
const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
    </>
  );
};

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...options }),
  };
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test utilities
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

export const createMockMessage = (overrides = {}) => ({
  id: `msg-${Math.random().toString(36).slice(2)}`,
  role: 'user' as const,
  content: 'Test message',
  timestamp: new Date(),
  ...overrides,
});

export const createMockChat = (overrides = {}) => ({
  id: `chat-${Math.random().toString(36).slice(2)}`,
  title: 'Test Chat',
  messages: [],
  modelId: 'gpt-3.5' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
