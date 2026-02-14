'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  MessageSquare,
  CreditCard,
  TrendingUp,
  Bot,
  Shield,
  Activity,
  Clock,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { StatsCard } from '@/components/admin/StatsCard';
import { useAdmin } from '@/hooks/useAdmin';

interface DashboardStats {
  totalUsers: number;
  activeUsersToday: number;
  totalMessages: number;
  totalRevenue: number;
  newUsersThisWeek: number;
  activeSubscriptions: number;
  pendingFlags: number;
  modelUsage: { model: string; count: number }[];
}

export default function AdminDashboardPage() {
  const { role, adminData } = useAdmin();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/analytics/overview');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'สวัสดีตอนเช้า' : currentHour < 18 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';

  return (
    <div className="min-h-screen">
      <AdminHeader onRefresh={handleRefresh} isRefreshing={refreshing} />

      <div className="p-6 space-y-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">
              {greeting}, {adminData?.user_profile?.full_name || 'Admin'} 👋
            </h1>
            <p className="text-neutral-400 mt-1">
              นี่คือภาพรวมของระบบ RabbitHub ในวันนี้
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Clock className="h-4 w-4" />
            <span>อัพเดทล่าสุด: {new Date().toLocaleTimeString('th-TH')}</span>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="ผู้ใช้ทั้งหมด"
            value={stats?.totalUsers || 0}
            previousValue={(stats?.totalUsers || 0) - (stats?.newUsersThisWeek || 0)}
            icon={<Users className="h-6 w-6" />}
            color="blue"
            delay={0}
          />
          <StatsCard
            title="ผู้ใช้งานวันนี้"
            value={stats?.activeUsersToday || 0}
            icon={<Activity className="h-6 w-6" />}
            color="green"
            delay={0.1}
          />
          <StatsCard
            title="ข้อความทั้งหมด"
            value={stats?.totalMessages || 0}
            icon={<MessageSquare className="h-6 w-6" />}
            color="purple"
            delay={0.2}
          />
          <StatsCard
            title="รายได้รวม"
            value={stats?.totalRevenue || 0}
            format="currency"
            icon={<CreditCard className="h-6 w-6" />}
            color="primary"
            delay={0.3}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="สมาชิกใหม่ (7 วัน)"
            value={stats?.newUsersThisWeek || 0}
            icon={<TrendingUp className="h-6 w-6" />}
            color="orange"
            delay={0.4}
          />
          <StatsCard
            title="Subscriptions ใช้งาน"
            value={stats?.activeSubscriptions || 0}
            icon={<Bot className="h-6 w-6" />}
            color="yellow"
            delay={0.5}
          />
          <StatsCard
            title="รอตรวจสอบ"
            value={stats?.pendingFlags || 0}
            icon={<Shield className="h-6 w-6" />}
            color={stats?.pendingFlags && stats.pendingFlags > 0 ? 'primary' : 'green'}
            delay={0.6}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Model Usage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
          >
            <h3 className="text-lg font-semibold text-white mb-4">การใช้งาน AI Models (7 วัน)</h3>
            <div className="space-y-4">
              {stats?.modelUsage?.length ? (
                stats.modelUsage.map((model, index) => {
                  const maxCount = Math.max(...stats.modelUsage.map(m => m.count));
                  const percentage = maxCount > 0 ? (model.count / maxCount) * 100 : 0;

                  return (
                    <motion.div
                      key={model.model}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-neutral-300">{model.model}</span>
                        <span className="text-sm text-neutral-400">{model.count.toLocaleString()} requests</span>
                      </div>
                      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, delay: 0.7 + index * 0.1 }}
                          className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                        />
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <p className="text-neutral-500 text-center py-8">ยังไม่มีข้อมูลการใช้งาน</p>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
          >
            <h3 className="text-lg font-semibold text-white mb-4">การดำเนินการด่วน</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'จัดการผู้ใช้', href: '/admin/users', icon: Users, color: 'blue' },
                { name: 'ตั้งค่า Models', href: '/admin/models', icon: Bot, color: 'purple' },
                { name: 'ดู Analytics', href: '/admin/analytics', icon: Activity, color: 'green' },
                { name: 'ตรวจสอบ Flags', href: '/admin/moderation', icon: Shield, color: 'orange' },
              ].map((action, index) => (
                <motion.a
                  key={action.name}
                  href={action.href}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    action.color === 'blue'
                      ? 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20'
                      : action.color === 'purple'
                      ? 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20'
                      : action.color === 'green'
                      ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20'
                      : 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20'
                  }`}
                >
                  <action.icon className={`h-6 w-6 mb-2 ${
                    action.color === 'blue'
                      ? 'text-blue-400'
                      : action.color === 'purple'
                      ? 'text-purple-400'
                      : action.color === 'green'
                      ? 'text-green-400'
                      : 'text-orange-400'
                  }`} />
                  <p className="text-sm font-medium text-white">{action.name}</p>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
        >
          <h3 className="text-lg font-semibold text-white mb-4">สถานะระบบ</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'API Server', status: 'online' },
              { name: 'Database', status: 'online' },
              { name: 'BytePlus', status: 'online' },
              { name: 'Supabase', status: 'online' },
            ].map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg"
              >
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    service.status === 'online' ? 'bg-green-400' : 'bg-red-400'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${
                    service.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{service.name}</p>
                  <p className={`text-xs ${
                    service.status === 'online' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {service.status === 'online' ? 'ออนไลน์' : 'ออฟไลน์'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
