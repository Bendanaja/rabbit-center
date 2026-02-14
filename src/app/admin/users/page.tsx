'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Ban,
  MoreHorizontal,
  Calendar,
  MessageSquare,
  Crown,
  Shield,
  X,
  Check,
  AlertTriangle,
  ChevronDown,
  Star,
  Zap,
  User as UserIcon,
} from 'lucide-react';
import Image from 'next/image';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTable, Column } from '@/components/admin/AdminTable';
import { useAdmin } from '@/hooks/useAdmin';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  subscription_tier: string;
  subscription_status: string | null;
  total_messages: number;
  is_banned: boolean;
  ban_reason: string | null;
}

type PlanType = 'free' | 'starter' | 'pro' | 'premium';

const planConfig: Record<PlanType, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  free: { label: 'Free', icon: UserIcon, color: 'text-neutral-400', bgColor: 'bg-neutral-500/10' },
  starter: { label: 'Starter', icon: Zap, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  pro: { label: 'Pro', icon: Star, color: 'text-primary-400', bgColor: 'bg-primary-500/10' },
  premium: { label: 'Premium', icon: Crown, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
};

export default function AdminUsersPage() {
  const { role } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | PlanType>('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [changingPlan, setChangingPlan] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        search,
        status: statusFilter,
        sortBy,
        sortOrder,
      });
      if (planFilter !== 'all') {
        params.set('plan', planFilter);
      }

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search, statusFilter, planFilter, sortBy, sortOrder]);

  useEffect(() => {
    setLoading(true);
    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.user_id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: banReason,
          is_permanent: true,
        }),
      });

      if (response.ok) {
        setShowBanModal(false);
        setBanReason('');
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to ban user:', error);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to unban user:', error);
    }
  };

  const handleChangePlan = async (userId: string, newPlan: PlanType) => {
    setChangingPlan(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      });

      if (response.ok) {
        setShowPlanModal(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to change plan:', error);
    } finally {
      setChangingPlan(false);
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'user',
      title: 'ผู้ใช้',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-full overflow-hidden bg-neutral-800">
            {row.avatar_url ? (
              <Image src={row.avatar_url} alt="" fill className="object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-neutral-400">
                {(row.full_name || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-white">{row.full_name || 'ไม่ระบุชื่อ'}</p>
            <p className="text-xs text-neutral-500">{row.user_id.slice(0, 8)}...</p>
          </div>
        </div>
      ),
    },
    {
      key: 'subscription_tier',
      title: 'แผน',
      sortable: true,
      render: (row) => {
        const plan = planConfig[(row.subscription_tier as PlanType) || 'free'] || planConfig.free;
        const PlanIcon = plan.icon;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(row);
              setShowPlanModal(true);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:ring-2 hover:ring-white/20',
              plan.bgColor,
              plan.color,
            )}
            title="คลิกเพื่อเปลี่ยนแผน"
          >
            <PlanIcon className="h-3 w-3" />
            {plan.label}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </button>
        );
      },
    },
    {
      key: 'total_messages',
      title: 'ข้อความ',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2 text-neutral-300">
          <MessageSquare className="h-4 w-4 text-neutral-500" />
          {row.total_messages.toLocaleString()}
        </div>
      ),
    },
    {
      key: 'created_at',
      title: 'สมัครเมื่อ',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2 text-neutral-400 text-sm">
          <Calendar className="h-4 w-4" />
          {new Date(row.created_at).toLocaleDateString('th-TH')}
        </div>
      ),
    },
    {
      key: 'last_sign_in_at',
      title: 'ใช้งานล่าสุด',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-neutral-400">
          {row.last_sign_in_at
            ? new Date(row.last_sign_in_at).toLocaleDateString('th-TH')
            : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'สถานะ',
      render: (row) => (
        <span className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
          row.is_banned
            ? 'bg-red-500/10 text-red-400'
            : 'bg-green-500/10 text-green-400'
        )}>
          {row.is_banned ? (
            <>
              <Ban className="h-3 w-3" />
              ถูกแบน
            </>
          ) : (
            <>
              <Check className="h-3 w-3" />
              ปกติ
            </>
          )}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '',
      width: '120px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(row);
              setShowDetailModal(true);
            }}
            className="p-2 text-neutral-400 hover:bg-neutral-800 rounded-lg transition-colors"
            title="ดูรายละเอียด"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {row.is_banned ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUnbanUser(row.user_id);
              }}
              className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
              title="ปลดแบน"
            >
              <Check className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedUser(row);
                setShowBanModal(true);
              }}
              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="แบน"
            >
              <Ban className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

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
            <h1 className="text-2xl font-bold text-white">จัดการผู้ใช้</h1>
            <p className="text-neutral-400 mt-1">
              จัดการผู้ใช้ทั้งหมด {total.toLocaleString()} คน
            </p>
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
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="ค้นหาผู้ใช้ (ชื่อ, อีเมล)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            {(['all', 'active', 'banned'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-4 py-1.5 rounded-md text-sm transition-colors',
                  statusFilter === status
                    ? 'bg-primary-500 text-white'
                    : 'text-neutral-400 hover:text-white'
                )}
              >
                {status === 'all' ? 'ทั้งหมด' : status === 'active' ? 'ปกติ' : 'ถูกแบน'}
              </button>
            ))}
          </div>

          {/* Plan Filter */}
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            {(['all', 'free', 'starter', 'pro', 'premium'] as const).map((plan) => (
              <button
                key={plan}
                onClick={() => setPlanFilter(plan)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  planFilter === plan
                    ? 'bg-primary-500 text-white'
                    : 'text-neutral-400 hover:text-white'
                )}
              >
                {plan === 'all' ? 'ทุกแผน' : planConfig[plan]?.label || plan}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AdminTable
            columns={columns}
            data={users}
            loading={loading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            getRowId={(row) => row.user_id}
            emptyMessage="ไม่พบผู้ใช้"
          />
        </motion.div>
      </div>

      {/* Plan Change Modal */}
      <AnimatePresence>
        {showPlanModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowPlanModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">เปลี่ยนแผนผู้ใช้</h3>
                  <p className="text-sm text-neutral-400 mt-1">
                    {selectedUser.full_name || 'ไม่ระบุชื่อ'}
                  </p>
                </div>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="p-2 text-neutral-400 hover:text-white rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                {(Object.entries(planConfig) as [PlanType, typeof planConfig[PlanType]][]).map(([planId, config]) => {
                  const isCurrentPlan = (selectedUser.subscription_tier || 'free') === planId;
                  const PlanIcon = config.icon;
                  return (
                    <button
                      key={planId}
                      onClick={() => !isCurrentPlan && handleChangePlan(selectedUser.user_id, planId)}
                      disabled={isCurrentPlan || changingPlan}
                      className={cn(
                        'w-full flex items-center gap-3 p-4 rounded-xl border transition-all',
                        isCurrentPlan
                          ? 'border-primary-500 bg-primary-500/10 cursor-default'
                          : 'border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800/50 cursor-pointer',
                        changingPlan && !isCurrentPlan && 'opacity-50 cursor-not-allowed',
                      )}
                    >
                      <div className={cn('p-2 rounded-lg', config.bgColor)}>
                        <PlanIcon className={cn('h-5 w-5', config.color)} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-white">{config.label}</p>
                        <p className="text-xs text-neutral-400">
                          {planId === 'free' ? 'ฟรี' : planId === 'starter' ? '199 บาท/เดือน' : planId === 'pro' ? '499 บาท/เดือน' : '799 บาท/เดือน'}
                        </p>
                      </div>
                      {isCurrentPlan && (
                        <span className="text-xs font-medium text-primary-400 bg-primary-500/10 px-2 py-1 rounded-full">
                          แผนปัจจุบัน
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">รายละเอียดผู้ใช้</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 text-neutral-400 hover:text-white rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 rounded-full overflow-hidden bg-neutral-800">
                    {selectedUser.avatar_url ? (
                      <Image src={selectedUser.avatar_url} alt="" fill className="object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-2xl text-neutral-400">
                        {(selectedUser.full_name || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-white">{selectedUser.full_name || 'ไม่ระบุชื่อ'}</p>
                    <p className="text-sm text-neutral-400">ID: {selectedUser.user_id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-800/50 rounded-xl">
                  <div>
                    <p className="text-xs text-neutral-500">แผน</p>
                    <p className="text-sm font-medium text-white mt-1">
                      {planConfig[(selectedUser.subscription_tier as PlanType) || 'free']?.label || 'Free'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">สถานะ</p>
                    <p className={cn('text-sm font-medium mt-1', selectedUser.is_banned ? 'text-red-400' : 'text-green-400')}>
                      {selectedUser.is_banned ? 'ถูกแบน' : 'ปกติ'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">ข้อความทั้งหมด</p>
                    <p className="text-sm font-medium text-white mt-1">{selectedUser.total_messages.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">สมัครเมื่อ</p>
                    <p className="text-sm font-medium text-white mt-1">
                      {new Date(selectedUser.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">ใช้งานล่าสุด</p>
                    <p className="text-sm font-medium text-white mt-1">
                      {selectedUser.last_sign_in_at
                        ? new Date(selectedUser.last_sign_in_at).toLocaleDateString('th-TH')
                        : '-'}
                    </p>
                  </div>
                  {selectedUser.ban_reason && (
                    <div className="col-span-2">
                      <p className="text-xs text-neutral-500">เหตุผลที่แบน</p>
                      <p className="text-sm font-medium text-red-400 mt-1">{selectedUser.ban_reason}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowPlanModal(true);
                    }}
                    className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm"
                  >
                    เปลี่ยนแผน
                  </button>
                  {selectedUser.is_banned ? (
                    <button
                      onClick={() => {
                        handleUnbanUser(selectedUser.user_id);
                        setShowDetailModal(false);
                      }}
                      className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
                    >
                      ปลดแบน
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowBanModal(true);
                      }}
                      className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                    >
                      แบนผู้ใช้
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ban Modal */}
      <AnimatePresence>
        {showBanModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowBanModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-500/10 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">แบนผู้ใช้</h3>
                  <p className="text-sm text-neutral-400">
                    {selectedUser.full_name || 'ผู้ใช้'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    เหตุผลในการแบน
                  </label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="ระบุเหตุผล..."
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBanModal(false)}
                    className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleBanUser}
                    disabled={!banReason}
                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    แบนผู้ใช้
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
