import { type ClassValue, clsx } from 'clsx';

// Simple classname merger (without tailwind-merge for lighter bundle)
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Format currency in Thai Baht
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Format date for chat messages
export function formatMessageTime(date: Date): string {
  return new Intl.DateTimeFormat('th-TH', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

// Format date for chat history
export function formatChatDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'วันนี้';
  if (diffDays === 1) return 'เมื่อวาน';
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

  return new Intl.DateTimeFormat('th-TH', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Simulate typing delay for mock responses
export function getTypingDelay(text: string): number {
  // Average typing speed: ~40 words per minute
  const words = text.split(' ').length;
  const baseDelay = 500; // minimum delay
  const perWordDelay = 50; // ms per word
  return Math.min(baseDelay + words * perWordDelay, 3000); // cap at 3 seconds
}

// Get greeting based on time of day
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'สวัสดีตอนเช้า';
  if (hour < 17) return 'สวัสดีตอนบ่าย';
  return 'สวัสดีตอนเย็น';
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Simple debounce function
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Check if user is on mobile
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
