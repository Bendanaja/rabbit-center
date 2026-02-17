'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  CreditCard,
  Bot,
  Calendar,
  Download,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { authFetch } from '@/lib/api-client';
import { useRealtime } from '@/hooks/useRealtime';
import { cn } from '@/lib/utils';

interface AnalyticsData {
  userGrowth: { date: string; count: number; new_users: number }[];
  messageStats: { date: string; count: number; tokens: number }[];
  revenueStats: { date: string; amount: number; subscriptions: number }[];
  modelUsage: { model: string; requests: number; tokens: number; percentage: number }[];
  topUsers: { user_id: string; name: string; messages: number; spent: number }[];
  conversionRate: number;
  churnRate: number;
  avgSessionDuration: number;
  dailyActiveUsers: number[];
}

type DateRange = '7d' | '30d' | '90d' | 'all';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const isFirstLoad = useRef(true);

  const fetchAnalytics = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground && isFirstLoad.current) {
        setLoading(true);
      }
      const response = await authFetch(`/api/admin/analytics?range=${dateRange}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
        isFirstLoad.current = false;
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Real-time: auto-refetch on DB changes
  const analyticsSubs = useMemo(() => [
    { table: 'daily_usage' },
    { table: 'messages' },
    { table: 'subscriptions' },
    { table: 'customer_profiles' },
  ], []);
  useRealtime(analyticsSubs, () => fetchAnalytics(true));

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleExport = () => {
    // Export functionality
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const emptyData: AnalyticsData = {
    userGrowth: [],
    messageStats: [],
    revenueStats: [],
    modelUsage: [],
    topUsers: [],
    conversionRate: 0,
    churnRate: 0,
    avgSessionDuration: 0,
    dailyActiveUsers: [0, 0, 0, 0, 0, 0, 0],
  };

  const displayData = data || emptyData;

  const getMaxValue = (arr: number[]) => arr.length > 0 ? Math.max(...arr) : 1;

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
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-neutral-400 mt-1">
              ดูสถิติและข้อมูลการใช้งานระบบ
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
              {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={cn(
                    'px-4 py-1.5 rounded-md text-sm transition-colors',
                    dateRange === range
                      ? 'bg-primary-500 text-white'
                      : 'text-neutral-400 hover:text-white'
                  )}
                >
                  {range === '7d' ? '7 วัน' : range === '30d' ? '30 วัน' : range === '90d' ? '90 วัน' : 'ทั้งหมด'}
                </button>
              ))}
            </div>

            {/* Export Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </motion.button>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Conversion Rate', value: `${displayData.conversionRate}%`, icon: TrendingUp, color: 'green' },
            { label: 'Churn Rate', value: `${displayData.churnRate}%`, icon: TrendingDown, color: 'red' },
            { label: 'Avg Session', value: `${displayData.avgSessionDuration} นาที`, icon: Calendar, color: 'blue' },
            { label: 'DAU (7d avg)', value: Math.round(displayData.dailyActiveUsers.reduce((a, b) => a + b, 0) / 7).toLocaleString(), icon: Users, color: 'purple' },
          ].map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-5 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  metric.color === 'green' && 'bg-green-500/10',
                  metric.color === 'red' && 'bg-red-500/10',
                  metric.color === 'blue' && 'bg-blue-500/10',
                  metric.color === 'purple' && 'bg-purple-500/10'
                )}>
                  <metric.icon className={cn(
                    'h-5 w-5',
                    metric.color === 'green' && 'text-green-400',
                    metric.color === 'red' && 'text-red-400',
                    metric.color === 'blue' && 'text-blue-400',
                    metric.color === 'purple' && 'text-purple-400'
                  )} />
                </div>
                <span className="text-xs font-medium text-neutral-500">
                  --
                </span>
              </div>
              {loading && !data ? (
                <div className="h-8 w-20 bg-neutral-800 rounded-lg animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-white">{metric.value}</p>
              )}
              <p className="text-sm text-neutral-400 mt-1">{metric.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">การเติบโตของผู้ใช้</h3>
              <Users className="h-5 w-5 text-neutral-400" />
            </div>
            {loading && !data ? (
              <div className="h-64 flex items-end gap-1">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="flex-1 bg-neutral-800 rounded-t-sm animate-pulse" style={{ height: `${20 + Math.random() * 60}%` }} />
                ))}
              </div>
            ) : displayData.userGrowth.length > 0 ? (
              <>
                <div className="h-64 flex items-end gap-1">
                  {displayData.userGrowth.slice(-14).map((day, index) => {
                    const maxCount = getMaxValue(displayData.userGrowth.map(d => d.count));
                    const height = (day.count / maxCount) * 100;
                    return (
                      <motion.div
                        key={day.date}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: index * 0.03, duration: 0.4 }}
                        className="flex-1 bg-gradient-to-t from-primary-500/50 to-primary-400 rounded-t-sm relative group cursor-pointer"
                      >
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                          {day.count.toLocaleString()} users
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-neutral-500">
                  <span>{displayData.userGrowth.slice(-14)[0]?.date.slice(5)}</span>
                  <span>วันนี้</span>
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-neutral-500">ไม่มีข้อมูล</p>
              </div>
            )}
          </motion.div>

          {/* Message Stats Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">ข้อความต่อวัน</h3>
              <MessageSquare className="h-5 w-5 text-neutral-400" />
            </div>
            {loading && !data ? (
              <div className="h-64 flex items-end gap-1">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="flex-1 bg-neutral-800 rounded-t-sm animate-pulse" style={{ height: `${15 + Math.random() * 55}%` }} />
                ))}
              </div>
            ) : displayData.messageStats.length > 0 ? (
              <>
                <div className="h-64 flex items-end gap-1">
                  {displayData.messageStats.slice(-14).map((day, index) => {
                    const maxCount = getMaxValue(displayData.messageStats.map(d => d.count));
                    const height = (day.count / maxCount) * 100;
                    return (
                      <motion.div
                        key={day.date}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: index * 0.03, duration: 0.4 }}
                        className="flex-1 bg-gradient-to-t from-blue-500/50 to-blue-400 rounded-t-sm relative group cursor-pointer"
                      >
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                          {day.count.toLocaleString()} msgs
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-neutral-500">
                  <span>{displayData.messageStats.slice(-14)[0]?.date.slice(5)}</span>
                  <span>วันนี้</span>
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-neutral-500">ไม่มีข้อมูล</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Revenue & Model Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">รายได้</h3>
                {loading && !data ? (
                  <div className="h-8 w-32 bg-neutral-800 rounded-lg animate-pulse mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-green-400 mt-1">
                    ฿{displayData.revenueStats.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
                  </p>
                )}
              </div>
              <CreditCard className="h-5 w-5 text-neutral-400" />
            </div>
            {loading && !data ? (
              <div className="h-48 flex items-end gap-1">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="flex-1 bg-neutral-800 rounded-t-sm animate-pulse" style={{ height: `${10 + Math.random() * 50}%` }} />
                ))}
              </div>
            ) : displayData.revenueStats.length > 0 ? (
              <div className="h-48 flex items-end gap-1">
                {displayData.revenueStats.slice(-14).map((day, index) => {
                  const maxAmount = getMaxValue(displayData.revenueStats.map(d => d.amount));
                  const height = (day.amount / maxAmount) * 100;
                  return (
                    <motion.div
                      key={day.date}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: index * 0.03, duration: 0.4 }}
                      className="flex-1 bg-gradient-to-t from-green-500/50 to-green-400 rounded-t-sm relative group cursor-pointer"
                    >
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                        ฿{day.amount.toLocaleString()}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="text-neutral-500">ไม่มีข้อมูล</p>
              </div>
            )}
          </motion.div>

          {/* Model Usage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">การใช้งาน AI Models</h3>
              <Bot className="h-5 w-5 text-neutral-400" />
            </div>
            {loading && !data ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between mb-1">
                      <div className="h-4 w-32 bg-neutral-800 rounded" />
                      <div className="h-4 w-10 bg-neutral-800 rounded" />
                    </div>
                    <div className="h-2 bg-neutral-800 rounded-full" />
                    <div className="flex items-center justify-between mt-1">
                      <div className="h-3 w-20 bg-neutral-800 rounded" />
                      <div className="h-3 w-16 bg-neutral-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayData.modelUsage.length > 0 ? (
              <div className="space-y-4">
                {displayData.modelUsage.map((model, index) => (
                  <motion.div
                    key={model.model}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-neutral-300">{model.model}</span>
                      <span className="text-sm text-neutral-400">{model.percentage}%</span>
                    </div>
                    <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${model.percentage}%` }}
                        transition={{ duration: 0.6, delay: index * 0.05 }}
                        className={cn(
                          'h-full rounded-full',
                          index === 0 && 'bg-gradient-to-r from-green-500 to-green-400',
                          index === 1 && 'bg-gradient-to-r from-purple-500 to-purple-400',
                          index === 2 && 'bg-gradient-to-r from-blue-500 to-blue-400',
                          index === 3 && 'bg-gradient-to-r from-orange-500 to-orange-400',
                          index === 4 && 'bg-gradient-to-r from-primary-500 to-primary-400'
                        )}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-neutral-500">
                      <span>{model.requests.toLocaleString()} requests</span>
                      <span>{(model.tokens / 1000000).toFixed(1)}M tokens</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 text-center py-8">ไม่มีข้อมูลการใช้งาน</p>
            )}
          </motion.div>
        </div>

        {/* Top Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Top Users</h3>
          {loading && !data ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse py-3">
                  <div className="w-8 h-8 bg-neutral-800 rounded-full" />
                  <div className="flex-1 flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-800 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-neutral-800 rounded mb-1" />
                      <div className="h-3 w-16 bg-neutral-800 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-12 bg-neutral-800 rounded" />
                  <div className="h-4 w-16 bg-neutral-800 rounded" />
                </div>
              ))}
            </div>
          ) : displayData.topUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-neutral-400 text-sm border-b border-neutral-800">
                  <th className="pb-3 font-medium">อันดับ</th>
                  <th className="pb-3 font-medium">ผู้ใช้</th>
                  <th className="pb-3 font-medium text-right">ข้อความ</th>
                  <th className="pb-3 font-medium text-right">ยอดใช้จ่าย</th>
                </tr>
              </thead>
              <tbody>
                {displayData.topUsers.map((user, index) => (
                  <motion.tr
                    key={user.user_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className="border-b border-neutral-800/50 last:border-0"
                  >
                    <td className="py-4">
                      <span className={cn(
                        'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
                        index === 0 && 'bg-yellow-500/20 text-yellow-400',
                        index === 1 && 'bg-neutral-500/20 text-neutral-300',
                        index === 2 && 'bg-orange-500/20 text-orange-400',
                        index > 2 && 'bg-neutral-800 text-neutral-400'
                      )}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-medium">
                          {user.name[0]}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-xs text-neutral-500">ID: {user.user_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-white font-medium">{user.messages.toLocaleString()}</span>
                    </td>
                    <td className="py-4 text-right">
                      <span className={cn(
                        'font-medium',
                        user.spent > 0 ? 'text-green-400' : 'text-neutral-400'
                      )}>
                        ฿{user.spent.toLocaleString()}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          ) : (
            <p className="text-neutral-500 text-center py-8">ไม่มีข้อมูล</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
