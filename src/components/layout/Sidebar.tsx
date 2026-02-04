'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useChatStore, type Chat } from '@/store/chatStore';
import { cn, formatChatDate, truncate } from '@/lib/utils';
import { Button } from '@/components/ui';

export function Sidebar() {
  const { chats, activeChat, sidebarOpen, createChat, deleteChat, setActiveChat, toggleSidebar } =
    useChatStore();

  return (
    <>
      {/* Sidebar toggle button (visible when closed) */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={toggleSidebar}
            className="fixed left-4 top-20 z-40 p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-soft hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-16 bottom-0 w-72 bg-neutral-50 dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 z-30 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-neutral-900 dark:text-white">
                  Chat History
                </h2>
                <button
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-neutral-500" />
                </button>
              </div>
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={createChat}
              >
                New Chat
              </Button>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto p-2">
              {chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                  <MessageSquare className="h-10 w-10 text-neutral-300 dark:text-neutral-700 mb-3" />
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    No conversations yet
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                    Start a new chat to begin
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {chats.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === activeChat}
                      onSelect={() => setActiveChat(chat.id)}
                      onDelete={() => deleteChat(chat.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
              <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center">
                {chats.length} conversation{chats.length !== 1 ? 's' : ''}
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function ChatItem({ chat, isActive, onSelect, onDelete }: ChatItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'group relative rounded-xl p-3 cursor-pointer transition-colors',
        isActive
          ? 'bg-white dark:bg-neutral-900 shadow-soft'
          : 'hover:bg-white/50 dark:hover:bg-neutral-900/50'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
            isActive
              ? 'bg-primary-100 dark:bg-primary-900/30'
              : 'bg-neutral-100 dark:bg-neutral-800'
          )}
        >
          <MessageSquare
            className={cn(
              'h-4 w-4',
              isActive
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-neutral-500 dark:text-neutral-400'
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-medium truncate',
              isActive
                ? 'text-neutral-900 dark:text-white'
                : 'text-neutral-700 dark:text-neutral-300'
            )}
          >
            {truncate(chat.title, 25)}
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
            {formatChatDate(chat.updatedAt)} · {chat.messages.length} messages
          </p>
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-3 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
      >
        <Trash2 className="h-3.5 w-3.5 text-red-500" />
      </button>
    </motion.div>
  );
}
