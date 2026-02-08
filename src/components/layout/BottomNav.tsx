'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  MessageSquare,
  Gift,
  Settings,
  LogIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const baseNavItems = [
  {
    href: '/',
    label: 'หน้าแรก',
    icon: Home,
  },
  {
    href: '/chat',
    label: 'แชท',
    icon: MessageSquare,
    highlight: true,
  },
  {
    href: '/free-access',
    label: 'ใช้ฟรี',
    icon: Gift,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Show settings if logged in, otherwise show login
  const navItems = [
    ...baseNavItems,
    user
      ? { href: '/settings', label: 'ตั้งค่า', icon: Settings }
      : { href: '/auth/login', label: 'เข้าสู่ระบบ', icon: LogIn },
  ];

  // Don't show on chat page (has its own navigation)
  if (pathname === '/chat') return null;

  // Don't show on auth pages
  if (pathname.startsWith('/auth')) return null;

  return (
    <>
      {/* Spacer for bottom nav */}
      <div className="h-20 md:hidden" />

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {/* Gradient background blur */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white to-white/80 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900/80 backdrop-blur-xl" />

        {/* Top border glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

        <div className="relative safe-area-inset-bottom">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-2xl transition-all duration-300',
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-neutral-500 dark:text-neutral-400 active:scale-95'
                  )}
                >
                  {/* Active background */}
                  {isActive && (
                    <motion.div
                      layoutId="bottomnav-active"
                      className="absolute inset-0 bg-primary-50 dark:bg-primary-900/30 rounded-2xl"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}

                  {/* Highlight button (Chat) - static dot */}
                  {item.highlight && !isActive && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                      <div
                        className="w-2 h-2 rounded-full bg-primary-500 animate-[navDotPulse_1.5s_ease-in-out_infinite]"
                        style={{ willChange: 'transform' }}
                      />
                    </div>
                  )}

                  <div className="relative z-10 flex flex-col items-center">
                    <motion.div
                      animate={isActive ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      style={{ willChange: 'transform' }}
                    >
                      <Icon
                        className={cn(
                          'h-6 w-6 transition-colors',
                          isActive
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-neutral-500 dark:text-neutral-400'
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    </motion.div>

                    <span
                      className={cn(
                        'mt-1 text-[10px] font-medium transition-colors',
                        isActive
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-neutral-500 dark:text-neutral-400'
                      )}
                    >
                      {item.label}
                    </span>
                  </div>

                  {/* Active indicator dot */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary-500"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
