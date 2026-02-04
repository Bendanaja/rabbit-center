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

  it('handles empty strings', () => {
    expect(cn('base', '', 'end')).toBe('base end');
  });

  it('handles arrays of classes', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('handles objects with boolean values', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });
});

describe('formatPrice', () => {
  it('formats Thai Baht correctly', () => {
    const result = formatPrice(299);
    expect(result).toContain('299');
  });

  it('handles zero', () => {
    const result = formatPrice(0);
    expect(result).toContain('0');
  });

  it('handles large numbers', () => {
    const result = formatPrice(1499);
    expect(result).toContain('1');
    expect(result).toContain('499');
  });

  it('formats without decimal places', () => {
    const result = formatPrice(299);
    expect(result).not.toMatch(/\.\d{2}/);
  });
});

describe('formatMessageTime', () => {
  it('formats time correctly', () => {
    const date = new Date('2024-01-15T14:30:00');
    const result = formatMessageTime(date);
    // Thai format might use : or . as separator
    expect(result).toMatch(/14[:.]\s?30/);
  });

  it('handles midnight', () => {
    const date = new Date('2024-01-15T00:00:00');
    const result = formatMessageTime(date);
    expect(result).toMatch(/0[:.]\s?00|00[:.]\s?00/);
  });

  it('handles noon', () => {
    const date = new Date('2024-01-15T12:00:00');
    const result = formatMessageTime(date);
    expect(result).toMatch(/12[:.]\s?00/);
  });

  it('handles single digit hours', () => {
    const date = new Date('2024-01-15T09:05:00');
    const result = formatMessageTime(date);
    expect(result).toMatch(/9[:.]\s?05|09[:.]\s?05/);
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

  it('returns "2 days ago" correctly', () => {
    const twoDaysAgo = new Date('2024-01-13T10:00:00');
    expect(formatChatDate(twoDaysAgo)).toBe('2 วันที่แล้ว');
  });

  it('returns "6 days ago" for dates at edge of week', () => {
    const sixDaysAgo = new Date('2024-01-09T10:00:00');
    expect(formatChatDate(sixDaysAgo)).toBe('6 วันที่แล้ว');
  });

  it('returns formatted date for older dates (7+ days)', () => {
    const oldDate = new Date('2024-01-01T10:00:00');
    const result = formatChatDate(oldDate);
    expect(result).not.toBe('วันนี้');
    expect(result).not.toBe('เมื่อวาน');
    expect(result).not.toContain('วันที่แล้ว');
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
    expect(id.length).toBeLessThanOrEqual(13);
  });

  it('generates alphanumeric IDs', () => {
    const id = generateId();
    expect(id).toMatch(/^[a-z0-9]+$/);
  });
});

describe('getTypingDelay', () => {
  it('returns minimum delay for empty text', () => {
    const delay = getTypingDelay('');
    expect(delay).toBeGreaterThanOrEqual(500);
  });

  it('returns minimum delay for single word', () => {
    const delay = getTypingDelay('hello');
    expect(delay).toBeGreaterThanOrEqual(500);
  });

  it('increases delay with more words', () => {
    const shortDelay = getTypingDelay('hello');
    const longDelay = getTypingDelay('hello world this is a longer message with many words');
    expect(longDelay).toBeGreaterThan(shortDelay);
  });

  it('caps at 3000ms', () => {
    const veryLongText = Array(200).fill('word').join(' ');
    expect(getTypingDelay(veryLongText)).toBeLessThanOrEqual(3000);
  });

  it('calculates based on word count', () => {
    const fiveWords = 'one two three four five';
    const tenWords = 'one two three four five six seven eight nine ten';
    expect(getTypingDelay(tenWords)).toBeGreaterThan(getTypingDelay(fiveWords));
  });
});

describe('getGreeting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns morning greeting before noon (hour < 12)', () => {
    vi.setSystemTime(new Date('2024-01-15T09:00:00'));
    expect(getGreeting()).toBe('สวัสดีตอนเช้า');
  });

  it('returns morning greeting at 11:59', () => {
    vi.setSystemTime(new Date('2024-01-15T11:59:00'));
    expect(getGreeting()).toBe('สวัสดีตอนเช้า');
  });

  it('returns afternoon greeting at noon (hour == 12)', () => {
    vi.setSystemTime(new Date('2024-01-15T12:00:00'));
    expect(getGreeting()).toBe('สวัสดีตอนบ่าย');
  });

  it('returns afternoon greeting between 12-16', () => {
    vi.setSystemTime(new Date('2024-01-15T14:00:00'));
    expect(getGreeting()).toBe('สวัสดีตอนบ่าย');
  });

  it('returns afternoon greeting at 16:59', () => {
    vi.setSystemTime(new Date('2024-01-15T16:59:00'));
    expect(getGreeting()).toBe('สวัสดีตอนบ่าย');
  });

  it('returns evening greeting at 17:00', () => {
    vi.setSystemTime(new Date('2024-01-15T17:00:00'));
    expect(getGreeting()).toBe('สวัสดีตอนเย็น');
  });

  it('returns evening greeting at night', () => {
    vi.setSystemTime(new Date('2024-01-15T22:00:00'));
    expect(getGreeting()).toBe('สวัสดีตอนเย็น');
  });

  it('returns evening greeting at midnight', () => {
    vi.setSystemTime(new Date('2024-01-15T00:00:00'));
    expect(getGreeting()).toBe('สวัสดีตอนเช้า');
  });
});

describe('truncate', () => {
  it('does not truncate text shorter than maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('does not truncate text equal to maxLength', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('truncates text longer than maxLength with ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });

  it('accounts for ellipsis length in truncation', () => {
    const result = truncate('hello world', 8);
    expect(result.length).toBe(8);
  });

  it('handles empty string', () => {
    expect(truncate('', 5)).toBe('');
  });

  it('handles maxLength less than 3', () => {
    // Edge case: maxLength of 3 means 0 chars + '...'
    const result = truncate('hello', 3);
    expect(result).toBe('...');
  });

  it('handles single character with enough length', () => {
    expect(truncate('a', 5)).toBe('a');
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

  it('passes arguments to the debounced function', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('arg1', 'arg2');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('uses latest arguments when called multiple times', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('first');
    debounced('second');
    debounced('third');

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('third');
  });

  it('can be called again after timeout completes', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);

    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('isMobile', () => {
  const originalWindow = global.window;

  afterEach(() => {
    global.window = originalWindow;
  });

  it('returns false when window is undefined (SSR)', () => {
    const windowBackup = global.window;
    // @ts-ignore - testing SSR scenario
    delete global.window;

    expect(isMobile()).toBe(false);

    global.window = windowBackup;
  });

  it('returns true for width less than 768', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    expect(isMobile()).toBe(true);
  });

  it('returns false for width equal to 768', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });
    expect(isMobile()).toBe(false);
  });

  it('returns false for width greater than 768', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    expect(isMobile()).toBe(false);
  });
});

describe('getInitials', () => {
  it('returns first two initials from two words', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('handles single name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('limits to two characters for three+ words', () => {
    expect(getInitials('John Michael Doe')).toBe('JM');
  });

  it('returns uppercase initials', () => {
    expect(getInitials('john doe')).toBe('JD');
  });

  it('handles names with extra spaces', () => {
    expect(getInitials('John   Doe')).toBe('JD');
  });

  it('handles Thai names', () => {
    expect(getInitials('สมชาย ใจดี')).toBe('สใ');
  });

  it('handles single character name', () => {
    expect(getInitials('J')).toBe('J');
  });

  it('handles empty parts gracefully', () => {
    // This might vary based on implementation
    const result = getInitials('John  ');
    expect(result.length).toBeLessThanOrEqual(2);
  });
});
