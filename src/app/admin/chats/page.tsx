'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
  MessageSquare,
  Search,
  User,
  Users,
  Bot,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Hash,
  Zap,
  AlertTriangle,
  Globe,
  ExternalLink,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronDown,
  X,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAdmin } from '@/hooks/useAdmin';
import { PERMISSIONS } from '@/types/admin';
import { authFetch } from '@/lib/api-client';
import { useRealtime } from '@/hooks/useRealtime';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';

const VideoPlayer = dynamic(
  () => import('@/components/ui/VideoPlayer').then(mod => ({ default: mod.VideoPlayer })),
  { ssr: false }
);

// ─── Types ──────────────────────────────────────────────

interface ChatUser {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  chat_count: number;
}

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
  metadata: Record<string, unknown> | null;
  created_at: string;
  images?: string[];
  videos?: string[];
  webSources?: { title: string; url: string }[];
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

// ─── Helpers ────────────────────────────────────────────

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

const SORT_OPTIONS = [
  { value: 'updated_at:desc', label: 'ล่าสุด' },
  { value: 'updated_at:asc', label: 'เก่าสุด' },
  { value: 'message_count:desc', label: 'ข้อความมากสุด' },
  { value: 'created_at:desc', label: 'สร้างล่าสุด' },
] as const;

const MODEL_FILTERS = [
  { value: '', label: 'ทุกโมเดล' },
  { value: 'openai/gpt-4o', label: 'GPT-4o' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet' },
  { value: 'anthropic/claude-haiku-3.5', label: 'Claude Haiku' },
  { value: 'google/gemini-2.0-flash-001', label: 'Gemini Flash' },
  { value: 'google/gemini-2.5-pro-preview', label: 'Gemini Pro' },
  { value: 'deepseek/deepseek-chat', label: 'DeepSeek' },
] as const;

// ─── Main Page Component ────────────────────────────────

export default function AdminChatsPage() {
  const { checkPermission } = useAdmin();
  const canViewUsers = checkPermission(PERMISSIONS.VIEW_USERS);

  // User list state
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');

  // Chat list state
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalChats, setTotalChats] = useState(0);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  // Sort & Filter
  const [sortOption, setSortOption] = useState('updated_at:desc');
  const [modelFilter, setModelFilter] = useState('');

  // Selected chat state
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatDetail, setChatDetail] = useState<ChatDetail | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [sortBy, sortOrder] = sortOption.split(':') as [string, string];

  // ─── Fetch Users ──────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      const response = await authFetch('/api/admin/chats/users');
      if (response.ok) {
        const data = await response.json();
        setChatUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Filter users by search
  const filteredUsers = useMemo(() => {
    if (!userSearch) return chatUsers;
    const q = userSearch.toLowerCase();
    return chatUsers.filter(u =>
      (u.display_name || '').toLowerCase().includes(q)
    );
  }, [chatUsers, userSearch]);

  const totalUserChats = useMemo(
    () => chatUsers.reduce((sum, u) => sum + u.chat_count, 0),
    [chatUsers]
  );

  // ─── Fetch Chats ──────────────────────────────────────
  const fetchChats = useCallback(async (searchTerm?: string) => {
    try {
      setLoadingChats(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        sortBy,
        sortOrder,
      });
      const s = searchTerm ?? debouncedSearch;
      if (s) params.set('search', s);
      if (modelFilter) params.set('modelId', modelFilter);
      if (selectedUserId) params.set('userId', selectedUserId);

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
      setLoadingChats(false);
      setRefreshing(false);
    }
  }, [page, debouncedSearch, sortBy, sortOrder, modelFilter, selectedUserId]);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  // Real-time: auto-refetch
  const chatListSubs = useMemo(() => [
    { table: 'chats' },
    { table: 'messages' },
  ], []);
  useRealtime(chatListSubs, () => { fetchChats(); fetchUsers(); });

  // Real-time: selected chat messages
  const fetchChatDetail = useCallback(async (chatId: string) => {
    try {
      const response = await authFetch(`/api/admin/chats/${chatId}`);
      if (response.ok) {
        const data: ChatDetail = await response.json();
        setChatDetail(data);
      }
    } catch (error) {
      console.error('Failed to fetch chat detail:', error);
    }
  }, []);

  const messageSubs = useMemo(() => {
    if (!selectedChatId) return [];
    return [{ table: 'messages', filter: `chat_id=eq.${selectedChatId}` }];
  }, [selectedChatId]);

  useRealtime(messageSubs, () => {
    if (selectedChatId) fetchChatDetail(selectedChatId);
  }, !!selectedChatId);

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
    fetchUsers();
  };

  // Select user
  const handleSelectUser = (userId: string | null) => {
    setSelectedUserId(userId);
    setSelectedChatId(null);
    setChatDetail(null);
    setPage(1);
    setSearchQuery('');
    setDebouncedSearch('');
  };

  // Select chat
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

  // Scroll to bottom
  useEffect(() => {
    if (chatDetail?.messages && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatDetail?.messages]);

  // Reset page on filter changes
  useEffect(() => { setPage(1); }, [sortOption, modelFilter]);

  // Selected user info
  const selectedUser = useMemo(
    () => chatUsers.find(u => u.user_id === selectedUserId),
    [chatUsers, selectedUserId]
  );

  return (
    <div className="min-h-screen">
      <AdminHeader onRefresh={handleRefresh} isRefreshing={refreshing} />

      <div className="p-4 lg:p-6">
        {/* Three-panel layout */}
        <div className="flex gap-3 h-[calc(100vh-130px)]">

          {/* ═══ Panel 1: Users ═══ */}
          <div className="w-[220px] shrink-0 flex flex-col bg-neutral-900/40 border border-neutral-800/60 rounded-xl overflow-hidden">
            {/* User search */}
            <div className="p-2.5 border-b border-neutral-800/60">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="ค้นหาผู้ใช้..."
                  className="w-full pl-8 pr-3 py-2 bg-neutral-900/80 border border-neutral-800 rounded-lg text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition-all"
                />
              </div>
            </div>

            {/* All users button */}
            <button
              onClick={() => handleSelectUser(null)}
              className={cn(
                'w-full text-left px-3 py-2.5 border-b border-neutral-800/40 transition-colors flex items-center gap-2.5',
                selectedUserId === null
                  ? 'bg-primary-500/10 border-l-2 border-l-primary-500'
                  : 'hover:bg-neutral-800/30'
              )}
            >
              <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
                <Users className="h-3.5 w-3.5 text-neutral-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white">ทั้งหมด</p>
                <p className="text-[10px] text-neutral-500">{totalUserChats} แชท</p>
              </div>
            </button>

            {/* User list */}
            <div className="flex-1 overflow-y-auto">
              {loadingUsers ? (
                <UserListSkeleton />
              ) : filteredUsers.length === 0 ? (
                <div className="py-8 text-center">
                  <User className="h-6 w-6 mx-auto mb-2 text-neutral-600" />
                  <p className="text-neutral-500 text-[11px]">ไม่พบผู้ใช้</p>
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <button
                    key={u.user_id}
                    onClick={() => handleSelectUser(u.user_id)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 border-b border-neutral-800/30 transition-colors flex items-center gap-2.5',
                      selectedUserId === u.user_id
                        ? 'bg-primary-500/10 border-l-2 border-l-primary-500'
                        : 'hover:bg-neutral-800/30'
                    )}
                  >
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-neutral-800 shrink-0 flex items-center justify-center">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="h-8 w-8 object-cover" />
                      ) : (
                        <User className="h-3.5 w-3.5 text-neutral-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {u.display_name || 'ไม่ระบุชื่อ'}
                      </p>
                      <p className="text-[10px] text-neutral-500">{u.chat_count} แชท</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* User count */}
            <div className="px-3 py-2 border-t border-neutral-800/60">
              <p className="text-[10px] text-neutral-600 text-center">
                {chatUsers.length} ผู้ใช้
              </p>
            </div>
          </div>

          {/* ═══ Panel 2: Chats ═══ */}
          <div className="w-[340px] shrink-0 flex flex-col bg-neutral-900/40 border border-neutral-800/60 rounded-xl overflow-hidden">
            {/* Header: selected user + search */}
            <div className="p-2.5 border-b border-neutral-800/60 space-y-2">
              {/* Selected user badge */}
              {selectedUser && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-primary-500/5 border border-primary-500/20 rounded-lg">
                  <div className="h-5 w-5 rounded-full overflow-hidden bg-neutral-800 shrink-0 flex items-center justify-center">
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt="" className="h-5 w-5 object-cover" />
                    ) : (
                      <User className="h-2.5 w-2.5 text-neutral-500" />
                    )}
                  </div>
                  <span className="text-xs text-primary-300 font-medium truncate flex-1">
                    {selectedUser.display_name || 'ไม่ระบุชื่อ'}
                  </span>
                  <button
                    onClick={() => handleSelectUser(null)}
                    className="text-neutral-500 hover:text-white transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="ค้นหาหัวข้อแชท..."
                  className="w-full pl-8 pr-3 py-2 bg-neutral-900/80 border border-neutral-800 rounded-lg text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition-all"
                />
              </div>

              {/* Sort & Filter */}
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <ArrowUpDown className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-500 pointer-events-none" />
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="w-full pl-6 pr-5 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-[11px] text-neutral-300 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500/30"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-neutral-500 pointer-events-none" />
                </div>
                <div className="relative flex-1">
                  <SlidersHorizontal className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-500 pointer-events-none" />
                  <select
                    value={modelFilter}
                    onChange={(e) => setModelFilter(e.target.value)}
                    className="w-full pl-6 pr-5 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-[11px] text-neutral-300 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500/30"
                  >
                    {MODEL_FILTERS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-neutral-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Chat count */}
            <div className="px-3 py-1.5 border-b border-neutral-800/40">
              <p className="text-[11px] text-neutral-500">{totalChats} แชท</p>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto">
              {loadingChats ? (
                <ChatListSkeleton />
              ) : chats.length === 0 ? (
                <div className="py-12 text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-neutral-600" />
                  <p className="text-neutral-500 text-xs">ไม่พบแชท</p>
                </div>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className={cn(
                      'w-full text-left px-3 py-3 border-b border-neutral-800/30 transition-colors',
                      selectedChatId === chat.id
                        ? 'bg-primary-500/10 border-l-2 border-l-primary-500'
                        : 'hover:bg-neutral-800/30'
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Avatar - only show when not filtering by user */}
                      {!selectedUserId && (
                        <div className="h-7 w-7 rounded-full overflow-hidden bg-neutral-800 shrink-0 flex items-center justify-center mt-0.5">
                          {chat.user_avatar_url ? (
                            <img src={chat.user_avatar_url} alt="" className="h-7 w-7 object-cover" />
                          ) : (
                            <User className="h-3 w-3 text-neutral-500" />
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {/* User name + time */}
                        <div className="flex items-center justify-between gap-2">
                          {!selectedUserId && (
                            <span className="text-xs font-medium text-white truncate">
                              {chat.user_display_name || 'ไม่ระบุชื่อ'}
                            </span>
                          )}
                          <span className={cn(
                            'text-[10px] text-neutral-500 shrink-0',
                            selectedUserId && 'ml-auto'
                          )}>
                            {formatRelativeTime(chat.last_message_at || chat.updated_at)}
                          </span>
                        </div>
                        {/* Chat title */}
                        <p className="text-xs text-neutral-400 truncate mt-0.5">
                          {chat.title || 'แชทใหม่'}
                        </p>
                        {/* Meta */}
                        <div className="flex items-center gap-2 mt-1">
                          {chat.model_id && (
                            <span className="flex items-center gap-0.5 text-[10px] text-neutral-500">
                              <Bot className="h-2.5 w-2.5" />
                              <span className="truncate max-w-[100px]">{chat.model_id.split('/').pop()}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-0.5 text-[10px] text-neutral-500">
                            <Hash className="h-2.5 w-2.5" />
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
              <div className="px-2.5 py-2 border-t border-neutral-800/60 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={cn(
                    'flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-medium transition-colors',
                    page <= 1
                      ? 'text-neutral-600 cursor-not-allowed'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  )}
                >
                  <ChevronLeft className="h-3 w-3" />
                  ก่อนหน้า
                </button>
                <span className="text-[11px] text-neutral-500">{page}/{totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={cn(
                    'flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-medium transition-colors',
                    page >= totalPages
                      ? 'text-neutral-600 cursor-not-allowed'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  )}
                >
                  ถัดไป
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* ═══ Panel 3: Messages ═══ */}
          <div className="flex-1 flex flex-col bg-neutral-900/40 border border-neutral-800/60 rounded-xl overflow-hidden">
            {!selectedChatId ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-neutral-700" />
                  <p className="text-neutral-400">เลือกแชทเพื่อดูข้อความ</p>
                  <p className="text-neutral-600 text-sm mt-1">เลือกแชทจากรายการตรงกลาง</p>
                </div>
              </div>
            ) : loadingMessages ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-neutral-500 animate-spin" />
              </div>
            ) : chatDetail ? (
              <>
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-neutral-800/60 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full overflow-hidden bg-neutral-800 shrink-0 flex items-center justify-center">
                      {chatDetail.user.avatar_url ? (
                        <img src={chatDetail.user.avatar_url} alt="" className="h-9 w-9 object-cover" />
                      ) : (
                        <User className="h-4 w-4 text-neutral-500" />
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

  const attachments = (message.metadata?.attachments as { url: string; contentType?: string; fileName?: string }[] | undefined);

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
        {/* User attachments */}
        {isUser && attachments && attachments.length > 0 && (
          <div className={cn('grid gap-2 mb-2', attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
            {attachments.map((att, i) => {
              if (!att.url.startsWith('https://') && !att.url.startsWith('data:image/')) return null;
              return (
                <div key={i} className="relative rounded-xl overflow-hidden border border-neutral-700/50">
                  <img
                    src={att.url}
                    alt={att.fileName || `attachment-${i}`}
                    className="w-full max-h-[300px] object-cover"
                    loading="lazy"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            'px-4 py-3 rounded-2xl text-sm break-words',
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
            <div className="space-y-3">
              {message.content && (
                isUser ? (
                  <span className="whitespace-pre-wrap">{message.content}</span>
                ) : (
                  <MarkdownRenderer content={message.content} />
                )
              )}

              {message.images && message.images.length > 0 && (
                <div className={cn('grid gap-2', message.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
                  {message.images.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                      <div className="relative rounded-xl overflow-hidden border border-neutral-700/50 group">
                        <Image
                          src={url}
                          alt={`generated-${i}`}
                          width={512}
                          height={512}
                          className="w-full max-h-[400px] object-cover transition-transform group-hover:scale-[1.02]"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black/60 rounded-lg p-1.5">
                            <ExternalLink className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {message.videos && message.videos.length > 0 && (
                <div className="space-y-2">
                  {message.videos.map((url, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-neutral-700/50">
                      <VideoPlayer src={url} compact />
                    </div>
                  ))}
                </div>
              )}

              {message.webSources && message.webSources.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {message.webSources.map((source, i) => {
                    let domain = '';
                    try { domain = new URL(source.url).hostname; } catch { /* skip */ }
                    return (
                      <a
                        key={i}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/50 rounded-lg transition-colors group"
                      >
                        <Globe className="h-3 w-3 text-neutral-500 shrink-0" />
                        <span className="text-xs text-neutral-300 group-hover:text-white truncate max-w-[200px]">
                          {source.title || domain}
                        </span>
                        <ExternalLink className="h-2.5 w-2.5 text-neutral-600 shrink-0" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Meta info */}
        <div className={cn('flex items-center gap-2 px-1', isUser ? 'justify-end' : 'justify-start')}>
          <span className="text-[10px] text-neutral-600">{formatTimestamp(message.created_at)}</span>
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

// ─── Skeletons ───────────────────────────────────────────

function UserListSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-neutral-800/30">
          <div className="h-8 w-8 bg-neutral-800 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-neutral-800 rounded w-20" />
            <div className="h-2 bg-neutral-800/60 rounded w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatListSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-2.5 px-3 py-3 border-b border-neutral-800/30">
          <div className="h-7 w-7 bg-neutral-800 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="h-3 bg-neutral-800 rounded w-20" />
              <div className="h-2.5 bg-neutral-800/60 rounded w-14" />
            </div>
            <div className="h-2.5 bg-neutral-800/60 rounded w-36" />
            <div className="h-2 bg-neutral-800/40 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
