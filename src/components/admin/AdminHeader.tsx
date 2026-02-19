'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Bell,
  Search,
  ChevronRight,
  Home,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';

const pageNames: Record<string, string> = {
  '/admin': 'แดชบอร์ด',
  '/admin/users': 'จัดการผู้ใช้',
  '/admin/models': 'จัดการ AI Models',
  '/admin/analytics': 'วิเคราะห์ข้อมูล',
  '/admin/settings': 'ตั้งค่าระบบ',
  '/admin/moderation': 'ตรวจสอบเนื้อหา',
  '/admin/subscriptions': 'จัดการสมาชิก',
  '/admin/activity': 'ประวัติการใช้งาน',
  '/admin/rate-limits': 'จัดการ Rate Limits',
  '/admin/notifications': 'การแจ้งเตือน',
};

interface AdminHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function AdminHeader({ onRefresh, isRefreshing }: AdminHeaderProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCount, setActiveCount] = useState(0);

  const fetchActiveCount = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/notifications?status=active&limit=1');
      if (res.ok) {
        const data = await res.json();
        setActiveCount(data.active_count ?? 0);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchActiveCount();
    const interval = setInterval(fetchActiveCount, 60_000);
    return () => clearInterval(interval);
  }, [fetchActiveCount]);

  // Build breadcrumbs
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    return {
      name: pageNames[path] || segment,
      path,
    };
  });

  const currentPage = pageNames[pathname] || 'Admin';

  return (
    <header className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-neutral-600" />
              {index === breadcrumbs.length - 1 ? (
                <span className="text-white font-medium">{crumb.name}</span>
              ) : (
                <Link
                  href={crumb.path}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  {crumb.name}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="ค้นหา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 h-9 pl-10 pr-4 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
            />
          </div>

          {/* Refresh */}
          {onRefresh && (
            <motion.button
              onClick={onRefresh}
              disabled={isRefreshing}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'h-9 w-9 flex items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors',
                isRefreshing && 'opacity-50 cursor-not-allowed'
              )}
            >
              <RefreshCw className={cn(
                'h-4 w-4',
                isRefreshing && 'animate-spin'
              )} />
            </motion.button>
          )}

          {/* Notifications */}
          <Link href="/admin/notifications">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative h-9 w-9 flex items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
            >
              <Bell className="h-4 w-4" />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                  {activeCount > 9 ? '9+' : activeCount}
                </span>
              )}
            </motion.div>
          </Link>

          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs text-green-400 font-medium">Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}
