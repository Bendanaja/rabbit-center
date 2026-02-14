'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Activity,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Zap,
  Globe,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Users,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { cn } from '@/lib/utils';

interface SystemHealth {
  api: { status: 'online' | 'degraded' | 'offline'; latency: number; uptime: number };
  database: { status: 'online' | 'degraded' | 'offline'; connections: number; latency: number };
  byteplus: { status: 'online' | 'degraded' | 'offline'; latency: number };
  supabase: { status: 'online' | 'degraded' | 'offline'; latency: number };
  storage: { used: number; total: number; percentage: number };
  memory: { used: number; total: number; percentage: number };
  cpu: { usage: number; cores: number };
  requests: { total: number; success: number; failed: number; rate: number };
}

interface DatabaseStats {
  totalChats: number;
  totalMessages: number;
  totalImages: number;
  totalVideos: number;
  totalUsers: number;
  storageUsed: string;
}

interface LogEntry {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  source: string;
}

export default function AdminSystemPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = useCallback(async () => {
    try {
      const mockHealth: SystemHealth = {
        api: { status: 'online', latency: 45 + Math.random() * 20, uptime: 99.98 },
        database: { status: 'online', connections: 12 + Math.floor(Math.random() * 5), latency: 8 + Math.random() * 5 },
        byteplus: { status: 'online', latency: 120 + Math.random() * 50 },
        supabase: { status: 'online', latency: 35 + Math.random() * 15 },
        storage: { used: 2.4, total: 10, percentage: 24 },
        memory: { used: 1.8, total: 4, percentage: 45 },
        cpu: { usage: 25 + Math.random() * 15, cores: 4 },
        requests: {
          total: 150000 + Math.floor(Math.random() * 5000),
          success: 149500 + Math.floor(Math.random() * 400),
          failed: 50 + Math.floor(Math.random() * 50),
          rate: 25 + Math.random() * 10
        },
      };

      setHealth(mockHealth);

      setDbStats({
        totalChats: 3420,
        totalMessages: 85600,
        totalImages: 2150,
        totalVideos: 340,
        totalUsers: 128,
        storageUsed: '2.4 GB',
      });

      const mockLogs: LogEntry[] = [
        { id: '1', level: 'info', message: 'API response time ปกติ', timestamp: new Date().toISOString(), source: 'api' },
        { id: '2', level: 'info', message: 'สำรองฐานข้อมูลสำเร็จ', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), source: 'database' },
        { id: '3', level: 'warning', message: 'การใช้หน่วยความจำสูง (85%)', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), source: 'system' },
        { id: '4', level: 'info', message: 'ต่ออายุ SSL certificate สำเร็จ', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), source: 'security' },
        { id: '5', level: 'error', message: 'BytePlus rate limit เกิน - กำลังลองใหม่', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), source: 'byteplus' },
        { id: '6', level: 'info', message: 'สมาชิกใหม่สมัคร Pro plan', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), source: 'billing' },
      ];
      setLogs(mockLogs);
    } catch (error) {
      console.error('Failed to fetch health:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();

    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchHealth, autoRefresh]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHealth();
  };

  const statusColors = {
    online: 'text-green-400 bg-green-500/10',
    degraded: 'text-yellow-400 bg-yellow-500/10',
    offline: 'text-red-400 bg-red-500/10',
  };

  const statusIcons = {
    online: CheckCircle,
    degraded: AlertTriangle,
    offline: XCircle,
  };

  const logLevelColors = {
    info: 'text-blue-400 bg-blue-500/10',
    warning: 'text-yellow-400 bg-yellow-500/10',
    error: 'text-red-400 bg-red-500/10',
  };

  const formatUptime = (percent: number) => `${percent.toFixed(2)}%`;
  const formatBytes = (gb: number) => `${gb.toFixed(1)} GB`;

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
              ตรวจสอบสถานะระบบแบบ Real-time
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                autoRefresh
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-neutral-800 text-neutral-400'
              )}
            >
              {autoRefresh ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {autoRefresh ? 'รีเฟรชอัตโนมัติ: เปิด' : 'รีเฟรชอัตโนมัติ: ปิด'}
            </button>
          </div>
        </motion.div>

        {/* Service Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {health && [
            { name: 'API Server', key: 'api' as const, icon: Server, data: health.api },
            { name: 'Database', key: 'database' as const, icon: Database, data: health.database },
            { name: 'BytePlus', key: 'byteplus' as const, icon: Zap, data: health.byteplus },
            { name: 'Supabase', key: 'supabase' as const, icon: Globe, data: health.supabase },
          ].map((service, index) => {
            const StatusIcon = statusIcons[service.data.status];
            return (
              <motion.div
                key={service.key}
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
                  <div className={cn('p-1.5 rounded-full', statusColors[service.data.status])}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">Latency</span>
                    <span className="text-white font-mono">{service.data.latency.toFixed(0)}ms</span>
                  </div>
                  {'uptime' in service.data && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400">Uptime</span>
                      <span className="text-green-400 font-mono">{formatUptime(service.data.uptime)}</span>
                    </div>
                  )}
                  {'connections' in service.data && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400">Connections</span>
                      <span className="text-white font-mono">{service.data.connections}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Database Stats */}
        {dbStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
          >
            <h3 className="text-lg font-semibold text-white mb-4">สถิติฐานข้อมูล</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'ผู้ใช้ทั้งหมด', value: dbStats.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-400' },
                { label: 'แชททั้งหมด', value: dbStats.totalChats.toLocaleString(), icon: MessageSquare, color: 'text-green-400' },
                { label: 'ข้อความทั้งหมด', value: dbStats.totalMessages.toLocaleString(), icon: MessageSquare, color: 'text-purple-400' },
                { label: 'รูปภาพที่สร้าง', value: dbStats.totalImages.toLocaleString(), icon: ImageIcon, color: 'text-orange-400' },
                { label: 'วิดีโอที่สร้าง', value: dbStats.totalVideos.toLocaleString(), icon: Video, color: 'text-pink-400' },
                { label: 'พื้นที่ใช้งาน', value: dbStats.storageUsed, icon: HardDrive, color: 'text-yellow-400' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className="p-4 bg-neutral-800/50 rounded-xl text-center"
                >
                  <stat.icon className={cn('h-5 w-5 mx-auto mb-2', stat.color)} />
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-neutral-400 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Resource Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {health && [
            {
              name: 'CPU',
              icon: Cpu,
              value: health.cpu.usage,
              max: 100,
              unit: '%',
              detail: `${health.cpu.cores} cores`,
              color: health.cpu.usage > 80 ? 'red' : health.cpu.usage > 50 ? 'yellow' : 'green',
            },
            {
              name: 'หน่วยความจำ',
              icon: Activity,
              value: health.memory.percentage,
              max: 100,
              unit: '%',
              detail: `${formatBytes(health.memory.used)} / ${formatBytes(health.memory.total)}`,
              color: health.memory.percentage > 80 ? 'red' : health.memory.percentage > 50 ? 'yellow' : 'green',
            },
            {
              name: 'พื้นที่จัดเก็บ',
              icon: HardDrive,
              value: health.storage.percentage,
              max: 100,
              unit: '%',
              detail: `${formatBytes(health.storage.used)} / ${formatBytes(health.storage.total)}`,
              color: health.storage.percentage > 80 ? 'red' : health.storage.percentage > 50 ? 'yellow' : 'green',
            },
          ].map((resource, index) => (
            <motion.div
              key={resource.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="p-5 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <resource.icon className="h-5 w-5 text-neutral-400" />
                <span className="font-medium text-white">{resource.name}</span>
              </div>
              <div className="mb-3">
                <span className={cn(
                  'text-4xl font-bold',
                  resource.color === 'green' && 'text-green-400',
                  resource.color === 'yellow' && 'text-yellow-400',
                  resource.color === 'red' && 'text-red-400'
                )}>
                  {resource.value.toFixed(1)}
                </span>
                <span className="text-neutral-400 text-lg">{resource.unit}</span>
              </div>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${resource.value}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={cn(
                    'h-full rounded-full',
                    resource.color === 'green' && 'bg-gradient-to-r from-green-500 to-green-400',
                    resource.color === 'yellow' && 'bg-gradient-to-r from-yellow-500 to-yellow-400',
                    resource.color === 'red' && 'bg-gradient-to-r from-red-500 to-red-400'
                  )}
                />
              </div>
              <p className="text-sm text-neutral-500">{resource.detail}</p>
            </motion.div>
          ))}
        </div>

        {/* API Usage Today */}
        {health && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
          >
            <h3 className="text-lg font-semibold text-white mb-4">การใช้งาน API วันนี้ (24 ชม.)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-3xl font-bold text-white">
                  {health.requests.total.toLocaleString()}
                </p>
                <p className="text-sm text-neutral-400 mt-1">Requests ทั้งหมด</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-400">
                  {health.requests.success.toLocaleString()}
                </p>
                <p className="text-sm text-neutral-400 mt-1">สำเร็จ</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-400">
                  {health.requests.failed.toLocaleString()}
                </p>
                <p className="text-sm text-neutral-400 mt-1">ล้มเหลว</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-400">
                  {health.requests.rate.toFixed(1)}/s
                </p>
                <p className="text-sm text-neutral-400 mt-1">อัตราเฉลี่ย</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* System Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Logs ล่าสุด</h3>
          <div className="space-y-3">
            {logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 + index * 0.05 }}
                className="flex items-start gap-4 p-3 bg-neutral-800/50 rounded-lg"
              >
                <span className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium uppercase',
                  logLevelColors[log.level]
                )}>
                  {log.level}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{log.message}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.timestamp).toLocaleString('th-TH')}
                    </span>
                    <span>แหล่งที่มา: {log.source}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
