'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Megaphone,
  ExternalLink,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';
import { useRealtime } from '@/hooks/useRealtime';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success' | 'promotional';
  action_url: string | null;
  action_label: string | null;
  created_at: string;
  is_read: boolean;
  is_dismissed: boolean;
}

const typeConfig = {
  info: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Info },
  success: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle },
  warning: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: AlertTriangle },
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertCircle },
  promotional: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: Megaphone },
};

interface NotificationBellProps {
  userId?: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await authFetch('/api/user/notifications');
      if (res.ok) {
        const data: Notification[] = await res.json();

        // Show toast for new notifications (not on initial load)
        if (!initialLoadRef.current) {
          const prevIds = prevIdsRef.current;
          for (const n of data) {
            if (!prevIds.has(n.id)) {
              showNotificationToast(n);
            }
          }
        }
        initialLoadRef.current = false;

        prevIdsRef.current = new Set(data.map(n => n.id));
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen to broadcasts table for realtime updates
  const realtimeSubs = useMemo(() => [
    { table: 'broadcasts' },
  ], []);
  useRealtime(realtimeSubs, fetchNotifications, !!userId);

  const showNotificationToast = (n: Notification) => {
    const message = n.title;
    switch (n.type) {
      case 'critical':
        toast.error(message, { description: n.message });
        break;
      case 'warning':
        toast.warning(message, { description: n.message });
        break;
      case 'success':
        toast.success(message, { description: n.message });
        break;
      default:
        toast.info(message, { description: n.message });
        break;
    }
  };

  const handleMarkRead = async (broadcastId: string) => {
    try {
      await authFetch(`/api/user/notifications/${broadcastId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'read' }),
      });
      setNotifications(prev =>
        prev.map(n => n.id === broadcastId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDismiss = async (broadcastId: string) => {
    try {
      await authFetch(`/api/user/notifications/${broadcastId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'dismiss' }),
      });
      setNotifications(prev => prev.filter(n => n.id !== broadcastId));
    } catch (error) {
      console.error('Failed to dismiss:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'ตอนนี้';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ชม.ที่แล้ว`;
    const days = Math.floor(hours / 24);
    return `${days} วันที่แล้ว`;
  };

  if (!userId) return null;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <Bell className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 max-h-[70vh] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                  การแจ้งเตือน
                </h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-neutral-500">
                    {unreadCount} ยังไม่อ่าน
                  </span>
                )}
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto max-h-[calc(70vh-48px)]">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-sm text-neutral-500">ไม่มีการแจ้งเตือน</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((notification) => {
                      const config = typeConfig[notification.type] || typeConfig.info;
                      const TypeIcon = config.icon;

                      return (
                        <motion.div
                          key={notification.id}
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10, height: 0 }}
                          className={cn(
                            'px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors',
                            !notification.is_read && 'bg-blue-50/50 dark:bg-blue-500/5'
                          )}
                        >
                          <div className="flex gap-3">
                            {/* Icon */}
                            <div className={cn('p-1.5 rounded-lg shrink-0 h-fit', config.bg)}>
                              <TypeIcon className={cn('h-4 w-4', config.color)} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className={cn(
                                  'text-sm text-neutral-900 dark:text-white line-clamp-1',
                                  !notification.is_read && 'font-semibold'
                                )}>
                                  {notification.title}
                                </h4>
                                {/* Actions */}
                                <div className="flex items-center gap-0.5 shrink-0">
                                  {!notification.is_read && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkRead(notification.id);
                                      }}
                                      className="p-1 text-neutral-400 hover:text-blue-400 rounded transition-colors"
                                      title="อ่านแล้ว"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDismiss(notification.id);
                                    }}
                                    className="p-1 text-neutral-400 hover:text-red-400 rounded transition-colors"
                                    title="ซ่อน"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>

                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-neutral-400">
                                  {getTimeAgo(notification.created_at)}
                                </span>
                                {notification.action_url && notification.action_label && (
                                  <a
                                    href={notification.action_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[10px] font-medium text-primary-500 hover:text-primary-400 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {notification.action_label}
                                    <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
