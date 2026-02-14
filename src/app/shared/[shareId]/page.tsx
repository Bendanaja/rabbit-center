'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bot, Clock, ArrowRight, MessageSquare, Loader2 } from 'lucide-react';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import { getModelById } from '@/lib/byteplus';
import { SITE_CONFIG } from '@/lib/constants';

interface SharedMessage {
  role: string;
  content: string;
  model_id: string | null;
  created_at: string;
}

interface SharedChat {
  title: string;
  model_id: string;
  created_at: string;
  messages: SharedMessage[];
}

export default function SharedChatPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = use(params);
  const [chat, setChat] = useState<SharedChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSharedChat() {
      try {
        const res = await fetch(`/api/shared/${shareId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('ไม่พบลิงก์แชทนี้ หรือลิงก์อาจถูกยกเลิกแล้ว');
          } else {
            setError('เกิดข้อผิดพลาดในการโหลดแชท');
          }
          return;
        }
        const data = await res.json();
        setChat(data);
      } catch {
        setError('เกิดข้อผิดพลาดในการโหลดแชท');
      } finally {
        setLoading(false);
      }
    }
    fetchSharedChat();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !chat) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-neutral-400" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
            ไม่พบแชท
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">
            {error || 'ลิงก์นี้ไม่ถูกต้องหรือถูกยกเลิกแล้ว'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
          >
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    );
  }

  const modelInfo = getModelById(chat.model_id);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
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
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>แชทที่แชร์</span>
          </div>
        </div>
      </header>

      {/* Chat Title */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          {chat.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{new Date(chat.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          {modelInfo && (
            <div className="flex items-center gap-1.5">
              <div className="relative h-4 w-4 rounded overflow-hidden">
                <Image src={modelInfo.icon} alt={modelInfo.name} fill className="object-cover" />
              </div>
              <span>{modelInfo.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-3xl mx-auto px-4 pb-8">
        <div className="space-y-6">
          {chat.messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map((msg, i) => {
              const msgModel = msg.model_id ? getModelById(msg.model_id) : modelInfo;
              return (
                <div key={i} className="flex gap-3 sm:gap-4">
                  {msg.role === 'assistant' ? (
                    <div className="relative h-7 w-7 rounded-full overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-700">
                      {msgModel?.icon ? (
                        <Image src={msgModel.icon} alt={msgModel.name} fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                          <Bot className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-300">You</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {msg.role === 'user' ? 'You' : (msgModel?.name || 'AI')}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {msg.role === 'assistant' ? (
                      <MarkdownRenderer content={msg.content} />
                    ) : (
                      <p className="text-sm sm:text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
            ลองใช้ {SITE_CONFIG.name}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            เข้าถึง AI หลายโมเดล ใช้งานฟรี ไม่จำกัด
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-rose-500 text-white font-semibold hover:shadow-lg hover:shadow-primary-500/25 transition-all"
          >
            ลองใช้ {SITE_CONFIG.name}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
