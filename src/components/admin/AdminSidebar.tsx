'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Bot,
  BarChart3,
  Settings,
  Shield,
  CreditCard,
  History,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Crown,
  UserCog,
  Activity,
} from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_NAV_ITEMS, hasPermission } from '@/types/admin';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  Bot,
  BarChart3,
  Settings,
  Shield,
  CreditCard,
  History,
  UserCog,
  Activity,
};

const roleColors = {
  owner: 'bg-gradient-to-r from-amber-500 to-orange-500',
  admin: 'bg-gradient-to-r from-primary-500 to-primary-600',
  moderator: 'bg-gradient-to-r from-blue-500 to-blue-600',
};

const roleIcons = {
  owner: Crown,
  admin: UserCog,
  moderator: Shield,
};

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { role, adminData } = useAdmin();
  const { signOut } = useAuth();

  const RoleIcon = role ? roleIcons[role] : UserCog;

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 80 },
  };

  const textVariants = {
    expanded: { opacity: 1, x: 0, display: 'block' },
    collapsed: { opacity: 0, x: -10, display: 'none' },
  };

  return (
    <motion.aside
      initial={false}
      animate={collapsed ? 'collapsed' : 'expanded'}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'fixed left-0 top-0 h-screen bg-neutral-950 border-r border-neutral-800 z-40 flex flex-col',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-800">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-xl overflow-hidden shrink-0">
            <Image
              src="/images/logo.jpg"
              alt="RabbitHub"
              fill
              className="object-cover"
            />
          </div>
          <motion.div
            variants={textVariants}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <h1 className="font-bold text-lg text-white">RabbitHub</h1>
            <p className="text-xs text-neutral-400">Admin Panel</p>
          </motion.div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {ADMIN_NAV_ITEMS.map((item) => {
          if (item.permission && role && !hasPermission(role, item.permission)) {
            return null;
          }

          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                isActive
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className={cn(
                'h-5 w-5 shrink-0 transition-transform group-hover:scale-110',
                isActive && 'text-primary-400'
              )} />
              <motion.span
                variants={textVariants}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium whitespace-nowrap"
              >
                {item.name}
              </motion.span>
              {item.badge && item.badge > 0 && (
                <motion.span
                  variants={textVariants}
                  className="ml-auto bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full"
                >
                  {item.badge}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-neutral-800">
        <div className={cn(
          'flex items-center gap-3 p-3 rounded-lg bg-neutral-900/50',
          collapsed && 'justify-center'
        )}>
          <div className={cn(
            'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
            role && roleColors[role]
          )}>
            <RoleIcon className="h-4 w-4 text-white" />
          </div>
          <motion.div
            variants={textVariants}
            transition={{ duration: 0.2 }}
            className="flex-1 min-w-0"
          >
            <p className="text-sm font-medium text-white truncate">
              {adminData?.user_profile?.full_name || 'Admin'}
            </p>
            <p className="text-xs text-neutral-400 capitalize">{role}</p>
          </motion.div>
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut()}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 mt-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <motion.span
            variants={textVariants}
            transition={{ duration: 0.2 }}
            className="text-sm font-medium"
          >
            ออกจากระบบ
          </motion.span>
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 h-6 w-6 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors z-50"
      >
        <motion.div
          animate={{ rotate: collapsed ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronLeft className="h-4 w-4" />
        </motion.div>
      </button>
    </motion.aside>
  );
}
