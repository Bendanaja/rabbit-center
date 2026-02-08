'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  UserPlus,
  Ban,
  MoreHorizontal,
  Mail,
  Calendar,
  MessageSquare,
  Crown,
  Shield,
  X,
  Check,
  AlertTriangle,
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
  subscription_tier: string;
  subscription_status: string | null;
  total_messages: number;
  is_banned: boolean;
  ban_reason: string | null;
}

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
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');

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
  }, [page, search, statusFilter, sortBy, sortOrder]);

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
          admin_user_id: 'current-admin-id', // TODO: Get from auth
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
        body: JSON.stringify({ admin_user_id: 'current-admin-id' }),
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to unban user:', error);
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
      render: (row) => (
        <span className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
          row.subscription_tier === 'enterprise' && 'bg-purple-500/10 text-purple-400',
          row.subscription_tier === 'pro' && 'bg-primary-500/10 text-primary-400',
          row.subscription_tier === 'free' && 'bg-neutral-500/10 text-neutral-400'
        )}>
          {row.subscription_tier === 'enterprise' && <Crown className="h-3 w-3" />}
          {row.subscription_tier === 'pro' && <Shield className="h-3 w-3" />}
          {row.subscription_tier.charAt(0).toUpperCase() + row.subscription_tier.slice(1)}
        </span>
      ),
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
      width: '100px',
      render: (row) => (
        <div className="flex items-center gap-2">
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
          <button className="p-2 text-neutral-400 hover:bg-neutral-800 rounded-lg transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
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
              placeholder="ค้นหาผู้ใช้..."
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
