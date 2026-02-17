'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  User,
  Bot,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  Hash,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAdmin } from '@/hooks/useAdmin';
import { PERMISSIONS } from '@/types/admin';
import { authFetch } from '@/lib/api-client';
import { useRealtime } from '@/hooks/useRealtime';
import { cn } from '@/lib/utils';

interface ChatItem {
  id: string;
  title: string;
  user_id: string;
  model_id: string;
  message_count: number;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  user_display_name: string | null;
  user_avatar_url: string | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model_id: string | null;
  tokens_input: number;
  tokens_output: number;
  response_time_ms: number | null;
  is_error: boolean;
  error_message: string | null;
  created_at: string;
}

interface ChatDetail {
  chat: {
    id: string;
    title: string;
    user_id: string;
    model_id: string;
    message_count: number;
    last_message_at: string;
    created_at: string;
    updated_at: string;
    is_archived: boolean;
  };
  messages: ChatMessage[];
  user: {
    display_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'เมื่อกี้';
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว`;
  if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminChatsPage() {
  const { checkPermission } = useAdmin();
  const canViewUsers = checkPermission(PERMISSIONS.VIEW_USERS);

  // Chat list state
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalChats, setTotalChats] = useState(0);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isFirstLoad = useRef(true);

  // Selected chat state
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatDetail, setChatDetail] = useState<ChatDetail | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat list
  const fetchChats = useCallback(async (searchTerm?: string) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      });
      const s = searchTerm ?? debouncedSearch;
      if (s) params.set('search', s);

      const response = await authFetch(`/api/admin/chats?${params}`);
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
        setTotalPages(data.totalPages || 1);
        setTotalChats(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      if (isFirstLoad.current) {
        setLoading(false);
        isFirstLoad.current = false;
      }
      setRefreshing(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Real-time: auto-refetch on new chats/messages
  const chatSubs = useMemo(() => [
    { table: 'chats' },
    { table: 'messages' },
  ], []);
  useRealtime(chatSubs, () => fetchChats());

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(value);
    }, 400);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  // Fetch chat detail
  const handleSelectChat = useCallback(async (chatId: string) => {
    setSelectedChatId(chatId);
    setLoadingMessages(true);
    setChatDetail(null);
    try {
      const response = await authFetch(`/api/admin/chats/${chatId}`);
      if (response.ok) {
        const data: ChatDetail = await response.json();
        setChatDetail(data);
      }
    } catch (error) {
      console.error('Failed to fetch chat detail:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (chatDetail?.messages && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatDetail?.messages]);

  return (
    <div className="min-h-screen">
      <AdminHeader onRefresh={handleRefresh} isRefreshing={refreshing} />

      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">ส่องแชท</h1>
            <p className="text-neutral-400 mt-1">
              {totalChats.toLocaleString()} แชททั้งหมด
            </p>
          </div>
        </div>

        {/* Two-panel layout */}
        <div className="flex gap-5 h-[calc(100vh-220px)]">
          {/* Left Panel: Chat List */}
          <div className="w-[420px] shrink-0 flex flex-col bg-neutral-900/40 border border-neutral-800/60 rounded-xl overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-neutral-800/60">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="ค้นหาชื่อผู้ใช้, หัวข้อแชท..."
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 transition-all"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <ChatListSkeleton />
              ) : chats.length === 0 ? (
                <div className="py-16 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 text-neutral-600" />
                  <p className="text-neutral-400 text-sm">ไม่พบแชท</p>
                </div>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className={cn(
                      'w-full text-left p-4 border-b border-neutral-800/40 transition-colors',
                      selectedChatId === chat.id
                        ? 'bg-primary-500/10 border-l-2 border-l-primary-500'
                        : 'hover:bg-neutral-800/30'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="h-9 w-9 rounded-full overflow-hidden bg-neutral-800 shrink-0 flex items-center justify-center">
                        {chat.user_avatar_url ? (
                          <img
                            src={chat.user_avatar_url}
                            alt={chat.user_display_name || ''}
                            className="h-9 w-9 object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-neutral-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* User name + time */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-white truncate">
                            {chat.user_display_name || 'ไม่ระบุชื่อ'}
                          </span>
                          <span className="text-[11px] text-neutral-500 shrink-0">
                            {formatRelativeTime(chat.last_message_at || chat.updated_at)}
                          </span>
                        </div>

                        {/* Chat title */}
                        <p className="text-sm text-neutral-400 truncate mt-0.5">
                          {chat.title || 'แชทใหม่'}
                        </p>

                        {/* Meta: model + message count */}
                        <div className="flex items-center gap-3 mt-1.5">
                          {chat.model_id && (
                            <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                              <Bot className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">{chat.model_id}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                            <Hash className="h-3 w-3" />
                            {chat.message_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-neutral-800/60 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    page <= 1
                      ? 'text-neutral-600 cursor-not-allowed'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  )}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  ก่อนหน้า
                </button>
                <span className="text-xs text-neutral-500">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    page >= totalPages
                      ? 'text-neutral-600 cursor-not-allowed'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  )}
                >
                  ถัดไป
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right Panel: Message Viewer */}
          <div className="flex-1 flex flex-col bg-neutral-900/40 border border-neutral-800/60 rounded-xl overflow-hidden">
            {!selectedChatId ? (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-neutral-700" />
                  <p className="text-neutral-400 text-lg">เลือกแชทเพื่อดูข้อความ</p>
                  <p className="text-neutral-600 text-sm mt-1">เลือกแชทจากรายการด้านซ้าย</p>
                </div>
              </div>
            ) : loadingMessages ? (
              /* Loading Messages */
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-neutral-500 animate-spin" />
              </div>
            ) : chatDetail ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-neutral-800/60 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-neutral-800 shrink-0 flex items-center justify-center">
                      {chatDetail.user.avatar_url ? (
                        <img
                          src={chatDetail.user.avatar_url}
                          alt={chatDetail.user.display_name || ''}
                          className="h-10 w-10 object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-neutral-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {chatDetail.user.display_name || 'ไม่ระบุชื่อ'}
                        </h3>
                        {chatDetail.user.email && (
                          <span className="text-[11px] text-neutral-500 truncate">
                            {chatDetail.user.email}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-neutral-400 truncate">
                          {chatDetail.chat.title || 'แชทใหม่'}
                        </span>
                        {chatDetail.chat.model_id && (
                          <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                            <Bot className="h-3 w-3" />
                            {chatDetail.chat.model_id}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                          <Hash className="h-3 w-3" />
                          {chatDetail.chat.message_count} ข้อความ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatDetail.messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </>
            ) : (
              /* Error state */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-neutral-600" />
                  <p className="text-neutral-400">ไม่สามารถโหลดข้อความได้</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ──────────────────────────────────────
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[80%] px-4 py-2 rounded-lg bg-neutral-800/30 border border-neutral-800/50">
          <p className="text-xs text-neutral-500 whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[75%] space-y-1', isUser ? 'items-end' : 'items-start')}>
        {/* Bubble */}
        <div
          className={cn(
            'px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap break-words',
            isUser
              ? 'bg-primary-500/20 text-white rounded-br-md'
              : message.is_error
              ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-bl-md'
              : 'bg-neutral-800/60 text-neutral-200 rounded-bl-md'
          )}
        >
          {message.is_error && message.error_message ? (
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{message.error_message}</span>
            </div>
          ) : (
            message.content
          )}
        </div>

        {/* Meta info */}
        <div
          className={cn(
            'flex items-center gap-2 px-1',
            isUser ? 'justify-end' : 'justify-start'
          )}
        >
          <span className="text-[10px] text-neutral-600">
            {formatTimestamp(message.created_at)}
          </span>
          {!isUser && message.model_id && (
            <span className="text-[10px] text-neutral-600 flex items-center gap-0.5">
              <Bot className="h-2.5 w-2.5" />
              {message.model_id}
            </span>
          )}
          {!isUser && (message.tokens_input > 0 || message.tokens_output > 0) && (
            <span className="text-[10px] text-neutral-600 flex items-center gap-0.5">
              <Zap className="h-2.5 w-2.5" />
              {message.tokens_input + message.tokens_output} tok
            </span>
          )}
          {!isUser && message.response_time_ms != null && message.response_time_ms > 0 && (
            <span className="text-[10px] text-neutral-600 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {message.response_time_ms > 1000
                ? `${(message.response_time_ms / 1000).toFixed(1)}s`
                : `${message.response_time_ms}ms`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Chat List Skeleton ──────────────────────────────────
function ChatListSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 border-b border-neutral-800/40">
          <div className="h-9 w-9 bg-neutral-800 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-3.5 bg-neutral-800 rounded w-24" />
              <div className="h-2.5 bg-neutral-800/60 rounded w-16" />
            </div>
            <div className="h-3 bg-neutral-800/60 rounded w-40" />
            <div className="h-2.5 bg-neutral-800/40 rounded w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}
