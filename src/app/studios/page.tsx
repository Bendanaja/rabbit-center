'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { RabbitLoader } from '@/components/ui/RabbitLoader';
import { StudioWorkspace } from '@/components/studios/StudioWorkspace';

export default function StudiosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/studios');
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
      <main className="flex-1 overflow-hidden">
        <StudioWorkspace />
      </main>
    </div>
  );
}
