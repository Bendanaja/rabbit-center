'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  User,
  Clock,
  Filter,
  Search,
  ChevronDown,
  Flag,
} from 'lucide-react';
import Image from 'next/image';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { cn } from '@/lib/utils';

interface FlaggedChat {
  id: string;
  chat_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
  flagged_content: string;
  flagged_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  action_notes: string | null;
}

type FilterStatus = 'all' | 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
type FilterSeverity = 'all' | 'low' | 'medium' | 'high' | 'critical';

export default function AdminModerationPage() {
  const [flags, setFlags] = useState<FlaggedChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FlaggedChat | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('all');
  const [search, setSearch] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  const fetchFlags = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        status: filterStatus,
        severity: filterSeverity,
        search,
      });
      const response = await fetch(`/api/admin/moderation?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFlags(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch flags:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus, filterSeverity, search]);

  useEffect(() => {
    setLoading(true);
    const debounce = setTimeout(fetchFlags, 300);
    return () => clearTimeout(debounce);
  }, [fetchFlags]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFlags();
  };

  const handleAction = async (flagId: string, action: 'dismiss' | 'warn' | 'ban') => {
    try {
      const response = await fetch(`/api/admin/moderation/${flagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: actionNotes }),
      });

      if (response.ok) {
        setFlags(flags.map(f =>
          f.id === flagId
            ? { ...f, status: action === 'dismiss' ? 'dismissed' : 'action_taken' }
            : f
        ));
        setSelectedFlag(null);
        setActionNotes('');
      }
    } catch (error) {
      console.error('Failed to process flag:', error);
    }
  };

  const displayFlags = flags;

  const severityColors = {
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-400',
    reviewed: 'bg-blue-500/10 text-blue-400',
    dismissed: 'bg-neutral-500/10 text-neutral-400',
    action_taken: 'bg-green-500/10 text-green-400',
  };

  const reasonLabels: Record<string, string> = {
    inappropriate_content: 'เนื้อหาไม่เหมาะสม',
    spam: 'Spam',
    harassment: 'การคุกคาม',
    hate_speech: 'Hate Speech',
    misinformation: 'ข้อมูลเท็จ',
    other: 'อื่นๆ',
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'เมื่อสักครู่';
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    return `${Math.floor(hours / 24)} วันที่แล้ว`;
  };

  const pendingCount = displayFlags.filter(f => f.status === 'pending').length;
  const criticalCount = displayFlags.filter(f => f.severity === 'critical' && f.status === 'pending').length;

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
            <h1 className="text-2xl font-bold text-white">Content Moderation</h1>
            <p className="text-neutral-400 mt-1">
              ตรวจสอบและจัดการเนื้อหาที่ถูก flag
            </p>
          </div>
          <div className="flex items-center gap-4">
            {criticalCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-red-400 font-medium">{criticalCount} Critical</span>
              </motion.div>
            )}
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-400 font-medium">{pendingCount} รอตรวจสอบ</span>
            </div>
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
              placeholder="ค้นหาผู้ใช้หรือเนื้อหา..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            {(['all', 'pending', 'reviewed', 'dismissed', 'action_taken'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  filterStatus === status
                    ? 'bg-primary-500 text-white'
                    : 'text-neutral-400 hover:text-white'
                )}
              >
                {status === 'all' ? 'ทั้งหมด' :
                 status === 'pending' ? 'รอตรวจสอบ' :
                 status === 'reviewed' ? 'ตรวจแล้ว' :
                 status === 'dismissed' ? 'ปิดแล้ว' : 'ดำเนินการแล้ว'}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map((severity) => (
              <button
                key={severity}
                onClick={() => setFilterSeverity(severity)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  filterSeverity === severity
                    ? severity === 'critical' ? 'bg-red-500 text-white' :
                      severity === 'high' ? 'bg-orange-500 text-white' :
                      severity === 'medium' ? 'bg-yellow-500 text-black' :
                      severity === 'low' ? 'bg-blue-500 text-white' :
                      'bg-primary-500 text-white'
                    : 'text-neutral-400 hover:text-white'
                )}
              >
                {severity === 'all' ? 'ทุกระดับ' : severity.charAt(0).toUpperCase() + severity.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Flags List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-32 bg-neutral-900/50 border border-neutral-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : displayFlags.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-white">ไม่มีรายการรอตรวจสอบ</p>
            <p className="text-neutral-400 mt-1">ระบบทำงานปกติ ไม่พบเนื้อหาที่ต้องตรวจสอบ</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {displayFlags.map((flag, index) => (
              <motion.div
                key={flag.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'p-5 bg-neutral-900/50 border rounded-xl',
                  flag.severity === 'critical' ? 'border-red-500/30' : 'border-neutral-800'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* User Avatar */}
                    <div className="relative h-12 w-12 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                      {flag.user_avatar ? (
                        <Image src={flag.user_avatar} alt="" fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <User className="h-6 w-6 text-neutral-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* User & Meta */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium text-white">{flag.user_name}</span>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium border',
                          severityColors[flag.severity]
                        )}>
                          {flag.severity.toUpperCase()}
                        </span>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          statusColors[flag.status]
                        )}>
                          {flag.status === 'pending' ? 'รอตรวจสอบ' :
                           flag.status === 'reviewed' ? 'ตรวจแล้ว' :
                           flag.status === 'dismissed' ? 'ปิดแล้ว' : 'ดำเนินการแล้ว'}
                        </span>
                      </div>

                      {/* Reason & Time */}
                      <div className="flex items-center gap-4 mt-1 text-sm text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Flag className="h-3 w-3" />
                          {reasonLabels[flag.reason] || flag.reason}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getTimeAgo(flag.flagged_at)}
                        </span>
                      </div>

                      {/* Content Preview */}
                      <p className="mt-3 text-neutral-300 line-clamp-2">
                        {flag.flagged_content}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedFlag(flag)}
                      className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <Eye className="h-5 w-5" />
                    </motion.button>
                    {flag.status === 'pending' && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAction(flag.id, 'dismiss')}
                          className="p-2 text-neutral-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedFlag(flag);
                          }}
                          className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <XCircle className="h-5 w-5" />
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedFlag && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setSelectedFlag(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-500/10 rounded-xl">
                    <AlertTriangle className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">รายละเอียด Flag</h3>
                    <p className="text-sm text-neutral-400">{selectedFlag.user_name}</p>
                  </div>
                </div>
                <span className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium border',
                  severityColors[selectedFlag.severity]
                )}>
                  {selectedFlag.severity.toUpperCase()}
                </span>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    เหตุผลที่ถูก Flag
                  </label>
                  <p className="text-white">{reasonLabels[selectedFlag.reason] || selectedFlag.reason}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    เนื้อหาที่ถูก Flag
                  </label>
                  <div className="p-4 bg-neutral-800/50 border border-neutral-700 rounded-lg">
                    <p className="text-neutral-300 whitespace-pre-wrap">{selectedFlag.flagged_content}</p>
                  </div>
                </div>

                {selectedFlag.status === 'pending' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">
                      บันทึกการดำเนินการ
                    </label>
                    <textarea
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="ระบุเหตุผลในการดำเนินการ..."
                      rows={3}
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedFlag.status === 'pending' && (
                <div className="flex gap-3 mt-6 pt-6 border-t border-neutral-800">
                  <button
                    onClick={() => setSelectedFlag(null)}
                    className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => handleAction(selectedFlag.id, 'dismiss')}
                    className="flex-1 px-4 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
                  >
                    ปิด Flag
                  </button>
                  <button
                    onClick={() => handleAction(selectedFlag.id, 'warn')}
                    className="flex-1 px-4 py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-colors"
                  >
                    เตือน
                  </button>
                  <button
                    onClick={() => handleAction(selectedFlag.id, 'ban')}
                    className="flex-1 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  >
                    แบน
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
