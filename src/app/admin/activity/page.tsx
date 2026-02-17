'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  User,
  Settings,
  Shield,
  Bot,
  CreditCard,
  Ban,
  Clock,
  Search,
  Filter,
  ChevronDown,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  LogIn,
  LogOut,
} from 'lucide-react';
import Image from 'next/image';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { cn } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';

interface ActivityLog {
  id: string;
  admin_user_id: string;
  admin_name: string;
  admin_avatar: string | null;
  admin_role: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

type FilterAction = 'all' | 'create' | 'update' | 'delete' | 'login' | 'ban';
type FilterResource = 'all' | 'user' | 'model' | 'setting' | 'subscription' | 'moderation';

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<FilterAction>('all');
  const [filterResource, setFilterResource] = useState<FilterResource>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '30',
        search,
        action: filterAction,
        resource: filterResource,
      });

      const response = await authFetch(`/api/admin/activity?${params}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search, filterAction, filterResource]);

  useEffect(() => {
    setLoading(true);
    const debounce = setTimeout(fetchActivities, 300);
    return () => clearTimeout(debounce);
  }, [fetchActivities]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const displayActivities = activities;

  const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    create: Plus,
    update: Edit,
    delete: Trash2,
    login: LogIn,
    logout: LogOut,
    ban: Ban,
    view: Eye,
  };

  const actionColors: Record<string, string> = {
    create: 'text-green-400 bg-green-500/10',
    update: 'text-blue-400 bg-blue-500/10',
    delete: 'text-red-400 bg-red-500/10',
    login: 'text-purple-400 bg-purple-500/10',
    logout: 'text-neutral-400 bg-neutral-500/10',
    ban: 'text-orange-400 bg-orange-500/10',
    view: 'text-cyan-400 bg-cyan-500/10',
  };

  const resourceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    user: User,
    model: Bot,
    setting: Settings,
    subscription: CreditCard,
    moderation: Shield,
    session: Activity,
  };

  const roleColors: Record<string, string> = {
    owner: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    admin: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
    moderator: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'เมื่อสักครู่';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    if (days < 7) return `${days} วันที่แล้ว`;
    return new Date(date).toLocaleDateString('th-TH');
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'สร้าง',
      update: 'แก้ไข',
      delete: 'ลบ',
      login: 'เข้าสู่ระบบ',
      logout: 'ออกจากระบบ',
      ban: 'แบน',
      view: 'ดู',
    };
    return labels[action] || action;
  };

  const getResourceLabel = (resource: string) => {
    const labels: Record<string, string> = {
      user: 'ผู้ใช้',
      model: 'AI Model',
      setting: 'การตั้งค่า',
      subscription: 'Subscription',
      moderation: 'Flag',
      session: 'Session',
    };
    return labels[resource] || resource;
  };

  return (
    <div className="min-h-screen">
      <AdminHeader onRefresh={handleRefresh} isRefreshing={refreshing} />

      <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">Activity Log</h1>
            <p className="text-neutral-400 mt-1">
              ประวัติการดำเนินการทั้งหมดของ Admin
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Clock className="h-4 w-4" />
            <span>เก็บข้อมูล 90 วันย้อนหลัง</span>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-4"
        >
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="ค้นหา admin หรือ resource..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            {(['all', 'create', 'update', 'delete', 'login', 'ban'] as const).map((action) => (
              <button
                key={action}
                onClick={() => setFilterAction(action)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  filterAction === action
                    ? 'bg-primary-500 text-white'
                    : 'text-neutral-400 hover:text-white'
                )}
              >
                {action === 'all' ? 'ทั้งหมด' : getActionLabel(action)}
              </button>
            ))}
          </div>

          {/* Resource Filter */}
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            {(['all', 'user', 'model', 'setting', 'subscription', 'moderation'] as const).map((resource) => (
              <button
                key={resource}
                onClick={() => setFilterResource(resource)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  filterResource === resource
                    ? 'bg-primary-500 text-white'
                    : 'text-neutral-400 hover:text-white'
                )}
              >
                {resource === 'all' ? 'ทุกประเภท' : getResourceLabel(resource)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Activity List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-neutral-900/50 border border-neutral-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : displayActivities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Activity className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-white">ไม่พบกิจกรรม</p>
            <p className="text-neutral-400 mt-1">ยังไม่มีกิจกรรมที่ตรงกับตัวกรองที่เลือก</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {displayActivities.map((activity, index) => {
              const ActionIcon = actionIcons[activity.action] || Activity;
              const ResourceIcon = resourceIcons[activity.resource_type] || Activity;

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setSelectedActivity(activity)}
                  className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl hover:border-neutral-700 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-4">
                    {/* Action Icon */}
                    <div className={cn(
                      'p-2.5 rounded-lg',
                      actionColors[activity.action] || 'bg-neutral-500/10 text-neutral-400'
                    )}>
                      <ActionIcon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">{activity.admin_name}</span>
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-medium border',
                          roleColors[activity.admin_role] || 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                        )}>
                          {activity.admin_role}
                        </span>
                        <span className="text-neutral-400">
                          {getActionLabel(activity.action)}
                        </span>
                        <span className="flex items-center gap-1 text-neutral-300">
                          <ResourceIcon className="h-3 w-3" />
                          {getResourceLabel(activity.resource_type)}
                        </span>
                        {activity.resource_id && (
                          <span className="text-neutral-500 font-mono text-sm">
                            #{activity.resource_id.slice(0, 8)}
                          </span>
                        )}
                      </div>
                      {activity.details && (
                        <p className="text-sm text-neutral-500 mt-1 truncate">
                          {JSON.stringify(activity.details).slice(0, 100)}...
                        </p>
                      )}
                    </div>

                    {/* Time & IP */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-neutral-400">{formatTime(activity.created_at)}</p>
                      {activity.ip_address && (
                        <p className="text-xs text-neutral-600">{activity.ip_address}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'w-8 h-8 rounded-lg text-sm transition-colors',
                  page === p
                    ? 'bg-primary-500 text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setSelectedActivity(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={cn(
                  'p-3 rounded-xl',
                  actionColors[selectedActivity.action] || 'bg-neutral-500/10 text-neutral-400'
                )}>
                  {(() => {
                    const Icon = actionIcons[selectedActivity.action] || Activity;
                    return <Icon className="h-6 w-6" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {getActionLabel(selectedActivity.action)} {getResourceLabel(selectedActivity.resource_type)}
                  </h3>
                  <p className="text-sm text-neutral-400">
                    โดย {selectedActivity.admin_name}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-neutral-500 uppercase tracking-wide">Admin</label>
                    <p className="text-white mt-1">{selectedActivity.admin_name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 uppercase tracking-wide">Role</label>
                    <p className="text-white mt-1">{selectedActivity.admin_role}</p>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 uppercase tracking-wide">เวลา</label>
                    <p className="text-white mt-1">
                      {new Date(selectedActivity.created_at).toLocaleString('th-TH')}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 uppercase tracking-wide">IP Address</label>
                    <p className="text-white mt-1">{selectedActivity.ip_address || 'N/A'}</p>
                  </div>
                </div>

                {selectedActivity.resource_id && (
                  <div>
                    <label className="text-xs text-neutral-500 uppercase tracking-wide">Resource ID</label>
                    <p className="text-white font-mono mt-1">{selectedActivity.resource_id}</p>
                  </div>
                )}

                {selectedActivity.details && (
                  <div>
                    <label className="text-xs text-neutral-500 uppercase tracking-wide">Details</label>
                    <pre className="mt-2 p-4 bg-neutral-800/50 border border-neutral-700 rounded-lg text-sm text-neutral-300 overflow-x-auto">
                      {JSON.stringify(selectedActivity.details, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedActivity.user_agent && (
                  <div>
                    <label className="text-xs text-neutral-500 uppercase tracking-wide">User Agent</label>
                    <p className="text-neutral-400 text-xs mt-1 break-all">{selectedActivity.user_agent}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedActivity(null)}
                className="w-full mt-6 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
              >
                ปิด
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
