'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Share,
  LogOut,
  Loader2,
  Lock,
  Sparkles,
  ArrowRight,
  Bot,
  Zap,
  Shield,
  Brain,
  Search,
  Pin,
  Archive,
  FileText,
  FileJson,
  Link2,
  Check,
  X,
  BarChart3,
  ImagePlus,
  Video,
  ChevronDown,
  ChevronUp,
  Globe,
} from 'lucide-react';
import { ModelSelector } from '@/components/chat/ModelSelector';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Dynamic import for ChatWindow to reduce initial bundle
const ChatWindow = dynamic(
  () => import('@/components/chat/ChatWindow').then(mod => ({ default: mod.ChatWindow })),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }
);
import { cn, truncate } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { RabbitLoader } from '@/components/ui/RabbitLoader';
import { SITE_CONFIG } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useChats } from '@/hooks/useChats';
import { useRouter } from 'next/navigation';
import type { Chat } from '@/types/database';

// Login Overlay Component for Preview Mode
function LoginOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="max-w-md w-full mx-4"
      >
        <div className="relative p-8 rounded-3xl bg-neutral-900/90 border border-neutral-800 backdrop-blur-xl overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-rose-600/10 to-transparent" />

          {/* Static decorative dots */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary-500/50 rounded-full animate-pulse"
              style={{
                left: `${20 + i * 15}%`,
                top: `${10 + i * 10}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}

          <div className="relative z-10">
            {/* Icon - static */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500 to-rose-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Lock className="h-8 w-8 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              เข้าสู่ระบบเพื่อใช้งาน
            </h2>
            <p className="text-neutral-400 text-center mb-8">
              ลงทะเบียนฟรีเพื่อเริ่มแชทกับ AI ที่ฉลาดที่สุด
            </p>

            {/* Features */}
            <div className="space-y-3 mb-8">
              {[
                { icon: Brain, text: 'เข้าถึง GPT-4, Claude, Gemini และอีกมากมาย' },
                { icon: Zap, text: 'ตอบสนองเร็ว แบบ Real-time' },
                { icon: Shield, text: 'ปลอดภัย ไม่เก็บข้อมูลเพื่อฝึก AI' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <feature.icon className="h-4 w-4 text-primary-400" />
                  </div>
                  <span className="text-sm text-neutral-300">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              <Link href="/auth/login?redirect=/chat" className="block">
                <button className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-primary-500 to-rose-500 text-white font-semibold flex items-center justify-center gap-2 transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]">
                  เข้าสู่ระบบ
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/auth/signup?redirect=/chat" className="block">
                <button className="w-full py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]">
                  สมัครสมาชิกฟรี
                </button>
              </Link>
            </div>

            {/* Footer note */}
            <p className="text-xs text-neutral-500 text-center mt-6">
              ไม่ต้องใช้บัตรเครดิต • เริ่มต้นใช้งานได้ทันที
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Demo chat messages for preview
const demoMessages = [
  { role: 'user', content: 'สวัสดี ช่วยอธิบายเกี่ยวกับ AI ให้หน่อยได้ไหม?' },
  { role: 'assistant', content: 'สวัสดีครับ! AI หรือ Artificial Intelligence คือการสร้างระบบคอมพิวเตอร์ที่สามารถทำงานที่ต้องใช้ความฉลาดของมนุษย์ได้ เช่น การเรียนรู้ การคิดวิเคราะห์ และการตัดสินใจ 🤖\n\nปัจจุบัน AI มีหลายรูปแบบ เช่น:\n• Machine Learning - การเรียนรู้จากข้อมูล\n• Deep Learning - การเรียนรู้เชิงลึก\n• Natural Language Processing - การประมวลผลภาษา\n\nมีคำถามเพิ่มเติมไหมครับ?' },
];

// Preview Chat Window
function PreviewChatWindow() {
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-neutral-950 overflow-hidden">
      {/* Chat messages preview */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-6 py-8">
          {demoMessages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.3 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-rose-500 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] ${
                msg.role === 'user'
                  ? 'bg-primary-500 text-white rounded-2xl rounded-tr-md px-4 py-3'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-2xl rounded-tl-md px-4 py-3'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center shrink-0">
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">คุณ</span>
                </div>
              )}
            </motion.div>
          ))}

          {/* Typing indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex gap-4"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-rose-500 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 200}ms`, animationDuration: '0.6s' }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Input area - disabled */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="เข้าสู่ระบบเพื่อเริ่มแชท..."
              disabled
              className="w-full px-4 py-3 pr-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-400 cursor-not-allowed"
            />
            <button
              disabled
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-neutral-300 dark:bg-neutral-600 cursor-not-allowed"
            >
              <Lock className="h-4 w-4 text-neutral-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { chats, loading: chatsLoading, createChat, deleteChat, archiveChat, togglePinChat } = useChats(user?.id);

  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('deepseek-v3-2-251201');
  const [searchQuery, setSearchQuery] = useState('');
  const [usage, setUsage] = useState<UsageData | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await authFetch('/api/user/usage');
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch {
      // Non-critical
    }
  }, []);

  // Fetch usage on mount
  useEffect(() => {
    if (user) {
      fetchUsage();
    }
  }, [user, fetchUsage]);

  // Set first chat as active on load
  useEffect(() => {
    if (!chatsLoading && chats.length > 0 && !activeChat) {
      setActiveChat(chats[0].id);
    }
  }, [chats, chatsLoading, activeChat]);

  const handleCreateChat = useCallback(async () => {
    if (isCreating) return;
    setIsCreating(true);

    const { data, error } = await createChat(undefined, selectedModel);
    if (data && !error) {
      setActiveChat(data.id);
    }

    setIsCreating(false);
  }, [createChat, isCreating, selectedModel]);

  const handleDeleteChat = useCallback(async (chatId: string) => {
    await deleteChat(chatId);
    if (activeChat === chatId) {
      const remaining = chats.filter(c => c.id !== chatId);
      setActiveChat(remaining[0]?.id || null);
    }
  }, [deleteChat, activeChat, chats]);

  const handleModelChange = useCallback(async (modelId: string) => {
    setSelectedModel(modelId);
    if (activeChat) {
      try {
        await authFetch(`/api/chat/${activeChat}`, {
          method: 'PATCH',
          body: JSON.stringify({ model_id: modelId }),
        });
      } catch (error) {
        console.error('Failed to update model:', error);
      }
    }
  }, [activeChat]);

  const handleSignOut = () => {
    signOut();
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Filter and group chats by date (exclude archived, sort pinned first)
  const filteredChats = useMemo(() => {
    let result = chats.filter(c => !c.is_archived);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.title.toLowerCase().includes(q));
    }
    return result.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return 0;
    });
  }, [chats, searchQuery]);

  const groupedChats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);

    const groups: { label: string; chats: Chat[] }[] = [
      { label: 'วันนี้', chats: [] },
      { label: 'เมื่อวาน', chats: [] },
      { label: '7 วันที่ผ่านมา', chats: [] },
      { label: 'เก่ากว่า', chats: [] },
    ];

    for (const chat of filteredChats) {
      const d = new Date(chat.updated_at);
      if (d >= today) groups[0].chats.push(chat);
      else if (d >= yesterday) groups[1].chats.push(chat);
      else if (d >= weekAgo) groups[2].chats.push(chat);
      else groups[3].chats.push(chat);
    }

    return groups.filter(g => g.chats.length > 0);
  }, [filteredChats]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <RabbitLoader size="lg" text="กำลังเตรียมแชท..." />
      </div>
    );
  }

  // Not logged in - show preview mode with login overlay
  if (!user) {
    return (
      <div className="h-[100dvh] flex bg-neutral-50 dark:bg-neutral-950 overflow-hidden relative">
        {/* Preview Sidebar */}
        <aside className="w-[260px] h-full bg-neutral-900 dark:bg-black flex flex-col border-r border-neutral-800 overflow-hidden opacity-50">
          <div className="p-3 flex flex-col gap-2">
            <div className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-neutral-700 text-neutral-500">
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">แชทใหม่</span>
            </div>
          </div>
          <div className="flex-1 px-2 pb-2">
            <div className="space-y-1 p-2">
              {['บทสนทนาตัวอย่าง 1', 'บทสนทนาตัวอย่าง 2', 'สอบถามเกี่ยวกับ AI'].map((title, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-neutral-600 bg-neutral-800/30">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm truncate">{title}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Preview Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-14 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <PanelLeftClose className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>
            <Link href="/" className="flex items-center gap-2">
              <div className="relative h-8 w-8 rounded-lg overflow-hidden shadow-sm">
                <Image
                  src="/images/logo.jpg"
                  alt="RabbitHub"
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <span className="font-display font-semibold text-lg text-neutral-900 dark:text-white">
                {SITE_CONFIG.name}
              </span>
            </Link>
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <Settings className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>
          </header>

          {/* Preview Chat */}
          <PreviewChatWindow />
        </div>

        {/* Login Overlay */}
        <LoginOverlay />
      </div>
    );
  }

  // Logged in - show full chat interface
  return (
    <div className="h-[100dvh] flex bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="h-full bg-neutral-900 dark:bg-black flex flex-col border-r border-neutral-800 overflow-hidden"
          >
            {/* Sidebar Header */}
            <div className="p-3 flex flex-col gap-2">
              <button
                onClick={handleCreateChat}
                disabled={isCreating}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-neutral-700 hover:bg-neutral-800 transition-colors text-neutral-200 disabled:opacity-50"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">แชทใหม่</span>
              </button>
            </div>

            {/* Search */}
            <div className="px-3 pb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="ค้นหาบทสนทนา..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
                />
              </div>
            </div>

            {/* Chat List - Grouped by date */}
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {chatsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                  <p className="text-xs text-neutral-500">
                    {searchQuery ? 'ไม่พบบทสนทนา' : 'ยังไม่มีบทสนทนา'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedChats.map((group) => (
                    <div key={group.label}>
                      <div className="px-3 py-1">
                        <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                          {group.label}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {group.chats.map((chat) => (
                          <ChatListItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === activeChat}
                            onSelect={() => setActiveChat(chat.id)}
                            onDelete={() => handleDeleteChat(chat.id)}
                            onArchive={() => archiveChat(chat.id)}
                            onTogglePin={() => togglePinChat(chat.id, chat.is_pinned)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-2 border-t border-neutral-800">
              {/* Usage Indicator */}
              {usage && <UsageIndicator usage={usage} />}

              <Link
                href="/settings"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm">ตั้งค่า</span>
              </Link>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-400">
                <Avatar name={user.email || 'User'} size="sm" />
                <span className="text-sm truncate flex-1">{user.email?.split('@')[0] || 'ผู้ใช้งาน'}</span>
                <button
                  onClick={handleSignOut}
                  className="p-1 hover:bg-neutral-700 rounded transition-colors"
                  title="ออกจากระบบ"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-12 sm:h-14 flex items-center justify-between px-3 sm:px-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
              ) : (
                <PanelLeft className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
              )}
            </button>

            {!sidebarOpen && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleCreateChat}
                disabled={isCreating}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {isCreating ? (
                  <Loader2 className="h-5 w-5 animate-spin text-neutral-600 dark:text-neutral-400" />
                ) : (
                  <Plus className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                )}
              </motion.button>
            )}
          </div>

          {/* Center - Model Selector */}
          <div className="flex-1 flex justify-center sm:justify-start sm:ml-2">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              variant="compact"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            <ExportShareMenu chatId={activeChat} />
            <Link
              href="/settings"
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Settings className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </Link>
          </div>
        </header>

        {/* Chat Window */}
        <main className="flex-1 overflow-hidden">
          <ErrorBoundary>
            <ChatWindow
              chatId={activeChat}
              userId={user.id}
              onChatCreated={(newChatId) => setActiveChat(newChatId)}
              onCreateChat={handleCreateChat}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              onMessageSent={fetchUsage}
            />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

// Export / Share dropdown menu
function ExportShareMenu({ chatId }: { chatId: string | null }) {
  const [open, setOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'loading' | 'copied'>('idle');

  const handleExport = async (format: 'markdown' | 'json') => {
    if (!chatId) return;
    setOpen(false);
    try {
      const res = await authFetch(`/api/chat/${chatId}/export?format=${format}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : `chat.${format === 'json' ? 'json' : 'md'}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleShare = async () => {
    if (!chatId) return;
    setShareStatus('loading');
    try {
      const res = await authFetch(`/api/chat/${chatId}/share`, { method: 'POST' });
      if (!res.ok) return;
      const data = await res.json();
      const fullUrl = `${window.location.origin}${data.share_url}`;
      await navigator.clipboard.writeText(fullUrl);
      setShareStatus('copied');
      setTimeout(() => {
        setShareStatus('idle');
        setOpen(false);
      }, 2000);
    } catch (err) {
      console.error('Share failed:', err);
      setShareStatus('idle');
    }
  };

  return (
    <div className="relative hidden sm:block">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <Share className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-xl py-1"
            >
              <button
                onClick={() => handleExport('markdown')}
                disabled={!chatId}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
              >
                <FileText className="h-4 w-4 text-neutral-500" />
                <span>ส่งออก Markdown</span>
              </button>
              <button
                onClick={() => handleExport('json')}
                disabled={!chatId}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
              >
                <FileJson className="h-4 w-4 text-neutral-500" />
                <span>ส่งออก JSON</span>
              </button>
              <div className="border-t border-neutral-200 dark:border-neutral-700 my-1" />
              <button
                onClick={handleShare}
                disabled={!chatId || shareStatus === 'loading'}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
              >
                {shareStatus === 'copied' ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">คัดลอกลิงก์แล้ว!</span>
                  </>
                ) : shareStatus === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                    <span>กำลังสร้างลิงก์...</span>
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 text-neutral-500" />
                    <span>แชร์ลิงก์</span>
                  </>
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ChatListItemProps {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onTogglePin: () => void;
}

function ChatListItem({ chat, isActive, onSelect, onDelete, onArchive, onTogglePin }: ChatListItemProps) {
  return (
    <motion.div
      layout
      className={cn(
        'group relative flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-colors overflow-hidden',
        isActive
          ? 'bg-neutral-800 text-white'
          : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
      )}
      onClick={onSelect}
    >
      {chat.is_pinned && (
        <Pin className="h-3 w-3 mr-1.5 shrink-0 text-amber-400" />
      )}
      <span className="text-sm truncate flex-1">{truncate(chat.title, 32)}</span>

      {/* Gradient fade + action buttons on hover */}
      <div className={cn(
        'absolute right-0 top-0 bottom-0 flex items-center gap-0.5 pl-8 pr-2 opacity-0 group-hover:opacity-100 transition-opacity',
        'bg-gradient-to-l from-neutral-800 via-neutral-800/90 to-transparent',
        isActive && 'opacity-100 from-neutral-800 via-neutral-800/90'
      )}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className="p-1 rounded hover:bg-neutral-700 transition-colors"
          title={chat.is_pinned ? 'เลิกปักหมุด' : 'ปักหมุด'}
        >
          <Pin className={cn('h-3.5 w-3.5', chat.is_pinned && 'text-amber-400')} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive();
          }}
          className="p-1 rounded hover:bg-neutral-700 transition-colors"
          title="เก็บถาวร"
        >
          <Archive className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded hover:bg-neutral-700 transition-colors"
          title="ลบ"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// Usage Indicator Component
interface UsageData {
  plan: string;
  planName: string;
  usage: {
    messages: { used: number; limit: number; remaining: number; unlimited?: boolean };
    images: { used: number; limit: number; remaining: number; unlimited?: boolean };
    videos: { used: number; limit: number; remaining: number; unlimited?: boolean };
    searches?: { used: number; limit: number; remaining: number; unlimited?: boolean };
  };
}

function UsageIndicator({ usage }: { usage: UsageData }) {
  const [expanded, setExpanded] = useState(false);
  const { messages, images, videos } = usage.usage;

  const isUnlimitedMsg = messages.unlimited || messages.limit === 0;
  const msgPercent = isUnlimitedMsg ? 0 : (messages.used / messages.limit) * 100;
  const barColor = msgPercent < 50 ? 'bg-green-500' : msgPercent < 80 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="px-2 pb-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 rounded-lg hover:bg-neutral-800 transition-colors text-left"
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-neutral-500" />
            <span className="text-xs text-neutral-400">
              {isUnlimitedMsg ? `${messages.used} ข้อความวันนี้` : `${messages.used}/${messages.limit} ข้อความวันนี้`}
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="h-3 w-3 text-neutral-500" />
          ) : (
            <ChevronDown className="h-3 w-3 text-neutral-500" />
          )}
        </div>
        {!isUnlimitedMsg && (
          <div className="w-full h-1.5 bg-neutral-700 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-300', barColor)}
              style={{ width: `${Math.min(msgPercent, 100)}%` }}
            />
          </div>
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 py-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">แพลน: {usage.planName}</span>
              </div>
              {images.limit > 0 && (
                <div className="flex items-center gap-2">
                  <ImagePlus className="h-3 w-3 text-violet-400" />
                  <span className="text-xs text-neutral-400">
                    {images.used}/{images.limit} รูปภาพ
                  </span>
                  <div className="flex-1 h-1 bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full"
                      style={{ width: `${Math.min((images.used / images.limit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {videos.limit > 0 && (
                <div className="flex items-center gap-2">
                  <Video className="h-3 w-3 text-pink-400" />
                  <span className="text-xs text-neutral-400">
                    {videos.used}/{videos.limit} วิดีโอ
                  </span>
                  <div className="flex-1 h-1 bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pink-500 rounded-full"
                      style={{ width: `${Math.min((videos.used / videos.limit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {usage.usage.searches && (
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3 text-sky-400" />
                  <span className="text-xs text-neutral-400">
                    {usage.usage.searches.unlimited || usage.usage.searches.limit === 0
                      ? `${usage.usage.searches.used} ค้นหาเว็บ (ไม่จำกัด)`
                      : `${usage.usage.searches.used}/${usage.usage.searches.limit} ค้นหาเว็บ`}
                  </span>
                </div>
              )}
              {images.limit === 0 && videos.limit === 0 && (
                <Link href="/pricing" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                  อัปเกรดเพื่อสร้างรูปภาพและวิดีโอ
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
