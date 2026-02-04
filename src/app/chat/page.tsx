'use client';

import { useEffect, useState, useCallback } from 'react';
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
  MoreHorizontal,
  Share,
  LogOut,
  Loader2,
  Lock,
  Sparkles,
  ArrowRight,
  Bot,
  Zap,
  Shield,
  Brain
} from 'lucide-react';

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

          {/* Animated particles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary-500/50 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${10 + i * 10}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}

          <div className="relative z-10">
            {/* Icon */}
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500 to-rose-500 flex items-center justify-center shadow-lg shadow-primary-500/30"
            >
              <Lock className="h-8 w-8 text-white" />
            </motion.div>

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
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(239, 68, 68, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-primary-500 to-rose-500 text-white font-semibold flex items-center justify-center gap-2"
                >
                  เข้าสู่ระบบ
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
              <Link href="/auth/signup?redirect=/chat" className="block">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
                >
                  สมัครสมาชิกฟรี
                </motion.button>
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
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-neutral-400 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
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
  const { chats, loading: chatsLoading, createChat, deleteChat } = useChats(user?.id);

  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Set first chat as active on load
  useEffect(() => {
    if (!chatsLoading && chats.length > 0 && !activeChat) {
      setActiveChat(chats[0].id);
    }
  }, [chats, chatsLoading, activeChat]);

  const handleCreateChat = useCallback(async () => {
    if (isCreating) return;
    setIsCreating(true);

    const { data, error } = await createChat();
    if (data && !error) {
      setActiveChat(data.id);
    }

    setIsCreating(false);
  }, [createChat, isCreating]);

  const handleDeleteChat = useCallback(async (chatId: string) => {
    await deleteChat(chatId);
    if (activeChat === chatId) {
      const remaining = chats.filter(c => c.id !== chatId);
      setActiveChat(remaining[0]?.id || null);
    }
  }, [deleteChat, activeChat, chats]);

  const handleSignOut = () => {
    signOut();
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

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
                  alt="RabbitAI"
                  fill
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

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {chatsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
                </div>
              ) : chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                  <MessageSquare className="h-8 w-8 text-neutral-600 mb-2" />
                  <p className="text-xs text-neutral-500">ยังไม่มีบทสนทนา</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {chats.map((chat) => (
                    <ChatListItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === activeChat}
                      onSelect={() => setActiveChat(chat.id)}
                      onDelete={() => handleDeleteChat(chat.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-2 border-t border-neutral-800">
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

          {/* Center - Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-lg overflow-hidden shadow-sm">
              <Image
                src="/images/logo.jpg"
                alt="RabbitAI"
                fill
                className="object-cover"
              />
            </div>
            <span className="font-display font-semibold text-base sm:text-lg text-neutral-900 dark:text-white hidden sm:inline">
              {SITE_CONFIG.name}
            </span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors hidden sm:flex">
              <Share className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </button>
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
          <ChatWindow
            chatId={activeChat}
            userId={user.id}
            onChatCreated={(newChatId) => setActiveChat(newChatId)}
            onCreateChat={handleCreateChat}
          />
        </main>
      </div>
    </div>
  );
}

interface ChatListItemProps {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function ChatListItem({ chat, isActive, onSelect, onDelete }: ChatListItemProps) {
  return (
    <motion.div
      layout
      className={cn(
        'group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
        isActive
          ? 'bg-neutral-800 text-white'
          : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
      )}
      onClick={onSelect}
    >
      <MessageSquare className="h-4 w-4 shrink-0" />
      <span className="text-sm truncate flex-1">{truncate(chat.title, 28)}</span>

      {/* Actions on hover */}
      <div className={cn(
        'absolute right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
        isActive && 'opacity-100'
      )}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded hover:bg-neutral-700 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
