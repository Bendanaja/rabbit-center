'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Database,
  Cpu,
  Activity,
  RefreshCw,
  Clock,
  Zap,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Users,
  CreditCard,
  Bot,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { authFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface SystemData {
  timestamp: string;
  dbLatencyMs: number;
  database: {
    totalUsers: number;
    totalChats: number;
    totalMessages: number;
    messagesToday: number;
    totalImages: number;
    totalVideos: number;
  };
  subscriptions: {
    active: number;
    planBreakdown: Record<string, number>;
  };
  models: {
    total: number;
    active: number;
    names: string[];
  };
  usage: {
    requestsToday: number;
    requestsWeek: number;
  };
  costs: {
    totalToday: number;
    breakdown: Record<string, { count: number; cost: number }>;
  };
}

export default function AdminSystemPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/system');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setError(null);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || `HTTP ${res.status}`);
      }
    } catch (e) {
      setError('ไม่สามารถเชื่อมต่อ API ได้');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastFetchTime(new Date());
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 15000);
      return () => clearInterval(interval);
    }
  }, [fetchHealth, autoRefresh]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHealth();
  };

  const latencyColor = (ms: number) =>
    ms < 200 ? 'text-green-400' : ms < 500 ? 'text-yellow-400' : 'text-red-400';

  const latencyBg = (ms: number) =>
    ms < 200 ? 'bg-green-500' : ms < 500 ? 'bg-yellow-500' : 'bg-red-500';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-white">สถานะระบบ</h1>
            <p className="text-neutral-400 mt-1">
              ข้อมูลจริงจากฐานข้อมูล (Real-time)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm',
                autoRefresh
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-neutral-800 text-neutral-400'
              )}
            >
              {autoRefresh ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {autoRefresh ? 'Auto: เปิด (15s)' : 'Auto: ปิด'}
            </button>
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
          >
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <p className="text-red-400 font-medium">เกิดข้อผิดพลาด</p>
              <p className="text-sm text-red-400/70">{error}</p>
            </div>
          </motion.div>
        )}

        {data && (
          <>
            {/* Service Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  name: 'API Server',
                  icon: Server,
                  status: 'online' as const,
                  detail: `Response: ${data.dbLatencyMs}ms`,
                  latency: data.dbLatencyMs,
                },
                {
                  name: 'Database (Supabase)',
                  icon: Database,
                  status: 'online' as const,
                  detail: `Latency: ${data.dbLatencyMs}ms`,
                  latency: data.dbLatencyMs,
                },
                {
                  name: 'AI Models',
                  icon: Bot,
                  status: data.models.active > 0 ? 'online' as const : 'offline' as const,
                  detail: `${data.models.active}/${data.models.total} active`,
                  latency: 0,
                },
                {
                  name: 'Subscriptions',
                  icon: CreditCard,
                  status: 'online' as const,
                  detail: `${data.subscriptions.active} active`,
                  latency: 0,
                },
              ].map((service, index) => (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-5 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-neutral-800 rounded-lg">
                        <service.icon className="h-5 w-5 text-neutral-300" />
                      </div>
                      <span className="font-medium text-white">{service.name}</span>
                    </div>
                    <div className={cn(
                      'p-1.5 rounded-full',
                      service.status === 'online' ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
                    )}>
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-sm text-neutral-400">{service.detail}</p>
                  {service.latency > 0 && (
                    <div className="mt-2 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', latencyBg(service.latency))}
                        style={{ width: `${Math.min((service.latency / 1000) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Database Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <Database className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">สถิติฐานข้อมูล</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'ผู้ใช้ทั้งหมด', value: data.database.totalUsers, icon: Users, color: 'text-blue-400' },
                  { label: 'แชททั้งหมด', value: data.database.totalChats, icon: MessageSquare, color: 'text-green-400' },
                  { label: 'ข้อความทั้งหมด', value: data.database.totalMessages, icon: MessageSquare, color: 'text-purple-400' },
                  { label: 'ข้อความวันนี้', value: data.database.messagesToday, icon: TrendingUp, color: 'text-orange-400' },
                  { label: 'รูปภาพที่สร้าง', value: data.database.totalImages, icon: ImageIcon, color: 'text-pink-400' },
                  { label: 'วิดีโอที่สร้าง', value: data.database.totalVideos, icon: Video, color: 'text-yellow-400' },
                ].map((stat) => (
                  <div key={stat.label} className="p-4 bg-neutral-800/50 rounded-xl text-center">
                    <stat.icon className={cn('h-5 w-5 mx-auto mb-2', stat.color)} />
                    <p className="text-xl font-bold text-white">{stat.value.toLocaleString()}</p>
                    <p className="text-xs text-neutral-400 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Usage + Costs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* API Usage */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-5 w-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">การใช้งาน API</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-neutral-800/50 rounded-xl">
                    <p className="text-3xl font-bold text-white">{data.usage.requestsToday.toLocaleString()}</p>
                    <p className="text-sm text-neutral-400 mt-1">Requests วันนี้</p>
                  </div>
                  <div className="p-4 bg-neutral-800/50 rounded-xl">
                    <p className="text-3xl font-bold text-white">{data.usage.requestsWeek.toLocaleString()}</p>
                    <p className="text-sm text-neutral-400 mt-1">Requests 7 วัน</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>DB Response: <span className={latencyColor(data.dbLatencyMs)}>{data.dbLatencyMs}ms</span></span>
                </div>
              </motion.div>

              {/* Costs Today */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">ต้นทุน API วันนี้</h3>
                </div>
                <div className="mb-4">
                  <p className="text-3xl font-bold text-white">
                    ฿{data.costs.totalToday.toFixed(2)}
                  </p>
                  <p className="text-sm text-neutral-400 mt-1">ค่าใช้จ่าย BytePlus API</p>
                </div>
                {Object.keys(data.costs.breakdown).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(data.costs.breakdown)
                      .sort(([, a], [, b]) => b.cost - a.cost)
                      .map(([action, info]) => (
                        <div key={action} className="flex items-center justify-between text-sm">
                          <span className="text-neutral-300 capitalize">{action}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-neutral-500">{info.count} reqs</span>
                            <span className="text-yellow-400 font-mono">฿{info.cost.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">ยังไม่มีการใช้งานวันนี้</p>
                )}
              </motion.div>
            </div>

            {/* Subscription Breakdown + Active Models */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Plan Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">สมาชิกตามแผน</h3>
                </div>
                {Object.keys(data.subscriptions.planBreakdown).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(data.subscriptions.planBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .map(([plan, count]) => {
                        const total = data.subscriptions.active || 1;
                        const pct = (count / total) * 100;
                        return (
                          <div key={plan}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-neutral-300 capitalize">{plan}</span>
                              <span className="text-sm text-neutral-400">{count} คน ({pct.toFixed(0)}%)</span>
                            </div>
                            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8 }}
                                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500 py-4 text-center">ยังไม่มีสมาชิกที่ active</p>
                )}
              </motion.div>

              {/* Active Models */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="h-5 w-5 text-orange-400" />
                  <h3 className="text-lg font-semibold text-white">AI Models ที่เปิดใช้งาน</h3>
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">{data.models.active}</span>
                  <span className="text-neutral-400">/ {data.models.total} โมเดล</span>
                </div>
                {data.models.names.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {data.models.names.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 rounded-lg text-sm"
                      >
                        <Zap className="h-3 w-3 text-orange-400" />
                        <span className="text-neutral-300">{name}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">ไม่มีโมเดลที่เปิดใช้งาน</p>
                )}
              </motion.div>
            </div>

            {/* Last Updated */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex items-center justify-center gap-2 text-xs text-neutral-600"
            >
              <Clock className="h-3 w-3" />
              <span>
                อัพเดทล่าสุด: {lastFetchTime?.toLocaleTimeString('th-TH')}
                {' '}| ข้อมูลจาก: {new Date(data.timestamp).toLocaleTimeString('th-TH')}
              </span>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
