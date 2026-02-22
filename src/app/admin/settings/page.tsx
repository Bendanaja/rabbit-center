'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Save,
  RotateCcw,
  Globe,
  Shield,
  Zap,
  Bell,
  CreditCard,
  MessageSquare,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Image as ImageIcon,
  Video,
  Power,
  Gauge,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { PERMISSIONS } from '@/types/admin';
import { cn } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';

interface SettingItem {
  key: string;
  value: string;
  description: string | null;
  is_public: boolean;
  category: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeCategory, setActiveCategory] = useState('general');

  const fetchSettings = useCallback(async () => {
    try {
      const response = await authFetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(Array.isArray(data) ? data : data.settings || []);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSettings();
  };

  const handleChange = (key: string, value: string) => {
    setChanges(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await authFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: changes }),
      });

      if (response.ok) {
        setSettings(settings.map(s => ({
          ...s,
          value: changes[s.key] !== undefined ? changes[s.key] : s.value
        })));
        setChanges({});
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setChanges({});
  };

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isSecret = (key: string) =>
    key.toLowerCase().includes('key') ||
    key.toLowerCase().includes('secret') ||
    key.toLowerCase().includes('password') ||
    key.toLowerCase().includes('token');

  const categoryConfig: { [key: string]: { icon: React.ReactNode; title: string; description: string } } = {
    general: { icon: <Globe className="h-5 w-5" />, title: 'ทั่วไป', description: 'ชื่อเว็บ, คำอธิบาย, โลโก้' },
    features: { icon: <Power className="h-5 w-5" />, title: 'ฟีเจอร์', description: 'เปิด/ปิดฟีเจอร์ต่างๆ' },
    rate_limits: { icon: <Gauge className="h-5 w-5" />, title: 'Rate Limits', description: 'จำกัดการใช้งานต่อแผน' },
    ai: { icon: <Zap className="h-5 w-5" />, title: 'AI Models', description: 'การตั้งค่า AI และ API Keys' },
    billing: { icon: <CreditCard className="h-5 w-5" />, title: 'การชำระเงิน', description: 'PromptPay, การตั้งค่าชำระเงิน' },
    security: { icon: <Shield className="h-5 w-5" />, title: 'ความปลอดภัย', description: 'การเข้าถึงและความปลอดภัย' },
  };

  const displaySettings = settings;

  const groupedSettings = Object.entries(categoryConfig).map(([category, config]) => ({
    category,
    ...config,
    settings: displaySettings.filter(s => s.category === category),
  })).filter(g => g.settings.length > 0);

  const hasChanges = Object.keys(changes).length > 0;

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
            <h1 className="text-2xl font-bold text-white">การตั้งค่าระบบ</h1>
            <p className="text-neutral-400 mt-1">
              จัดการการตั้งค่าทั้งหมดของ RabbitHub AI
            </p>
          </div>
          <PermissionGate permission={PERMISSIONS.MANAGE_SYSTEM_SETTINGS}>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  รีเซ็ต
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors',
                  hasChanges
                    ? 'bg-primary-500 hover:bg-primary-600 text-white'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                )}
              >
                {saving ? (
                  <div className="animate-spin">
                    <Settings className="h-4 w-4" />
                  </div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </motion.button>
            </div>
          </PermissionGate>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
            >
              <Check className="h-5 w-5 text-green-400" />
              <span className="text-green-400">บันทึกการตั้งค่าเรียบร้อยแล้ว</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2"
        >
          {groupedSettings.map((group) => (
            <button
              key={group.category}
              onClick={() => setActiveCategory(group.category)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                activeCategory === group.category
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
              )}
            >
              {group.icon}
              {group.title}
            </button>
          ))}
        </motion.div>

        {/* Active Category Description */}
        {categoryConfig[activeCategory] && (
          <motion.p
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-neutral-500"
          >
            {categoryConfig[activeCategory].description}
          </motion.p>
        )}

        {/* Settings Content */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-neutral-900/50 border border-neutral-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : displaySettings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
          >
            <Settings className="h-10 w-10 text-neutral-600 mb-4" />
            <p className="text-neutral-400 text-lg font-medium mb-2">ยังไม่มีการตั้งค่า</p>
            <p className="text-neutral-500 text-sm">กรุณาเพิ่มค่าตั้งต้นในฐานข้อมูล (ตาราง system_config)</p>
          </motion.div>
        ) : (
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden"
          >
            {groupedSettings
              .find(g => g.category === activeCategory)
              ?.settings.map((setting, index) => {
                const value = changes[setting.key] !== undefined ? changes[setting.key] : setting.value;
                const isSecretField = isSecret(setting.key);
                const showValue = showSecrets[setting.key];
                const isBooleanField = setting.value === 'true' || setting.value === 'false';

                return (
                  <motion.div
                    key={setting.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className={cn(
                      'p-5 flex items-center justify-between gap-4',
                      index > 0 && 'border-t border-neutral-800'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{setting.description || setting.key}</p>
                        {isSecretField && (
                          <Lock className="h-3 w-3 text-yellow-500" />
                        )}
                        {changes[setting.key] !== undefined && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-primary-500/10 text-primary-400 rounded">
                            แก้ไขแล้ว
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-1 font-mono">{setting.key}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isBooleanField ? (
                        <PermissionGate permission={PERMISSIONS.MANAGE_SYSTEM_SETTINGS}>
                          <button
                            onClick={() => handleChange(setting.key, value === 'true' ? 'false' : 'true')}
                            className={cn(
                              'relative w-12 h-6 rounded-full transition-colors',
                              value === 'true' ? 'bg-primary-500' : 'bg-neutral-700'
                            )}
                          >
                            <motion.div
                              animate={{ x: value === 'true' ? 24 : 2 }}
                              className="absolute top-1 w-4 h-4 bg-white rounded-full"
                            />
                          </button>
                        </PermissionGate>
                      ) : (
                        <PermissionGate
                          permission={PERMISSIONS.MANAGE_SYSTEM_SETTINGS}
                          fallback={
                            <span className="text-neutral-400 font-mono text-sm">
                              {isSecretField ? '••••••••' : value}
                            </span>
                          }
                        >
                          <div className="relative">
                            <input
                              type={isSecretField && !showValue ? 'password' : 'text'}
                              value={value}
                              onChange={(e) => handleChange(setting.key, e.target.value)}
                              className={cn(
                                'w-64 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all',
                                changes[setting.key] !== undefined && 'border-primary-500'
                              )}
                            />
                            {isSecretField && (
                              <button
                                onClick={() => toggleSecret(setting.key)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white"
                              >
                                {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            )}
                          </div>
                        </PermissionGate>
                      )}
                    </div>
                  </motion.div>
                );
              })}
          </motion.div>
        )}

        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg"
        >
          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-medium">คำเตือน</p>
            <p className="text-sm text-neutral-400 mt-1">
              การเปลี่ยนแปลงการตั้งค่าบางอย่างอาจส่งผลกระทบต่อผู้ใช้ทั้งหมด กรุณาตรวจสอบให้แน่ใจก่อนบันทึก
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
