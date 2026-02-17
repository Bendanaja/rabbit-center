'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Crown,
  Shield,
  Users,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import Image from 'next/image';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { cn } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';
import { useRealtime } from '@/hooks/useRealtime';

interface Subscription {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_avatar: string | null;
  plan: 'free' | 'starter' | 'pro' | 'premium';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  amount: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  cancelled_at: string | null;
  stripe_subscription_id: string | null;
}

interface SubscriptionStats {
  totalRevenue: number;
  mrr: number;
  activeSubscriptions: number;
  churnedThisMonth: number;
  newThisMonth: number;
  planBreakdown: { plan: string; count: number; revenue: number }[];
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'starter' | 'pro' | 'premium'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'cancelled' | 'past_due'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const isFirstLoad = useRef(true);

  const fetchSubscriptions = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground && isFirstLoad.current) {
        setLoading(true);
      }
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        search,
        plan: filterPlan,
        status: filterStatus,
      });

      const [subsResponse, statsResponse] = await Promise.all([
        authFetch(`/api/admin/subscriptions?${params}`),
        authFetch('/api/admin/subscriptions/stats'),
      ]);

      if (subsResponse.ok) {
        const data = await subsResponse.json();
        setSubscriptions(data.subscriptions || []);
        setTotalPages(data.totalPages || 1);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
      isFirstLoad.current = false;
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search, filterPlan, filterStatus]);

  useEffect(() => {
    if (isFirstLoad.current) {
      fetchSubscriptions();
    } else {
      const debounce = setTimeout(() => fetchSubscriptions(), 300);
      return () => clearTimeout(debounce);
    }
  }, [fetchSubscriptions]);

  // Real-time: auto-refetch on subscription changes
  const subSubs = useMemo(() => [
    { table: 'subscriptions' },
    { table: 'payment_transactions' },
  ], []);
  useRealtime(subSubs, () => fetchSubscriptions(true));

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSubscriptions();
  };

  const emptyStats: SubscriptionStats = {
    totalRevenue: 0,
    mrr: 0,
    activeSubscriptions: 0,
    churnedThisMonth: 0,
    newThisMonth: 0,
    planBreakdown: [
      { plan: 'Premium', count: 0, revenue: 0 },
      { plan: 'Pro', count: 0, revenue: 0 },
      { plan: 'Starter', count: 0, revenue: 0 },
      { plan: 'Free', count: 0, revenue: 0 },
    ],
  };

  const displayStats = stats || emptyStats;
  const displaySubscriptions = subscriptions;

  const planColors: Record<string, string> = {
    free: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
    starter: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    pro: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
    premium: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-400',
    cancelled: 'bg-red-500/10 text-red-400',
    past_due: 'bg-yellow-500/10 text-yellow-400',
    trialing: 'bg-blue-500/10 text-blue-400',
  };

  const planIcons: Record<string, typeof Crown> = {
    free: Users,
    starter: Shield,
    pro: Shield,
    premium: Crown,
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
            <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
            <p className="text-neutral-400 mt-1">
              จัดการ subscriptions และดูรายได้
            </p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'รายได้/ปี (est.)', value: `฿${displayStats.totalRevenue.toLocaleString()}`, icon: CreditCard, color: 'green' },
            { label: 'MRR', value: `฿${displayStats.mrr.toLocaleString()}`, icon: TrendingUp, color: 'primary' },
            { label: 'Active Subs', value: displayStats.activeSubscriptions.toLocaleString(), icon: CheckCircle, color: 'blue' },
            { label: 'ใหม่เดือนนี้', value: `+${displayStats.newThisMonth}`, icon: Users, color: 'purple' },
            { label: 'Churned', value: displayStats.churnedThisMonth.toString(), icon: XCircle, color: 'red' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={cn(
                  'h-5 w-5',
                  stat.color === 'green' && 'text-green-400',
                  stat.color === 'primary' && 'text-primary-400',
                  stat.color === 'blue' && 'text-blue-400',
                  stat.color === 'purple' && 'text-purple-400',
                  stat.color === 'red' && 'text-red-400'
                )} />
              </div>
              {loading && !stats ? (
                <div className="h-8 w-20 bg-neutral-800 rounded-lg animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              )}
              <p className="text-sm text-neutral-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Plan Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Plan Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading && !stats ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-neutral-800 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-6 w-6 bg-neutral-800 rounded" />
                    <div className="h-4 w-16 bg-neutral-800 rounded" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="h-9 w-12 bg-neutral-800 rounded" />
                    <div className="h-4 w-20 bg-neutral-800 rounded" />
                  </div>
                </div>
              ))
            ) : (
              displayStats.planBreakdown.map((plan, index) => {
                const Icon = plan.plan === 'Premium' ? Crown : plan.plan === 'Pro' ? Shield : plan.plan === 'Starter' ? Shield : Users;
                return (
                  <motion.div
                    key={plan.plan}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'p-4 rounded-xl border',
                      plan.plan === 'Premium' && 'bg-purple-500/5 border-purple-500/20',
                      plan.plan === 'Pro' && 'bg-primary-500/5 border-primary-500/20',
                      plan.plan === 'Starter' && 'bg-blue-500/5 border-blue-500/20',
                      plan.plan === 'Free' && 'bg-neutral-500/5 border-neutral-500/20'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className={cn(
                        'h-6 w-6',
                        plan.plan === 'Premium' && 'text-purple-400',
                        plan.plan === 'Pro' && 'text-primary-400',
                        plan.plan === 'Starter' && 'text-blue-400',
                        plan.plan === 'Free' && 'text-neutral-400'
                      )} />
                      <span className="font-medium text-white">{plan.plan}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-bold text-white">{plan.count}</span>
                      <span className={cn(
                        'text-sm font-medium',
                        plan.revenue > 0 ? 'text-green-400' : 'text-neutral-500'
                      )}>
                        ฿{plan.revenue.toLocaleString()}/mo
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-4"
        >
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="ค้นหาผู้ใช้หรืออีเมล..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>

          {/* Plan Filter */}
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            {(['all', 'premium', 'pro', 'starter', 'free'] as const).map((plan) => (
              <button
                key={plan}
                onClick={() => setFilterPlan(plan)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  filterPlan === plan
                    ? 'bg-primary-500 text-white'
                    : 'text-neutral-400 hover:text-white'
                )}
              >
                {plan === 'all' ? 'ทั้งหมด' : plan.charAt(0).toUpperCase() + plan.slice(1)}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            {(['all', 'active', 'past_due', 'cancelled'] as const).map((status) => (
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
                {status === 'all' ? 'ทุกสถานะ' :
                 status === 'active' ? 'Active' :
                 status === 'past_due' ? 'Past Due' : 'Cancelled'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Subscriptions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-neutral-400 text-sm border-b border-neutral-800">
                  <th className="p-4 font-medium">ผู้ใช้</th>
                  <th className="p-4 font-medium">แผน</th>
                  <th className="p-4 font-medium">สถานะ</th>
                  <th className="p-4 font-medium">ยอดเงิน</th>
                  <th className="p-4 font-medium">รอบบิล</th>
                  <th className="p-4 font-medium">สมัครเมื่อ</th>
                  <th className="p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {loading && subscriptions.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="border-b border-neutral-800/50 animate-pulse">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-neutral-800 rounded-full" />
                          <div>
                            <div className="h-4 w-24 bg-neutral-800 rounded mb-1" />
                            <div className="h-3 w-32 bg-neutral-800 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="p-4"><div className="h-6 w-16 bg-neutral-800 rounded-full" /></td>
                      <td className="p-4"><div className="h-6 w-16 bg-neutral-800 rounded-full" /></td>
                      <td className="p-4"><div className="h-4 w-20 bg-neutral-800 rounded" /></td>
                      <td className="p-4"><div className="h-4 w-24 bg-neutral-800 rounded" /></td>
                      <td className="p-4"><div className="h-4 w-20 bg-neutral-800 rounded" /></td>
                      <td className="p-4"><div className="h-4 w-4 bg-neutral-800 rounded" /></td>
                    </tr>
                  ))
                ) : displaySubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <CreditCard className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
                      <p className="text-neutral-400 font-medium">ไม่มีข้อมูล</p>
                      <p className="text-neutral-500 text-sm mt-1">ยังไม่มี subscription ที่ตรงกับตัวกรอง</p>
                    </td>
                  </tr>
                ) : (
                  displaySubscriptions.map((sub) => {
                    const PlanIcon = planIcons[sub.plan];
                    return (
                      <motion.tr
                        key={sub.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        className="border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/30 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 rounded-full overflow-hidden bg-neutral-800">
                              {sub.user_avatar ? (
                                <Image src={sub.user_avatar} alt="" fill className="object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-neutral-400">
                                  {sub.user_name[0]}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-white">{sub.user_name}</p>
                              <p className="text-xs text-neutral-500">{sub.user_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                            planColors[sub.plan]
                          )}>
                            <PlanIcon className="h-3 w-3" />
                            {sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                            statusColors[sub.status]
                          )}>
                            {sub.status === 'active' && <CheckCircle className="h-3 w-3" />}
                            {sub.status === 'cancelled' && <XCircle className="h-3 w-3" />}
                            {sub.status === 'past_due' && <Clock className="h-3 w-3" />}
                            {sub.status === 'active' ? 'Active' :
                             sub.status === 'cancelled' ? 'Cancelled' :
                             sub.status === 'past_due' ? 'Past Due' : 'Trialing'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-white font-medium">
                            ฿{sub.amount.toLocaleString()}
                          </span>
                          <span className="text-neutral-500 text-sm">
                            /{sub.interval === 'monthly' ? 'เดือน' : 'ปี'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <p className="text-neutral-300">{formatDate(sub.current_period_start)}</p>
                            <p className="text-neutral-500">→ {formatDate(sub.current_period_end)}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-neutral-400 text-sm">{formatDate(sub.created_at)}</span>
                        </td>
                        <td className="p-4">
                          {sub.stripe_subscription_id && (
                            <a
                              href={`https://dashboard.stripe.com/subscriptions/${sub.stripe_subscription_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors inline-block"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-neutral-800">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
        </motion.div>
      </div>
    </div>
  );
}
