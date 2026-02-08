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
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { PERMISSIONS } from '@/types/admin';
import { cn } from '@/lib/utils';

interface SettingItem {
  key: string;
  value: string;
  description: string | null;
  is_public: boolean;
  category: string;
}

interface SettingsGroup {
  category: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  settings: SettingItem[];
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
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data || []);
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
      const response = await fetch('/api/admin/settings', {
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
    general: { icon: <Globe className="h-5 w-5" />, title: 'ทั่วไป', description: 'การตั้งค่าพื้นฐานของระบบ' },
    security: { icon: <Shield className="h-5 w-5" />, title: 'ความปลอดภัย', description: 'การตั้งค่าความปลอดภัยและการเข้าถึง' },
    ai: { icon: <Zap className="h-5 w-5" />, title: 'AI Models', description: 'การตั้งค่า AI และ rate limits' },
    notifications: { icon: <Bell className="h-5 w-5" />, title: 'การแจ้งเตือน', description: 'การตั้งค่าการแจ้งเตือนและอีเมล' },
    billing: { icon: <CreditCard className="h-5 w-5" />, title: 'การชำระเงิน', description: 'การตั้งค่าแผนและการชำระเงิน' },
    chat: { icon: <MessageSquare className="h-5 w-5" />, title: 'แชท', description: 'การตั้งค่าฟีเจอร์แชท' },
  };

  // Mock settings if none loaded
  const mockSettings: SettingItem[] = [
    { key: 'site_name', value: 'RabbitHub', description: 'ชื่อเว็บไซต์', is_public: true, category: 'general' },
    { key: 'site_description', value: 'AI Chat Platform', description: 'คำอธิบายเว็บไซต์', is_public: true, category: 'general' },
    { key: 'maintenance_mode', value: 'false', description: 'เปิด/ปิดโหมดบำรุงรักษา', is_public: false, category: 'general' },
    { key: 'allow_registration', value: 'true', description: 'อนุญาตให้สมัครสมาชิกใหม่', is_public: false, category: 'security' },
    { key: 'require_email_verification', value: 'true', description: 'ต้องยืนยันอีเมล', is_public: false, category: 'security' },
    { key: 'max_login_attempts', value: '5', description: 'จำนวนครั้งสูงสุดที่ login ผิดได้', is_public: false, category: 'security' },
    { key: 'openrouter_api_key', value: 'sk-or-***', description: 'OpenRouter API Key', is_public: false, category: 'ai' },
    { key: 'default_model', value: 'gpt-4', description: 'Model เริ่มต้น', is_public: true, category: 'ai' },
    { key: 'max_tokens_per_request', value: '4096', description: 'จำนวน tokens สูงสุดต่อ request', is_public: false, category: 'ai' },
    { key: 'rate_limit_per_minute', value: '20', description: 'จำนวน requests สูงสุดต่อนาที', is_public: false, category: 'ai' },
    { key: 'smtp_host', value: 'smtp.gmail.com', description: 'SMTP Server', is_public: false, category: 'notifications' },
    { key: 'smtp_port', value: '587', description: 'SMTP Port', is_public: false, category: 'notifications' },
    { key: 'stripe_publishable_key', value: 'pk_***', description: 'Stripe Publishable Key', is_public: true, category: 'billing' },
    { key: 'stripe_secret_key', value: 'sk_***', description: 'Stripe Secret Key', is_public: false, category: 'billing' },
    { key: 'free_daily_messages', value: '50', description: 'ข้อความฟรีต่อวัน', is_public: true, category: 'chat' },
    { key: 'max_conversation_length', value: '100', description: 'ความยาวสูงสุดของการสนทนา', is_public: false, category: 'chat' },
  ];

  const displaySettings = settings.length > 0 ? settings : mockSettings;

  const groupedSettings: SettingsGroup[] = Object.entries(categoryConfig).map(([category, config]) => ({
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
              จัดการการตั้งค่าทั้งหมดของ RabbitHub
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
        ) : (
          <motion.div
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
                        <p className="font-medium text-white">{setting.key}</p>
                        {isSecretField && (
                          <Lock className="h-3 w-3 text-yellow-500" />
                        )}
                        {setting.is_public && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-green-500/10 text-green-400 rounded">
                            Public
                          </span>
                        )}
                      </div>
                      {setting.description && (
                        <p className="text-sm text-neutral-400 mt-1">{setting.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {setting.value === 'true' || setting.value === 'false' ? (
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
