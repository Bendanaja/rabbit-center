'use client';

import { motion } from 'framer-motion';
import { Search, Calendar, Filter } from 'lucide-react';
import { useState } from 'react';
import { useChatStore, type Chat } from '@/store/chatStore';
import { cn, formatChatDate, truncate } from '@/lib/utils';
import { Input } from '@/components/ui';

export function ChatHistory() {
  const { chats, activeChat, setActiveChat } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.messages.some((m) =>
      m.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Group chats by date
  const groupedChats = filteredChats.reduce((groups, chat) => {
    const date = formatChatDate(chat.updatedAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(chat);
    return groups;
  }, {} as Record<string, Chat[]>);

  return (
    <div className="p-4">
      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="h-9"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
          <Calendar className="h-3 w-3" />
          All Time
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 transition-colors">
          <Filter className="h-3 w-3" />
          Filter
        </button>
      </div>

      {/* Chat groups */}
      <div className="space-y-6">
        {Object.entries(groupedChats).map(([date, chats]) => (
          <div key={date}>
            <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-2">
              {date}
            </h3>
            <div className="space-y-1">
              {chats.map((chat) => (
                <ChatHistoryItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === activeChat}
                  onClick={() => setActiveChat(chat.id)}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredChats.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {searchQuery ? 'No matching conversations' : 'No conversations yet'}
          </p>
        </div>
      )}
    </div>
  );
}

interface ChatHistoryItemProps {
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
  searchQuery: string;
}

function ChatHistoryItem({ chat, isActive, onClick, searchQuery }: ChatHistoryItemProps) {
  const lastMessage = chat.messages[chat.messages.length - 1];

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-200 dark:bg-amber-800/50 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <motion.button
      layout
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-xl transition-colors',
        isActive
          ? 'bg-white dark:bg-neutral-900 shadow-sm'
          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
      )}
    >
      <p
        className={cn(
          'text-sm font-medium truncate',
          isActive
            ? 'text-neutral-900 dark:text-white'
            : 'text-neutral-700 dark:text-neutral-300'
        )}
      >
        {highlightText(truncate(chat.title, 40), searchQuery)}
      </p>
      {lastMessage && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-1">
          {highlightText(truncate(lastMessage.content, 50), searchQuery)}
        </p>
      )}
      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
        {chat.messages.length} messages
      </p>
    </motion.button>
  );
}
