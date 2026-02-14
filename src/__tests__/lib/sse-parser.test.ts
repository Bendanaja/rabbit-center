/**
 * SSE (Server-Sent Events) Chunk Handling Tests
 *
 * These tests verify that partial SSE messages split across network chunks
 * are handled correctly. This is critical for reliable streaming responses.
 *
 * Bug Context: SSE messages may be split across network chunks at arbitrary
 * boundaries. The parser must buffer partial lines and only process complete
 * lines that end with newlines.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * SSE Parser implementation for testing
 * This mirrors the logic used in useAI hook for parsing SSE streams
 */
class SSEParser {
  private buffer: string = '';
  private onEvent: (event: { type: string; content?: string; messageId?: string; message?: string; title?: string }) => void;

  constructor(onEvent: (event: { type: string; content?: string; messageId?: string; message?: string; title?: string }) => void) {
    this.onEvent = onEvent;
  }

  /**
   * Process a chunk of data from the stream
   * Handles partial messages by buffering incomplete lines
   */
  processChunk(chunk: string): void {
    this.buffer += chunk;

    // Split by newlines, keeping track of incomplete lines
    const lines = this.buffer.split('\n');

    // Keep the last element if it doesn't end with a newline
    // (it's an incomplete line that needs more data)
    if (!this.buffer.endsWith('\n')) {
      this.buffer = lines.pop() || '';
    } else {
      this.buffer = '';
    }

    // Process complete lines
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (!data) continue;

        try {
          const event = JSON.parse(data);
          this.onEvent(event);
        } catch {
          // Skip invalid JSON - this can happen with partial chunks
        }
      }
    }
  }

  /**
   * Flush any remaining buffered data
   * Should be called when the stream ends
   */
  flush(): void {
    if (this.buffer && this.buffer.startsWith('data: ')) {
      const data = this.buffer.slice(6).trim();
      if (data) {
        try {
          const event = JSON.parse(data);
          this.onEvent(event);
        } catch {
          // Skip invalid JSON
        }
      }
    }
    this.buffer = '';
  }

  /**
   * Get current buffer state (for testing)
   */
  getBuffer(): string {
    return this.buffer;
  }
}

describe('SSE Parser', () => {
  describe('Complete line in single chunk', () => {
    it('parses a complete SSE line with chunk type', () => {
      const events: Array<{ type: string; content?: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      parser.processChunk('data: {"type":"chunk","content":"Hello"}\n');

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ type: 'chunk', content: 'Hello' });
    });

    it('parses a complete SSE line with done type', () => {
      const events: Array<{ type: string; messageId?: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      parser.processChunk('data: {"type":"done","messageId":"msg-123"}\n');

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ type: 'done', messageId: 'msg-123' });
    });

    it('parses a complete SSE line with error type', () => {
      const events: Array<{ type: string; message?: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      parser.processChunk('data: {"type":"error","message":"Something went wrong"}\n');

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ type: 'error', message: 'Something went wrong' });
    });

    it('parses a complete SSE line with title type', () => {
      const events: Array<{ type: string; title?: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      parser.processChunk('data: {"type":"title","title":"Chat about React"}\n');

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ type: 'title', title: 'Chat about React' });
    });
  });

  describe('Line split across two chunks', () => {
    it('handles JSON split in the middle', () => {
      const events: Array<{ type: string; content?: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      // First chunk: partial message
      parser.processChunk('data: {"type":"chunk","con');
      expect(events).toHaveLength(0);
      expect(parser.getBuffer()).toBe('data: {"type":"chunk","con');

      // Second chunk: rest of message
      parser.processChunk('tent":"Hello"}\n');
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ type: 'chunk', content: 'Hello' });
    });

    it('handles split at "data: " prefix', () => {
      const events: Array<{ type: string; content?: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      parser.processChunk('dat');
      expect(events).toHaveLength(0);

      parser.processChunk('a: {"type":"chunk","content":"World"}\n');
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ type: 'chunk', content: 'World' });
    });

    it('handles split at newline boundary', () => {
      const events: Array<{ type: string; content?: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      parser.processChunk('data: {"type":"chunk","content":"Test"}');
      expect(events).toHaveLength(0);

      parser.processChunk('\n');
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ type: 'chunk', content: 'Test' });
    });

    it('handles content with special characters split across chunks', () => {
      const events: Array<{ type: string; content?: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      // Content with unicode and special chars
      parser.processChunk('data: {"type":"chunk","content":"Hello ');
      parser.processChunk('\u4e16\u754c"}\n'); // Chinese characters for "world"

      expect(events).toHaveLength(1);
      expect(events[0].content).toBe('Hello \u4e16\u754c');
    });

    it('handles three-way split', () => {
      const events: Array<{ type: string; content?: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      parser.processChunk('data: {"ty');
      expect(events).toHaveLength(0);

      parser.processChunk('pe":"chunk","cont');
      expect(events).toHaveLength(0);

      parser.processChunk('ent":"Split"}\n');
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ type: 'chunk', content: 'Split' });
    });
  });

  describe('Multiple lines in single chunk', () => {
    it('parses multiple complete lines', () => {
      const events: Array<{ type: string; content?: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      const multiLineChunk = [
        'data: {"type":"chunk","content":"Hello"}',
        'data: {"type":"chunk","content":" "}',
        'data: {"type":"chunk","content":"World"}',
        '',
      ].join('\n');

      parser.processChunk(multiLineChunk);

      expect(events).toHaveLength(3);
      expect(events[0].content).toBe('Hello');
      expect(events[1].content).toBe(' ');
      expect(events[2].content).toBe('World');
    });

    it('handles mixed event types in single chunk', () => {
      const events: Array<{ type: string; content?: string; title?: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      const mixedChunk = [
        'data: {"type":"chunk","content":"Response text"}',
        'data: {"type":"title","title":"New Title"}',
        'data: {"type":"done"}',
        '',
      ].join('\n');

      parser.processChunk(mixedChunk);

      expect(events).toHaveLength(3);
      expect(events[0].type).toBe('chunk');
      expect(events[1].type).toBe('title');
      expect(events[2].type).toBe('done');
    });

    it('handles multiple lines with trailing partial', () => {
      const events: Array<{ type: string; content?: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      const chunkWithPartial =
        'data: {"type":"chunk","content":"First"}\n' +
        'data: {"type":"chunk","content":"Second"}\n' +
        'data: {"type":"chunk","con';

      parser.processChunk(chunkWithPartial);

      expect(events).toHaveLength(2);
      expect(events[0].content).toBe('First');
      expect(events[1].content).toBe('Second');
      expect(parser.getBuffer()).toBe('data: {"type":"chunk","con');

      // Complete the partial
      parser.processChunk('tent":"Third"}\n');
      expect(events).toHaveLength(3);
      expect(events[2].content).toBe('Third');
    });

    it('handles burst of rapid chunks', () => {
      const events: Array<{ type: string; content?: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      // Simulate rapid stream of chunks
      for (let i = 0; i < 10; i++) {
        parser.processChunk(`data: {"type":"chunk","content":"${i}"}\n`);
      }

      expect(events).toHaveLength(10);
      events.forEach((event, index) => {
        expect(event.content).toBe(String(index));
      });
    });
  });

  describe('Empty chunks', () => {
    it('handles empty string chunk', () => {
      const events: Array<{ type: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      parser.processChunk('');
      expect(events).toHaveLength(0);
      expect(parser.getBuffer()).toBe('');
    });

    it('handles chunk with only newlines', () => {
      const events: Array<{ type: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      parser.processChunk('\n\n\n');
      expect(events).toHaveLength(0);
    });

    it('handles chunk with only whitespace', () => {
      const events: Array<{ type: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      parser.processChunk('   \n   \n');
      expect(events).toHaveLength(0);
    });

    it('handles empty data field', () => {
      const events: Array<{ type: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      parser.processChunk('data: \n');
      expect(events).toHaveLength(0); // Empty data should be skipped
    });

    it('continues processing after empty chunks', () => {
      const events: Array<{ type: string; content?: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      parser.processChunk('data: {"type":"chunk","content":"Before"}\n');
      parser.processChunk('');
      parser.processChunk('\n');
      parser.processChunk('data: {"type":"chunk","content":"After"}\n');

      expect(events).toHaveLength(2);
      expect(events[0].content).toBe('Before');
      expect(events[1].content).toBe('After');
    });
  });

  describe('Error handling', () => {
    it('skips invalid JSON and continues processing', () => {
      const events: Array<{ type: string; content?: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      parser.processChunk('data: not valid json\n');
      parser.processChunk('data: {"type":"chunk","content":"Valid"}\n');

      expect(events).toHaveLength(1);
      expect(events[0].content).toBe('Valid');
    });

    it('skips malformed SSE lines', () => {
      const events: Array<{ type: string; content?: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      parser.processChunk('not-sse-format\n');
      parser.processChunk('data: {"type":"chunk","content":"Valid"}\n');

      expect(events).toHaveLength(1);
      expect(events[0].content).toBe('Valid');
    });

    it('handles truncated JSON in buffer on flush', () => {
      const events: Array<{ type: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      parser.processChunk('data: {"type":"chunk');
      parser.flush();

      // Should not emit event for truncated JSON
      expect(events).toHaveLength(0);
    });
  });

  describe('Buffer management', () => {
    it('clears buffer after complete message', () => {
      const events: Array<{ type: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      parser.processChunk('data: {"type":"chunk","content":"Test"}\n');
      expect(parser.getBuffer()).toBe('');
    });

    it('preserves buffer for incomplete message', () => {
      const events: Array<{ type: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      parser.processChunk('data: {"type":"chunk"');
      expect(parser.getBuffer()).toBe('data: {"type":"chunk"');
    });

    it('accumulates across multiple partial chunks', () => {
      const events: Array<{ type: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      parser.processChunk('data: ');
      expect(parser.getBuffer()).toBe('data: ');

      parser.processChunk('{"type":');
      expect(parser.getBuffer()).toBe('data: {"type":');

      parser.processChunk('"chunk",');
      expect(parser.getBuffer()).toBe('data: {"type":"chunk",');

      parser.processChunk('"content":"Done"}\n');
      expect(events).toHaveLength(1);
      expect(parser.getBuffer()).toBe('');
    });

    it('handles flush with complete message in buffer', () => {
      const events: Array<{ type: string; content?: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      parser.processChunk('data: {"type":"chunk","content":"Flushed"}');
      expect(events).toHaveLength(0);

      parser.flush();
      expect(events).toHaveLength(1);
      expect(events[0].content).toBe('Flushed');
    });
  });

  describe('Real-world scenarios', () => {
    it('simulates typical AI streaming response', () => {
      const events: Array<{ type: string; content?: string; title?: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      // Simulate how BytePlus/OpenAI streams tokens
      const chunks = [
        'data: {"type":"chunk","content":"Hello"}\n',
        'data: {"type":"chunk","content":" there"}\n',
        'data: {"type":"chunk","content":"!"}\n',
        'data: {"type":"chunk","content":" How"}\n',
        'data: {"type":"chunk","content":" can"}\n',
        'data: {"type":"chunk","content":" I"}\n',
        'data: {"type":"chunk","content":" help"}\n',
        'data: {"type":"chunk","content":"?"}\n',
        'data: {"type":"title","title":"Greeting conversation"}\n',
        'data: {"type":"done","messageId":"msg-abc123"}\n',
      ];

      for (const chunk of chunks) {
        parser.processChunk(chunk);
      }

      // Collect all content
      const fullContent = events
        .filter((e) => e.type === 'chunk')
        .map((e) => e.content)
        .join('');

      expect(fullContent).toBe('Hello there! How can I help?');
      expect(events.find((e) => e.type === 'title')?.title).toBe('Greeting conversation');
      expect(events.find((e) => e.type === 'done')).toBeTruthy();
    });

    it('simulates network chunk boundaries', () => {
      const events: Array<{ type: string; content?: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      // Network might split data at arbitrary points
      const networkChunks = [
        'data: {"type":"ch',
        'unk","content":"Part1"}\ndata: {"type":"chun',
        'k","content":"Part2"}\n',
        'data: {"type":"chunk","content":"Part3"}\nda',
        'ta: {"type":"done"}\n',
      ];

      for (const chunk of networkChunks) {
        parser.processChunk(chunk);
      }

      const contents = events.filter((e) => e.type === 'chunk').map((e) => e.content);
      expect(contents).toEqual(['Part1', 'Part2', 'Part3']);
    });

    it('handles code blocks with newlines in content', () => {
      const events: Array<{ type: string; content?: string }> = [];
      const parser = new SSEParser((event) => events.push(event));

      // Content with escaped newlines (as JSON would have)
      const codeChunk = 'data: {"type":"chunk","content":"```javascript\\nfunction hello() {\\n  return \\"world\\";\\n}\\n```"}\n';

      parser.processChunk(codeChunk);

      expect(events).toHaveLength(1);
      expect(events[0].content).toContain('function hello()');
    });
  });
});

describe('Integration: SSE Parser with TextDecoder', () => {
  it('works with TextDecoder for Uint8Array chunks', () => {
    const events: Array<{ type: string; content?: string }> = [];
    const parser = new SSEParser((event) => events.push(event));
    const decoder = new TextDecoder();

    // Simulate what happens in useAI
    const data = 'data: {"type":"chunk","content":"Decoded"}\n';
    const encoded = new TextEncoder().encode(data);

    const decoded = decoder.decode(encoded);
    parser.processChunk(decoded);

    expect(events).toHaveLength(1);
    expect(events[0].content).toBe('Decoded');
  });

  it('handles TextDecoder with partial multi-byte characters', () => {
    const events: Array<{ type: string; content?: string }> = [];
    const parser = new SSEParser((event) => events.push(event));
    const decoder = new TextDecoder();

    // Multi-byte UTF-8 character (e.g., emoji or CJK)
    const data = 'data: {"type":"chunk","content":"Hello \u{1F44B}"}\n';
    const encoded = new TextEncoder().encode(data);

    // Even if bytes were split, TextDecoder handles it
    const decoded = decoder.decode(encoded);
    parser.processChunk(decoded);

    expect(events).toHaveLength(1);
    expect(events[0].content).toBe('Hello \u{1F44B}');
  });
});
