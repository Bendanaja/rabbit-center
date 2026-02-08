'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading, error } = useAdmin();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login?redirect=/admin');
    }
  }, [user, authLoading, router]);

  const isLoading = authLoading || adminLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
          <p className="mt-4 text-neutral-400">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  // Not admin - access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex p-4 rounded-full bg-red-500/10 mb-6">
            <ShieldAlert className="h-12 w-12 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">ไม่มีสิทธิ์เข้าถึง</h1>
          <p className="text-neutral-400 mb-6">
            คุณไม่มีสิทธิ์เข้าถึงหน้า Admin Panel กรุณาติดต่อผู้ดูแลระบบ
          </p>
          {error && (
            <p className="text-sm text-red-400 mb-4">{error}</p>
          )}
          <button
            onClick={() => router.push('/chat')}
            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  // Admin layout - no AnimatePresence/motion overhead, no expensive blur backgrounds
  return (
    <div className="min-h-screen bg-neutral-950">
      <AdminSidebar />
      <main className="ml-[280px] min-h-screen">
        {children}
      </main>
    </div>
  );
}
