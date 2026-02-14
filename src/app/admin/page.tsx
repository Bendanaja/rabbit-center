'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  MessageSquare,
  CreditCard,
  TrendingUp,
  Shield,
  Activity,
  Clock,
  Settings,
  Eye,
  Phone,
  Database,
  Download,
} from 'lucide-react';
import Link from 'next/link';
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

interface CustomerStats {
  totalUsers: number;
  usersWithPhone: number;
  active24h: number;
  active7d: number;
  new24h: number;
  new7d: number;
  bySource: Record<string, number>;
}

interface RecentActivity {
  id: string;
  type: 'user_signup' | 'subscription' | 'payment' | 'ban' | 'setting_change';
  description: string;
  timestamp: string;
  user?: string;
}

export default function AdminDashboardPage() {
  const { role, adminData } = useAdmin();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);

  const fetchStats = useCallback(async () => {
    // Fetch customer stats in parallel
    try {
      const custResponse = await fetch('/api/admin/stats/customers');
      if (custResponse.ok) {
        const custData = await custResponse.json();
        setCustomerStats(custData);
      }
    } catch {
      // Non-blocking
    }

    try {
      const response = await fetch('/api/admin/analytics/overview');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch {
      // API failed - stats remain null, UI will show 0
    } finally {
      setLoading(false);
      setRefreshing(false);
    }

  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'สวัสดีตอนเช้า' : currentHour < 18 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';

  const activityTypeIcons = {
    user_signup: Users,
    subscription: CreditCard,
    payment: CreditCard,
    ban: Shield,
    setting_change: Settings,
  };

  const activityTypeColors = {
    user_signup: 'text-blue-400 bg-blue-500/10',
    subscription: 'text-green-400 bg-green-500/10',
    payment: 'text-primary-400 bg-primary-500/10',
    ban: 'text-red-400 bg-red-500/10',
    setting_change: 'text-yellow-400 bg-yellow-500/10',
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    return `${Math.floor(hours / 24)} วันที่แล้ว`;
  };

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
              {greeting}, {adminData?.user_profile?.full_name || 'Admin'}
            </h1>
            <p className="text-neutral-400 mt-1">
              ภาพรวมระบบ RabbitHub AI ในวันนี้
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Clock className="h-4 w-4" />
            <span>อัพเดทล่าสุด: {new Date().toLocaleTimeString('th-TH')}</span>
          </div>
        </motion.div>

        {/* Main Stats Grid */}
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
            title="รายได้เดือนนี้"
            value={stats?.totalRevenue || 0}
            format="currency"
            icon={<CreditCard className="h-6 w-6" />}
            color="primary"
            delay={0.1}
          />
          <StatsCard
            title="สมาชิกที่ Active"
            value={stats?.activeSubscriptions || 0}
            icon={<Activity className="h-6 w-6" />}
            color="green"
            delay={0.2}
          />
          <StatsCard
            title="ข้อความวันนี้"
            value={stats?.totalMessages || 0}
            icon={<MessageSquare className="h-6 w-6" />}
            color="purple"
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
            title="ผู้ใช้งานวันนี้"
            value={stats?.activeUsersToday || 0}
            icon={<Eye className="h-6 w-6" />}
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

        {/* Customer Data (Big Data) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Customer Data (Big Data)</h3>
            </div>
            <button
              onClick={() => window.open('/api/admin/stats/customers?export=csv', '_blank')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/20 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-neutral-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-neutral-400">Customer Profiles</span>
              </div>
              <p className="text-2xl font-bold text-white">{customerStats?.totalUsers?.toLocaleString() || 0}</p>
            </div>
            <div className="p-4 bg-neutral-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-green-400" />
                <span className="text-xs text-neutral-400">มีเบอร์โทร</span>
              </div>
              <p className="text-2xl font-bold text-white">{customerStats?.usersWithPhone?.toLocaleString() || 0}</p>
              {customerStats && customerStats.totalUsers > 0 && (
                <p className="text-xs text-neutral-500 mt-1">
                  {Math.round((customerStats.usersWithPhone / customerStats.totalUsers) * 100)}%
                </p>
              )}
            </div>
            <div className="p-4 bg-neutral-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-neutral-400">Active (24h / 7d)</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {customerStats?.active24h?.toLocaleString() || 0}
                <span className="text-sm text-neutral-400 font-normal"> / {customerStats?.active7d?.toLocaleString() || 0}</span>
              </p>
            </div>
            <div className="p-4 bg-neutral-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-neutral-400">ใหม่ (24h / 7d)</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {customerStats?.new24h?.toLocaleString() || 0}
                <span className="text-sm text-neutral-400 font-normal"> / {customerStats?.new7d?.toLocaleString() || 0}</span>
              </p>
            </div>
          </div>
          {customerStats?.bySource && Object.keys(customerStats.bySource).length > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-800">
              <p className="text-sm text-neutral-400 mb-3">แหล่งที่มาการสมัคร</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(customerStats.bySource).map(([source, count]) => (
                  <span
                    key={source}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 rounded-lg text-sm"
                  >
                    <span className="text-neutral-300 capitalize">{source}</span>
                    <span className="text-neutral-500">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Charts + Activity Section */}
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

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
          >
            <h3 className="text-lg font-semibold text-white mb-4">กิจกรรมล่าสุด</h3>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => {
                const Icon = activityTypeIcons[activity.type];
                const colorClass = activityTypeColors[activity.type];
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg"
                  >
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {activity.user && <span className="font-medium">{activity.user}</span>}
                        {activity.user && ' - '}
                        {activity.description}
                      </p>
                      <p className="text-xs text-neutral-500">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </motion.div>
                );
              })}
              {recentActivity.length === 0 && (
                <p className="text-neutral-500 text-center py-8">ยังไม่มีกิจกรรม</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
        >
          <h3 className="text-lg font-semibold text-white mb-4">การดำเนินการด่วน</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'จัดการผู้ใช้', href: '/admin/users', icon: Users, color: 'blue' },
              { name: 'ตั้งค่าระบบ', href: '/admin/settings', icon: Settings, color: 'purple' },
              { name: 'System Health', href: '/admin/system', icon: Activity, color: 'green' },
              { name: 'ตรวจสอบ', href: '/admin/moderation', icon: Shield, color: 'orange' },
            ].map((action, index) => (
              <motion.div
                key={action.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <Link
                  href={action.href}
                  className={`block p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${
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
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
