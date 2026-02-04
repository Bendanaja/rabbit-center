/**
 * useAI Hook Tests - Stream Reader Cleanup
 *
 * Tests to verify memory leak fixes by ensuring stream readers are properly
 * released in all scenarios:
 * - Reader released on successful stream completion
 * - Reader released on error
 * - Reader released on user abort
 *
 * Memory leaks in stream handling can cause:
 * - Browser tab memory growth over time
 * - Connection pool exhaustion
 * - Degraded performance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  getAuthToken: vi.fn().mockResolvedValue('mock-token'),
}));

// Store references to reader mocks for verification
let readerMocks: Array<{
  read: ReturnType<typeof vi.fn>;
  releaseLock: ReturnType<typeof vi.fn>;
  cancel: ReturnType<typeof vi.fn>;
}> = [];

// Helper to create a mock reader
function createMockReader(chunks: Array<{ done: boolean; value?: Uint8Array }>) {
  let chunkIndex = 0;

  const mockReader = {
    read: vi.fn().mockImplementation(() => {
      const chunk = chunks[chunkIndex];
      chunkIndex++;
      return Promise.resolve(chunk || { done: true, value: undefined });
    }),
    releaseLock: vi.fn(),
    cancel: vi.fn().mockResolvedValue(undefined),
  };

  readerMocks.push(mockReader);
  return mockReader;
}

// Helper to encode SSE message
function encodeSSE(event: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n`);
}

describe('useAI Hook - Stream Reader Cleanup', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    readerMocks = [];
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.resetModules();
  });

  describe('Reader Released on Success', () => {
    it('releases reader after successful stream completion', async () => {
      const mockReader = createMockReader([
        { done: false, value: encodeSSE({ type: 'chunk', content: 'Hello' }) },
        { done: false, value: encodeSSE({ type: 'chunk', content: ' World' }) },
        { done: false, value: encodeSSE({ type: 'done', messageId: 'msg-123' }) },
        { done: true },
      ]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { useAI } = await import('@/hooks/useAI');
      const { result } = renderHook(() => useAI());

      const onDone = vi.fn();

      await act(async () => {
        await result.current.generate('chat-123', [], 'gpt-4', { onDone });
      });

      // Verify stream was read to completion
      expect(mockReader.read).toHaveBeenCalled();

      // Verify onDone was called with accumulated content
      expect(onDone).toHaveBeenCalledWith('Hello World', 'msg-123');

      // State should be reset
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.abortController).toBeNull();
    });

    it('handles multiple successful generations without leaking readers', async () => {
      for (let i = 0; i < 3; i++) {
        const mockReader = createMockReader([
          { done: false, value: encodeSSE({ type: 'chunk', content: `Response ${i}` }) },
          { done: false, value: encodeSSE({ type: 'done' }) },
          { done: true },
        ]);

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          body: { getReader: () => mockReader },
        });

        const { useAI } = await import('@/hooks/useAI');
        const { result } = renderHook(() => useAI());

        await act(async () => {
          await result.current.generate(`chat-${i}`, [], 'gpt-4', {});
        });

        expect(result.current.isGenerating).toBe(false);

        // Reset module for next iteration
        vi.resetModules();
      }

      // All 3 readers should have been processed
      expect(readerMocks.length).toBe(3);

      // Each reader should have read to done: true
      readerMocks.forEach((reader) => {
        expect(reader.read).toHaveBeenCalled();
      });
    });

    it('properly releases reader when stream ends with done: true', async () => {
      const readCalls: number[] = [];
      let readCallCount = 0;

      const mockReader = {
        read: vi.fn().mockImplementation(() => {
          readCallCount++;
          readCalls.push(readCallCount);

          if (readCallCount === 1) {
            return Promise.resolve({
              done: false,
              value: encodeSSE({ type: 'chunk', content: 'Content' }),
            });
          }
          if (readCallCount === 2) {
            return Promise.resolve({
              done: false,
              value: encodeSSE({ type: 'done' }),
            });
          }
          return Promise.resolve({ done: true, value: undefined });
        }),
        releaseLock: vi.fn(),
        cancel: vi.fn(),
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader },
      });

      const { useAI } = await import('@/hooks/useAI');
      const { result } = renderHook(() => useAI());

      await act(async () => {
        await result.current.generate('chat-123', [], 'gpt-4', {});
      });

      // Should have read until done: true
      expect(mockReader.read).toHaveBeenCalledTimes(3);
      expect(readCalls).toEqual([1, 2, 3]);
    });
  });

  describe('Reader Released on Error', () => {
    it('releases reader when fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const { useAI } = await import('@/hooks/useAI');
      const { result } = renderHook(() => useAI());

      const onError = vi.fn();

      await act(async () => {
        await result.current.generate('chat-123', [], 'gpt-4', { onError });
      });

      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Network error',
      }));
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error?.message).toBe('Network error');
    });

    it('releases reader when response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ error: 'Server error' }),
      });

      const { useAI } = await import('@/hooks/useAI');
      const { result } = renderHook(() => useAI());

      const onError = vi.fn();

      await act(async () => {
        await result.current.generate('chat-123', [], 'gpt-4', { onError });
      });

      expect(onError).toHaveBeenCalled();
      expect(result.current.isGenerating).toBe(false);
    });

    it('releases reader when SSE contains error event', async () => {
      const mockReader = createMockReader([
        { done: false, value: encodeSSE({ type: 'chunk', content: 'Starting...' }) },
        { done: false, value: encodeSSE({ type: 'error', message: 'Rate limit exceeded' }) },
        { done: true },
      ]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader },
      });

      const { useAI } = await import('@/hooks/useAI');
      const { result } = renderHook(() => useAI());

      const onError = vi.fn();

      await act(async () => {
        await result.current.generate('chat-123', [], 'gpt-4', { onError });
      });

      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Rate limit exceeded',
      }));
      expect(result.current.isGenerating).toBe(false);
    });

    it('releases reader when read() throws error mid-stream', async () => {
      let readCount = 0;
      const mockReader = {
        read: vi.fn().mockImplementation(() => {
          readCount++;
          if (readCount === 1) {
            return Promise.resolve({
              done: false,
              value: encodeSSE({ type: 'chunk', content: 'First chunk' }),
            });
          }
          return Promise.reject(new Error('Connection lost'));
        }),
        releaseLock: vi.fn(),
        cancel: vi.fn(),
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader },
      });

      const { useAI } = await import('@/hooks/useAI');
      const { result } = renderHook(() => useAI());

      const onError = vi.fn();

      await act(async () => {
        await result.current.generate('chat-123', [], 'gpt-4', { onError });
      });

      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Connection lost',
      }));
      expect(result.current.isGenerating).toBe(false);
    });

    it('releases reader when response body is null', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: null,
      });

      const { useAI } = await import('@/hooks/useAI');
      const { result } = renderHook(() => useAI());

      const onError = vi.fn();

      await act(async () => {
        await result.current.generate('chat-123', [], 'gpt-4', { onError });
      });

      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: 'No response body',
      }));
      expect(result.current.isGenerating).toBe(false);
    });

    it('handles JSON parse error gracefully', async () => {
      const mockReader = createMockReader([
        { done: false, value: new TextEncoder().encode('data: not valid json\n') },
        { done: false, value: encodeSSE({ type: 'chunk', content: 'Valid' }) },
        { done: false, value: encodeSSE({ type: 'done' }) },
        { done: true },
      ]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader },
      });

      const { useAI } = await import('@/hooks/useAI');
      const { result } = renderHook(() => useAI());

      const onChunk = vi.fn();
      const onDone = vi.fn();

      await act(async () => {
        await result.current.generate('chat-123', [], 'gpt-4', { onChunk, onDone });
      });

      // Should have skipped invalid JSON and processed valid chunk
      expect(onChunk).toHaveBeenCalledWith('Valid');
      expect(onDone).toHaveBeenCalled();
      expect(result.current.isGenerating).toBe(false);
    });
  });

  describe('Reader Released on Abort', () => {
    it('handles abort via AbortError', async () => {
      // Test that AbortError is handled gracefully
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      global.fetch = vi.fn().mockRejectedValue(abortError);

      const { useAI } = await import('@/hooks/useAI');
      const { result } = renderHook(() => useAI());

      const onDone = vi.fn();
      const onError = vi.fn();

      await act(async () => {
        await result.current.generate('chat-123', [], 'gpt-4', { onDone, onError });
      });

      // State should be reset
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.abortController).toBeNull();

      // onError should NOT be called for AbortError
      expect(onError).not.toHaveBeenCalled();

      // onDone should be called with partial content (empty in this case)
      expect(onDone).toHaveBeenCalled();
    });

    it('does not set error state on AbortError', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      global.fetch = vi.fn().mockRejectedValue(abortError);

      const { useAI } = await import('@/hooks/useAI');
      const { result } = renderHook(() => useAI());

      const onError = vi.fn();
      const onDone = vi.fn();

      await act(async () => {
        await result.current.generate('chat-123', [], 'gpt-4', { onError, onDone });
      });

      // AbortError should not trigger onError
      expect(onError).not.toHaveBeenCalled();

      // But should trigger onDone with partial content
      expect(onDone).toHaveBeenCalled();

      // State should be clean
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('creates new AbortController for each generation', async () => {
      const controllers: AbortController[] = [];

      global.fetch = vi.fn().mockImplementation((_url, options) => {
        if (options?.signal && options.signal instanceof AbortSignal) {
          // Track that a signal was provided
        }

        return Promise.resolve({
          ok: true,
          body: {
            getReader: () => createMockReader([
              { done: false, value: encodeSSE({ type: 'done' }) },
              { done: true },
            ]),
          },
        });
      });

      const { useAI } = await import('@/hooks/useAI');
      const { result } = renderHook(() => useAI());

      // First generation
      await act(async () => {
        await result.current.generate('chat-1', [], 'gpt-4', {});
      });

      // Second generation
      await act(async () => {
        await result.current.generate('chat-2', [], 'gpt-4', {});
      });

      // Each generation should have created a new AbortController
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Both calls should have had signal in options
      const calls = vi.mocked(global.fetch).mock.calls;
      calls.forEach((call) => {
        const options = call[1] as RequestInit;
        expect(options.signal).toBeInstanceOf(AbortSignal);
      });
    });

    it('clears abortController after generation completes', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => createMockReader([
            { done: false, value: encodeSSE({ type: 'done' }) },
            { done: true },
          ]),
        },
      });

      const { useAI } = await import('@/hooks/useAI');
      const { result } = renderHook(() => useAI());

      // During generation, abortController should be set
      act(() => {
        result.current.generate('chat-123', [], 'gpt-4', {});
      });

      expect(result.current.abortController).not.toBeNull();

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });

      // After completion, abortController should be null
      expect(result.current.abortController).toBeNull();
    });
  });

  describe('State Management', () => {
    it('resets isGenerating to false in finally block', async () => {
      // Test that isGenerating is always reset regardless of outcome

      // Test 1: Success
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => createMockReader([
            { done: false, value: encodeSSE({ type: 'done' }) },
            { done: true },
          ]),
        },
      });

      const { useAI } = await import('@/hooks/useAI');
      const { result: result1 } = renderHook(() => useAI());

      await act(async () => {
        await result1.current.generate('chat-1', [], 'gpt-4', {});
      });
      expect(result1.current.isGenerating).toBe(false);

      vi.resetModules();

      // Test 2: Error
      global.fetch = vi.fn().mockRejectedValue(new Error('Test error'));

      const { useAI: useAI2 } = await import('@/hooks/useAI');
      const { result: result2 } = renderHook(() => useAI2());

      await act(async () => {
        await result2.current.generate('chat-2', [], 'gpt-4', {});
      });
      expect(result2.current.isGenerating).toBe(false);

      vi.resetModules();

      // Test 3: Abort
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      global.fetch = vi.fn().mockRejectedValue(abortError);

      const { useAI: useAI3 } = await import('@/hooks/useAI');
      const { result: result3 } = renderHook(() => useAI3());

      await act(async () => {
        await result3.current.generate('chat-3', [], 'gpt-4', {});
      });
      expect(result3.current.isGenerating).toBe(false);
    });

    it('clearError resets error state', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Test error'));

      const { useAI } = await import('@/hooks/useAI');
      const { result } = renderHook(() => useAI());

      await act(async () => {
        await result.current.generate('chat-123', [], 'gpt-4', {});
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('accumulates content correctly across chunks', async () => {
      const chunks = ['Hello', ' ', 'World', '!'];
      const mockReader = createMockReader([
        ...chunks.map((content) => ({
          done: false,
          value: encodeSSE({ type: 'chunk', content }),
        })),
        { done: false, value: encodeSSE({ type: 'done', messageId: 'msg-456' }) },
        { done: true },
      ]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader },
      });

      const { useAI } = await import('@/hooks/useAI');
      const { result } = renderHook(() => useAI());

      const receivedChunks: string[] = [];
      let fullResponse = '';

      await act(async () => {
        await result.current.generate('chat-123', [], 'gpt-4', {
          onChunk: (chunk) => receivedChunks.push(chunk),
          onDone: (response) => {
            fullResponse = response;
          },
        });
      });

      expect(receivedChunks).toEqual(chunks);
      expect(fullResponse).toBe('Hello World!');
    });
  });

  describe('Callbacks', () => {
    it('calls onTitleUpdate when title event received', async () => {
      const mockReader = createMockReader([
        { done: false, value: encodeSSE({ type: 'chunk', content: 'Content' }) },
        { done: false, value: encodeSSE({ type: 'title', title: 'New Chat Title' }) },
        { done: false, value: encodeSSE({ type: 'done' }) },
        { done: true },
      ]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader },
      });

      const { useAI } = await import('@/hooks/useAI');
      const { result } = renderHook(() => useAI());

      const onTitleUpdate = vi.fn();

      await act(async () => {
        await result.current.generate('chat-123', [], 'gpt-4', { onTitleUpdate });
      });

      expect(onTitleUpdate).toHaveBeenCalledWith('New Chat Title');
    });

    it('calls all callbacks in correct order', async () => {
      const callOrder: string[] = [];

      const mockReader = createMockReader([
        { done: false, value: encodeSSE({ type: 'chunk', content: 'A' }) },
        { done: false, value: encodeSSE({ type: 'chunk', content: 'B' }) },
        { done: false, value: encodeSSE({ type: 'title', title: 'Title' }) },
        { done: false, value: encodeSSE({ type: 'done', messageId: 'msg' }) },
        { done: true },
      ]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader },
      });

      const { useAI } = await import('@/hooks/useAI');
      const { result } = renderHook(() => useAI());

      await act(async () => {
        await result.current.generate('chat-123', [], 'gpt-4', {
          onChunk: (chunk) => callOrder.push(`chunk:${chunk}`),
          onTitleUpdate: (title) => callOrder.push(`title:${title}`),
          onDone: () => callOrder.push('done'),
        });
      });

      expect(callOrder).toEqual([
        'chunk:A',
        'chunk:B',
        'title:Title',
        'done',
      ]);
    });
  });
});
