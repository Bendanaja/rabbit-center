'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { RabbitLoader } from '@/components/ui/RabbitLoader';
import { VideoGenerator } from '@/components/ai/VideoGenerator';
import { SITE_CONFIG } from '@/lib/constants';

export default function VideoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/video');
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-neutral-950">
        <RabbitLoader size="lg" text="กำลังโหลด..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-[100dvh] flex flex-col bg-neutral-950 overflow-hidden">
      {/* Top Bar */}
      <header className="h-12 sm:h-14 flex items-center justify-between px-3 sm:px-4 border-b border-neutral-800 bg-neutral-900">
        <div className="flex items-center gap-2">
          <Link
            href="/chat"
            className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-400" />
          </Link>
        </div>

        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-lg overflow-hidden shadow-sm">
            <Image
              src="/images/logo.jpg"
              alt={SITE_CONFIG.name}
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>
          <span className="font-display font-semibold text-base sm:text-lg text-white hidden sm:inline">
            {SITE_CONFIG.name}
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <Settings className="h-5 w-5 text-neutral-400" />
          </Link>
        </div>
      </header>

      {/* Video Generator */}
      <main className="flex-1 overflow-hidden">
        <VideoGenerator />
      </main>
    </div>
  );
}
