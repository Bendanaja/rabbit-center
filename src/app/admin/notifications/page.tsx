'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Megaphone,
  BarChart3,
  Send,
  Clock,
  Users,
  ExternalLink,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { StatsCard } from '@/components/admin/StatsCard';
import { cn } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';
import { toast } from 'sonner';

type BroadcastType = 'info' | 'warning' | 'critical' | 'success' | 'promotional';

interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: BroadcastType;
  target_plan: string | null;
  action_url: string | null;
  action_label: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  read_count?: number;
  dismiss_count?: number;
}

interface BroadcastStats {
  total_read: number;
  total_dismissed: number;
}

const typeConfig: Record<BroadcastType, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  info: { label: 'ข้อมูล', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', icon: Info },
  success: { label: 'สำเร็จ', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20', icon: CheckCircle },
  warning: { label: 'เตือน', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20', icon: AlertTriangle },
  critical: { label: 'สำคัญ', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20', icon: AlertCircle },
  promotional: { label: 'โปรโมชั่น', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', icon: Megaphone },
};

const planLabels: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  premium: 'Premium',
};

const defaultForm = {
  title: '',
  message: '',
  type: 'info' as BroadcastType,
  target_plan: '' as string,
  action_url: '',
  action_label: '',
  expires_at: '',
};

export default function AdminNotificationsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [stats, setStats] = useState({ total: 0, active: 0, totalReads: 0, totalDismissed: 0 });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  // Stats modal
  const [statsModal, setStatsModal] = useState<{ broadcast: Broadcast; stats: BroadcastStats } | null>(null);

  const fetchBroadcasts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: filter });
      const response = await authFetch(`/api/admin/notifications?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBroadcasts(data.broadcasts || []);
        setStats({
          total: data.total || 0,
          active: data.active_count || 0,
          totalReads: (data.broadcasts || []).reduce((sum: number, b: Broadcast) => sum + (b.read_count || 0), 0),
          totalDismissed: (data.broadcasts || []).reduce((sum: number, b: Broadcast) => sum + (b.dismiss_count || 0), 0),
        });
      }
    } catch (error) {
      console.error('Failed to fetch broadcasts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBroadcasts();
  };

  const openCreateModal = () => {
    setForm(defaultForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (broadcast: Broadcast) => {
    setForm({
      title: broadcast.title,
      message: broadcast.message,
      type: broadcast.type,
      target_plan: broadcast.target_plan || '',
      action_url: broadcast.action_url || '',
      action_label: broadcast.action_label || '',
      expires_at: broadcast.expires_at ? broadcast.expires_at.slice(0, 16) : '',
    });
    setEditingId(broadcast.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('กรุณากรอก Title และ Message');
      return;
    }
    if (form.title.length > 255) {
      toast.error('Title ต้องไม่เกิน 255 ตัวอักษร');
      return;
    }
    if (form.message.length > 2000) {
      toast.error('Message ต้องไม่เกิน 2,000 ตัวอักษร');
      return;
    }

    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        target_plan: form.target_plan || null,
        action_url: form.action_url.trim() || null,
        action_label: form.action_label.trim() || null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      };

      const url = editingId
        ? `/api/admin/notifications/${editingId}`
        : '/api/admin/notifications';
      const method = editingId ? 'PUT' : 'POST';

      const response = await authFetch(url, {
        method,
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingId ? 'อัปเดตการแจ้งเตือนแล้ว' : 'สร้างการแจ้งเตือนแล้ว');
        setShowModal(false);
        fetchBroadcasts();
      } else {
        const err = await response.json();
        toast.error(err.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (broadcast: Broadcast) => {
    try {
      const response = await authFetch(`/api/admin/notifications/${broadcast.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !broadcast.is_active }),
      });
      if (response.ok) {
        setBroadcasts(prev =>
          prev.map(b => b.id === broadcast.id ? { ...b, is_active: !b.is_active } : b)
        );
        toast.success(broadcast.is_active ? 'ปิดการแจ้งเตือนแล้ว' : 'เปิดการแจ้งเตือนแล้ว');
      }
    } catch (error) {
      console.error('Toggle error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await authFetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setBroadcasts(prev => prev.filter(b => b.id !== id));
        toast.success('ลบการแจ้งเตือนแล้ว');
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleViewStats = async (broadcast: Broadcast) => {
    try {
      const response = await authFetch(`/api/admin/notifications/${broadcast.id}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStatsModal({ broadcast, stats: data });
      }
    } catch (error) {
      console.error('Stats error:', error);
    }
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'เมื่อสักครู่';
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} วันที่แล้ว`;
    return `${Math.floor(days / 30)} เดือนที่แล้ว`;
  };

  const isExpired = (broadcast: Broadcast) => {
    if (!broadcast.expires_at) return false;
    return new Date(broadcast.expires_at) <= new Date();
  };

  return (
    <div className="min-h-screen">
      <AdminHeader onRefresh={handleRefresh} isRefreshing={refreshing} />

      <div className="p-6 space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">การแจ้งเตือน</h1>
            <p className="text-neutral-400 mt-1">จัดการ Broadcast Notifications ถึงผู้ใช้งาน</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="h-4 w-4" />
            สร้างการแจ้งเตือน
          </motion.button>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="การแจ้งเตือนทั้งหมด"
            value={stats.total}
            icon={<Bell className="h-5 w-5" />}
            color="blue"
            delay={0}
            loading={loading}
          />
          <StatsCard
            title="กำลังใช้งาน"
            value={stats.active}
            icon={<Send className="h-5 w-5" />}
            color="green"
            delay={0.1}
            loading={loading}
          />
          <StatsCard
            title="ยอดอ่านรวม"
            value={stats.totalReads}
            icon={<Eye className="h-5 w-5" />}
            color="purple"
            delay={0.2}
            loading={loading}
          />
          <StatsCard
            title="ยอด Dismiss รวม"
            value={stats.totalDismissed}
            icon={<X className="h-5 w-5" />}
            color="orange"
            delay={0.3}
            loading={loading}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-1 w-fit">
          {(['all', 'active', 'expired'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm transition-colors',
                filter === status
                  ? 'bg-primary-500 text-white'
                  : 'text-neutral-400 hover:text-white'
              )}
            >
              {status === 'all' ? 'ทั้งหมด' : status === 'active' ? 'ใช้งาน' : 'หมดอายุ'}
            </button>
          ))}
        </div>

        {/* Broadcasts List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-neutral-900/50 border border-neutral-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : broadcasts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Bell className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
            <p className="text-lg font-medium text-white">ยังไม่มีการแจ้งเตือน</p>
            <p className="text-neutral-400 mt-1">สร้างการแจ้งเตือนแรกเพื่อส่งถึงผู้ใช้งาน</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((broadcast, index) => {
              const config = typeConfig[broadcast.type] || typeConfig.info;
              const TypeIcon = config.icon;
              const expired = isExpired(broadcast);

              return (
                <motion.div
                  key={broadcast.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    'p-5 bg-neutral-900/50 border rounded-xl transition-colors',
                    !broadcast.is_active || expired
                      ? 'border-neutral-800 opacity-60'
                      : config.borderColor
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Type Icon */}
                      <div className={cn('p-2.5 rounded-xl shrink-0', config.bgColor)}>
                        <TypeIcon className={cn('h-5 w-5', config.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Title & Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-white truncate">{broadcast.title}</h3>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            config.bgColor, config.color
                          )}>
                            {config.label}
                          </span>
                          {broadcast.target_plan && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300">
                              {planLabels[broadcast.target_plan] || broadcast.target_plan}
                            </span>
                          )}
                          {!broadcast.is_active && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-500">
                              ปิดใช้งาน
                            </span>
                          )}
                          {expired && broadcast.is_active && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                              หมดอายุ
                            </span>
                          )}
                        </div>

                        {/* Message Preview */}
                        <p className="text-sm text-neutral-400 mt-1 line-clamp-1">{broadcast.message}</p>

                        {/* Meta */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getTimeAgo(broadcast.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {broadcast.read_count || 0} อ่านแล้ว
                          </span>
                          {broadcast.action_url && (
                            <span className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              CTA
                            </span>
                          )}
                          {broadcast.expires_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              หมดอายุ: {new Date(broadcast.expires_at).toLocaleDateString('th-TH')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleActive(broadcast)}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          broadcast.is_active
                            ? 'text-green-400 hover:bg-green-500/10'
                            : 'text-neutral-500 hover:bg-neutral-800'
                        )}
                        title={broadcast.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                      >
                        {broadcast.is_active ? (
                          <ToggleRight className="h-5 w-5" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(broadcast)}
                        className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                        title="แก้ไข"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleViewStats(broadcast)}
                        className="p-2 text-neutral-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="ดูสถิติ"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(broadcast.id)}
                        className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                <h3 className="text-lg font-semibold text-white">
                  {editingId ? 'แก้ไขการแจ้งเตือน' : 'สร้างการแจ้งเตือนใหม่'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    หัวข้อ <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="หัวข้อการแจ้งเตือน"
                    maxLength={255}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                  <p className="text-xs text-neutral-500 mt-1">{form.title.length}/255</p>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    ข้อความ <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="รายละเอียดการแจ้งเตือน..."
                    rows={4}
                    maxLength={2000}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
                  />
                  <p className="text-xs text-neutral-500 mt-1">{form.message.length}/2,000</p>
                </div>

                {/* Type & Target Plan */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">ประเภท</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as BroadcastType })}
                      className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    >
                      {Object.entries(typeConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">กลุ่มเป้าหมาย</label>
                    <select
                      value={form.target_plan}
                      onChange={(e) => setForm({ ...form, target_plan: e.target.value })}
                      className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    >
                      <option value="">ทุกคน</option>
                      <option value="free">Free</option>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                </div>

                {/* Action URL & Label */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Action URL <span className="text-neutral-500">(ไม่บังคับ)</span>
                    </label>
                    <input
                      type="text"
                      value={form.action_url}
                      onChange={(e) => setForm({ ...form, action_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Action Label <span className="text-neutral-500">(ไม่บังคับ)</span>
                    </label>
                    <input
                      type="text"
                      value={form.action_label}
                      onChange={(e) => setForm({ ...form, action_label: e.target.value })}
                      placeholder="ดูรายละเอียด"
                      maxLength={100}
                      className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>
                </div>

                {/* Expires At */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    หมดอายุ <span className="text-neutral-500">(ไม่บังคับ)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>

                {/* Preview */}
                {form.title && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">ตัวอย่าง</label>
                    <div className={cn(
                      'p-4 rounded-xl border',
                      typeConfig[form.type]?.bgColor || 'bg-blue-500/10',
                      typeConfig[form.type]?.borderColor || 'border-blue-500/20'
                    )}>
                      <div className="flex items-start gap-3">
                        {(() => {
                          const PreviewIcon = typeConfig[form.type]?.icon || Info;
                          return <PreviewIcon className={cn('h-5 w-5 mt-0.5 shrink-0', typeConfig[form.type]?.color || 'text-blue-400')} />;
                        })()}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-sm">{form.title}</h4>
                          {form.message && (
                            <p className="text-xs text-neutral-300 mt-1 line-clamp-2">{form.message}</p>
                          )}
                          {form.action_url && form.action_label && (
                            <button className="mt-2 px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors">
                              {form.action_label}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 p-6 border-t border-neutral-800">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title.trim() || !form.message.trim()}
                  className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {editingId ? 'อัปเดต' : 'สร้างและส่ง'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Modal */}
      <AnimatePresence>
        {statsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setStatsModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">สถิติการแจ้งเตือน</h3>
                <button
                  onClick={() => setStatsModal(null)}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-neutral-800/50 rounded-xl">
                  <p className="text-sm text-neutral-400">หัวข้อ</p>
                  <p className="text-white font-medium mt-1">{statsModal.broadcast.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                    <p className="text-2xl font-bold text-blue-400">{statsModal.stats.total_read}</p>
                    <p className="text-xs text-neutral-400 mt-1">อ่านแล้ว</p>
                  </div>
                  <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-center">
                    <p className="text-2xl font-bold text-orange-400">{statsModal.stats.total_dismissed}</p>
                    <p className="text-xs text-neutral-400 mt-1">Dismissed</p>
                  </div>
                </div>

                <div className="text-xs text-neutral-500 text-center pt-2">
                  สร้างเมื่อ {new Date(statsModal.broadcast.created_at).toLocaleString('th-TH')}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
