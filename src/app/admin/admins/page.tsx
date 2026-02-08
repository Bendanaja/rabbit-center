'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  UserCog,
  Shield,
  Plus,
  X,
  Save,
  Search,
  MoreHorizontal,
  Check,
  AlertTriangle,
  Trash2,
  UserPlus,
} from 'lucide-react';
import Image from 'next/image';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { PermissionGate, OwnerOnly } from '@/components/admin/PermissionGate';
import { PERMISSIONS, AdminRole } from '@/types/admin';
import { cn } from '@/lib/utils';

interface AdminUserData {
  id: string;
  user_id: string;
  role: AdminRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  user_profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUserData | null>(null);
  const [search, setSearch] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>('moderator');

  const fetchAdmins = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/admins');
      if (response.ok) {
        const data = await response.json();
        setAdmins(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdmins();
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail) return;

    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newAdminEmail,
          role: newAdminRole,
        }),
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewAdminEmail('');
        setNewAdminRole('moderator');
        fetchAdmins();
      }
    } catch (error) {
      console.error('Failed to add admin:', error);
    }
  };

  const handleUpdateRole = async (adminId: string, newRole: AdminRole) => {
    try {
      const response = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setAdmins(admins.map(a =>
          a.id === adminId ? { ...a, role: newRole } : a
        ));
        setEditingAdmin(null);
      }
    } catch (error) {
      console.error('Failed to update admin:', error);
    }
  };

  const handleToggleActive = async (adminId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (response.ok) {
        setAdmins(admins.map(a =>
          a.id === adminId ? { ...a, is_active: !isActive } : a
        ));
      }
    } catch (error) {
      console.error('Failed to toggle admin:', error);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบ admin นี้?')) return;

    try {
      const response = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAdmins(admins.filter(a => a.id !== adminId));
      }
    } catch (error) {
      console.error('Failed to remove admin:', error);
    }
  };

  // Mock data
  const mockAdmins: AdminUserData[] = [
    {
      id: '1',
      user_id: 'user-1',
      role: 'owner',
      is_active: true,
      last_login_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      user_profile: { full_name: 'Super Admin', avatar_url: null },
    },
    {
      id: '2',
      user_id: 'user-2',
      role: 'admin',
      is_active: true,
      last_login_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      user_profile: { full_name: 'Admin User', avatar_url: null },
    },
    {
      id: '3',
      user_id: 'user-3',
      role: 'moderator',
      is_active: true,
      last_login_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      user_profile: { full_name: 'Moderator', avatar_url: null },
    },
  ];

  const displayAdmins = admins.length > 0 ? admins : mockAdmins;
  const filteredAdmins = displayAdmins.filter(a =>
    a.user_profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.role.includes(search.toLowerCase())
  );

  const roleConfig = {
    owner: {
      label: 'Owner',
      description: 'เข้าถึงทุกฟังก์ชัน รวมถึงจัดการ admin อื่น',
      icon: Crown,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      gradient: 'from-amber-500 to-orange-500',
    },
    admin: {
      label: 'Admin',
      description: 'จัดการผู้ใช้ models และ settings',
      icon: UserCog,
      color: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
      gradient: 'from-primary-500 to-primary-600',
    },
    moderator: {
      label: 'Moderator',
      description: 'ตรวจสอบเนื้อหาและ flag',
      icon: Shield,
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      gradient: 'from-blue-500 to-blue-600',
    },
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
            <h1 className="text-2xl font-bold text-white">จัดการ Admin</h1>
            <p className="text-neutral-400 mt-1">
              จัดการทีม admin ทั้งหมด {displayAdmins.length} คน
            </p>
          </div>
          <OwnerOnly>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              เพิ่ม Admin
            </motion.button>
          </OwnerOnly>
        </motion.div>

        {/* Role Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {(['owner', 'admin', 'moderator'] as const).map((role, index) => {
            const config = roleConfig[role];
            const count = displayAdmins.filter(a => a.role === role).length;
            const Icon = config.icon;

            return (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className={cn(
                  'p-5 rounded-2xl border',
                  config.color.replace('text-', 'border-').replace('/10', '/20'),
                  config.color.split(' ')[0]
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'p-3 rounded-xl bg-gradient-to-br',
                    config.gradient
                  )}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">{count}</p>
                    <p className="text-sm text-neutral-400">{config.label}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative max-w-md"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="ค้นหา admin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </motion.div>

        {/* Admin List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-neutral-900/50 border border-neutral-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAdmins.map((admin, index) => {
              const config = roleConfig[admin.role];
              const Icon = config.icon;

              return (
                <motion.div
                  key={admin.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className={cn(
                    'p-5 bg-neutral-900/50 border rounded-2xl',
                    !admin.is_active && 'opacity-50',
                    admin.role === 'owner' ? 'border-amber-500/30' : 'border-neutral-800'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className={cn(
                        'relative h-14 w-14 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br',
                        config.gradient
                      )}>
                        {admin.user_profile?.avatar_url ? (
                          <Image
                            src={admin.user_profile.avatar_url}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Icon className="h-7 w-7 text-white" />
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">
                            {admin.user_profile?.full_name || 'Unknown'}
                          </h3>
                          <span className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium border',
                            config.color
                          )}>
                            {config.label}
                          </span>
                          {!admin.is_active && (
                            <span className="px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-400">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-400 mt-1">
                          {config.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                          <span>สมัครเมื่อ: {formatDate(admin.created_at)}</span>
                          {admin.last_login_at && (
                            <span>เข้าสู่ระบบล่าสุด: {formatDate(admin.last_login_at)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <OwnerOnly>
                      {admin.role !== 'owner' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingAdmin(admin)}
                            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                            title="แก้ไข Role"
                          >
                            <UserCog className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(admin.id, admin.is_active)}
                            className={cn(
                              'p-2 rounded-lg transition-colors',
                              admin.is_active
                                ? 'text-green-400 hover:bg-green-500/10'
                                : 'text-neutral-400 hover:bg-neutral-800'
                            )}
                            title={admin.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleRemoveAdmin(admin.id)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="ลบ Admin"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </OwnerOnly>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">เพิ่ม Admin ใหม่</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    อีเมลผู้ใช้
                  </label>
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Role
                  </label>
                  <div className="space-y-2">
                    {(['admin', 'moderator'] as const).map((role) => {
                      const config = roleConfig[role];
                      const Icon = config.icon;

                      return (
                        <button
                          key={role}
                          onClick={() => setNewAdminRole(role)}
                          className={cn(
                            'w-full flex items-center gap-4 p-4 rounded-xl border transition-all',
                            newAdminRole === role
                              ? config.color
                              : 'border-neutral-700 hover:border-neutral-600'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <div className="text-left">
                            <p className="font-medium text-white">{config.label}</p>
                            <p className="text-xs text-neutral-400">{config.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleAddAdmin}
                    disabled={!newAdminEmail}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    เพิ่ม
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {editingAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setEditingAdmin(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  แก้ไข Role - {editingAdmin.user_profile?.full_name}
                </h3>
                <button
                  onClick={() => setEditingAdmin(null)}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                {(['admin', 'moderator'] as const).map((role) => {
                  const config = roleConfig[role];
                  const Icon = config.icon;

                  return (
                    <button
                      key={role}
                      onClick={() => handleUpdateRole(editingAdmin.id, role)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-xl border transition-all',
                        editingAdmin.role === role
                          ? config.color
                          : 'border-neutral-700 hover:border-neutral-600'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <div className="text-left flex-1">
                        <p className="font-medium text-white">{config.label}</p>
                        <p className="text-xs text-neutral-400">{config.description}</p>
                      </div>
                      {editingAdmin.role === role && (
                        <Check className="h-5 w-5 text-green-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
