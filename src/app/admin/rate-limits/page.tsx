'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Gauge,
  DollarSign,
  Zap,
  Bot,
  RotateCcw,
  Save,
  Loader2,
  Crown,
  Star,
  User as UserIcon,
  Check,
  Users,
  Settings2,
  AlertTriangle,
  ShieldX,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAdmin } from '@/hooks/useAdmin';
import { cn } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';

type PlanId = 'free' | 'starter' | 'pro' | 'premium';

interface PlanDefaults {
  monthly_budget_thb: number;
  rate_chat_per_min: number;
  rate_image_per_min: number;
  rate_video_per_min: number;
  rate_search_per_min: number;
}

interface PlanOverride {
  plan_id: string;
  monthly_budget_thb: number | null;
  rate_chat_per_min: number | null;
  rate_image_per_min: number | null;
  rate_video_per_min: number | null;
  rate_search_per_min: number | null;
  allowed_models: string[] | null;
  blocked_models: string[] | null;
  notes: string | null;
}

interface PlanConfig {
  plan_id: PlanId;
  subscriber_count: number;
  defaults: PlanDefaults;
  overrides: PlanOverride | null;
  has_overrides: boolean;
}

interface AIModel {
  id: string;
  name: string;
  provider: string;
  tier: string;
  is_active: boolean;
}

const planMeta: Record<PlanId, {
  label: string;
  price: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  gradientFrom: string;
}> = {
  free: {
    label: 'Free',
    price: 'ฟรี',
    icon: UserIcon,
    color: 'text-neutral-400',
    bgColor: 'bg-neutral-500/10',
    borderColor: 'border-neutral-700',
    gradientFrom: 'from-neutral-500/20',
  },
  starter: {
    label: 'Starter',
    price: '฿199/เดือน',
    icon: Zap,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    gradientFrom: 'from-blue-500/20',
  },
  pro: {
    label: 'Pro',
    price: '฿499/เดือน',
    icon: Star,
    color: 'text-primary-400',
    bgColor: 'bg-primary-500/10',
    borderColor: 'border-primary-500/30',
    gradientFrom: 'from-primary-500/20',
  },
  premium: {
    label: 'Premium',
    price: '฿799/เดือน',
    icon: Crown,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    gradientFrom: 'from-amber-500/20',
  },
};

type TabId = 'budget' | 'rates' | 'models';

type RateField = {
  key: 'rate_chat_per_min' | 'rate_image_per_min' | 'rate_video_per_min' | 'rate_search_per_min';
  label: string;
  defaultKey: 'rate_chat_per_min' | 'rate_image_per_min' | 'rate_video_per_min' | 'rate_search_per_min';
};

const RATE_FIELDS: RateField[] = [
  { key: 'rate_chat_per_min', label: 'Chat', defaultKey: 'rate_chat_per_min' },
  { key: 'rate_image_per_min', label: 'Image', defaultKey: 'rate_image_per_min' },
  { key: 'rate_video_per_min', label: 'Video', defaultKey: 'rate_video_per_min' },
  { key: 'rate_search_per_min', label: 'Search', defaultKey: 'rate_search_per_min' },
];

type ModelAccessMode = 'default' | 'whitelist' | 'blocklist';

export default function AdminRateLimitsPage() {
  const { role, isAdmin, loading: adminLoading } = useAdmin();
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Edit modal
  const [editPlan, setEditPlan] = useState<PlanConfig | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('budget');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Hydration-safe portal mounting (#8)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Edit form state
  const [budgetEnabled, setBudgetEnabled] = useState(false);
  const [budgetValue, setBudgetValue] = useState('');
  const [rateOverrides, setRateOverrides] = useState<Record<string, { enabled: boolean; value: string }>>({});
  const [modelAccessMode, setModelAccessMode] = useState<ModelAccessMode>('default');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const fetchPlans = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setFetchError(null);
      const response = await authFetch('/api/admin/rate-limits');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
        setAvailableModels(data.available_models || []);
      } else {
        setFetchError(`เกิดข้อผิดพลาดในการโหลดข้อมูล (${response.status})`);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      setFetchError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!adminLoading) {
      fetchPlans();
    }
  }, [fetchPlans, adminLoading]);

  // Escape key handler + scroll lock (#9)
  useEffect(() => {
    if (!showEditModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowEditModal(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showEditModal]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPlans();
  };

  const openEditModal = (plan: PlanConfig) => {
    setEditPlan(plan);
    setActiveTab('budget');

    const o = plan.overrides;

    // Budget
    setBudgetEnabled(o?.monthly_budget_thb != null);
    setBudgetValue(o?.monthly_budget_thb != null ? String(o.monthly_budget_thb) : String(plan.defaults.monthly_budget_thb));

    // Rate overrides
    const rates: Record<string, { enabled: boolean; value: string }> = {};
    for (const field of RATE_FIELDS) {
      const val = o?.[field.key];
      rates[field.key] = {
        enabled: val != null,
        value: val != null ? String(val) : String(plan.defaults[field.defaultKey]),
      };
    }
    setRateOverrides(rates);

    // Model access
    if (o?.allowed_models && o.allowed_models.length > 0) {
      setModelAccessMode('whitelist');
      setSelectedModels(o.allowed_models);
    } else if (o?.blocked_models && o.blocked_models.length > 0) {
      setModelAccessMode('blocklist');
      setSelectedModels(o.blocked_models);
    } else {
      setModelAccessMode('default');
      setSelectedModels([]);
    }

    setNotes(o?.notes || '');
    setSaveError(null);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editPlan) return;
    setSaveError(null);

    // Validation (#7)
    if (budgetEnabled) {
      const bv = Number(budgetValue);
      if (isNaN(bv) || bv < 0) {
        setSaveError('งบรายเดือนต้องเป็นตัวเลขที่ >= 0');
        return;
      }
      if (bv > 100000) {
        setSaveError('งบรายเดือนต้องไม่เกิน 100,000 บาท');
        return;
      }
    }
    for (const field of RATE_FIELDS) {
      const state = rateOverrides[field.key];
      if (state?.enabled) {
        const rv = Number(state.value);
        if (isNaN(rv) || !Number.isInteger(rv) || rv < 1) {
          setSaveError(`${field.label} rate ต้องเป็นจำนวนเต็ม >= 1`);
          return;
        }
        if (rv > 10000) {
          setSaveError(`${field.label} rate ต้องไม่เกิน 10,000 req/min`);
          return;
        }
      }
    }

    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        monthly_budget_thb: budgetEnabled ? Number(budgetValue) : null,
        notes: notes || null,
      };

      for (const field of RATE_FIELDS) {
        const state = rateOverrides[field.key];
        payload[field.key] = state?.enabled ? Number(state.value) : null;
      }

      if (modelAccessMode === 'whitelist' && selectedModels.length > 0) {
        payload.allowed_models = selectedModels;
        payload.blocked_models = null;
      } else if (modelAccessMode === 'blocklist' && selectedModels.length > 0) {
        payload.allowed_models = null;
        payload.blocked_models = selectedModels;
      } else {
        payload.allowed_models = null;
        payload.blocked_models = null;
      }

      const res = await authFetch(`/api/admin/rate-limits/${editPlan.plan_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowEditModal(false);
        setEditPlan(null);
        fetchPlans();
      } else {
        const errData = await res.json().catch(() => null);
        setSaveError(errData?.error || `บันทึกไม่สำเร็จ (${res.status})`);
      }
    } catch (error) {
      console.error('Failed to save overrides:', error);
      setSaveError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!editPlan) return;
    if (!window.confirm(`รีเซ็ตการตั้งค่า ${planMeta[editPlan.plan_id].label} Plan เป็นค่าเริ่มต้น?`)) return;
    setSaveError(null);
    setSaving(true);

    try {
      const res = await authFetch(`/api/admin/rate-limits/${editPlan.plan_id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setShowEditModal(false);
        setEditPlan(null);
        fetchPlans();
      } else {
        const errData = await res.json().catch(() => null);
        setSaveError(errData?.error || `รีเซ็ตไม่สำเร็จ (${res.status})`);
      }
    } catch (error) {
      console.error('Failed to reset overrides:', error);
      setSaveError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setSaving(false);
    }
  };

  const toggleModelSelection = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const getEffectiveValue = (plan: PlanConfig, key: keyof PlanDefaults): { value: number; isCustom: boolean } => {
    const override = plan.overrides?.[key as keyof PlanOverride];
    if (override != null && typeof override === 'number') {
      return { value: override, isCustom: true };
    }
    return { value: plan.defaults[key], isCustom: false };
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'budget', label: 'งบรายเดือน', icon: DollarSign },
    { id: 'rates', label: 'Rate Limits', icon: Gauge },
    { id: 'models', label: 'Model Access', icon: Bot },
  ];

  // Permission gate (#10)
  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <ShieldX className="h-12 w-12 text-red-400 mx-auto" />
          <p className="text-lg font-semibold text-white">ไม่มีสิทธิ์เข้าถึง</p>
          <p className="text-sm text-neutral-400">คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้</p>
        </div>
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
        >
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Gauge className="h-7 w-7 text-primary-400" />
            จัดการ Rate Limits
          </h1>
          <p className="text-neutral-400 mt-1">
            ปรับ budget, rate limit และ model access สำหรับแต่ละ plan
          </p>
        </motion.div>

        {/* Fetch error */}
        {fetchError && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {fetchError}
          </div>
        )}

        {/* Plan Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-neutral-900/50 border border-neutral-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {plans.map((plan, index) => {
              const meta = planMeta[plan.plan_id];
              const PlanIcon = meta.icon;
              const budget = getEffectiveValue(plan, 'monthly_budget_thb');
              const chatRate = getEffectiveValue(plan, 'rate_chat_per_min');

              return (
                <motion.div
                  key={plan.plan_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'relative bg-neutral-900/50 border rounded-xl p-5 flex flex-col',
                    plan.has_overrides ? meta.borderColor : 'border-neutral-800'
                  )}
                >
                  {/* Plan header */}
                  <div className={cn('absolute inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r to-transparent', meta.gradientFrom)} />

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={cn('p-2 rounded-lg', meta.bgColor)}>
                        <PlanIcon className={cn('h-5 w-5', meta.color)} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{meta.label}</h3>
                        <p className="text-xs text-neutral-500">{meta.price}</p>
                      </div>
                    </div>
                    {plan.has_overrides && (
                      <span className="px-2 py-0.5 bg-primary-500/10 text-primary-400 rounded-full text-xs font-medium">
                        Custom
                      </span>
                    )}
                  </div>

                  {/* Subscriber count */}
                  <div className="flex items-center gap-2 mb-4 text-sm text-neutral-400">
                    <Users className="h-4 w-4" />
                    {plan.subscriber_count.toLocaleString()} ผู้ใช้
                  </div>

                  {/* Key stats */}
                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">งบ/เดือน</span>
                      <span className={cn('font-medium', budget.isCustom ? 'text-white' : 'text-neutral-400')}>
                        ฿{budget.value.toLocaleString()}
                        {budget.isCustom && <span className="text-primary-400 ml-1">*</span>}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Chat rate</span>
                      <span className={cn('font-medium', chatRate.isCustom ? 'text-white' : 'text-neutral-400')}>
                        {chatRate.value} req/min
                        {chatRate.isCustom && <span className="text-primary-400 ml-1">*</span>}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Model access</span>
                      <span className="text-neutral-400">
                        {plan.overrides?.allowed_models?.length
                          ? `Whitelist (${plan.overrides.allowed_models.length})`
                          : plan.overrides?.blocked_models?.length
                            ? `Blocklist (${plan.overrides.blocked_models.length})`
                            : 'ตาม tier'}
                      </span>
                    </div>
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={() => openEditModal(plan)}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Settings2 className="h-4 w-4" />
                    ตั้งค่า
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal via Portal */}
      {mounted && createPortal(
        <AnimatePresence>
          {showEditModal && editPlan && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg', planMeta[editPlan.plan_id].bgColor)}>
                      {(() => { const Icon = planMeta[editPlan.plan_id].icon; return <Icon className={cn('h-5 w-5', planMeta[editPlan.plan_id].color)} />; })()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        ตั้งค่า {planMeta[editPlan.plan_id].label} Plan
                      </h3>
                      <p className="text-sm text-neutral-400">
                        {editPlan.subscriber_count.toLocaleString()} ผู้ใช้จะได้รับผลกระทบ
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 text-neutral-400 hover:text-white rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-neutral-800">
                  {tabs.map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
                          activeTab === tab.id
                            ? 'text-primary-400'
                            : 'text-neutral-400 hover:text-white'
                        )}
                      >
                        <TabIcon className="h-4 w-4" />
                        {tab.label}
                        {activeTab === tab.id && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  {/* Budget Tab */}
                  {activeTab === 'budget' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">งบรายเดือน (THB)</p>
                          <p className="text-xs text-neutral-400 mt-1">
                            Default: ฿{editPlan.defaults.monthly_budget_thb}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={budgetEnabled}
                            onChange={(e) => setBudgetEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
                        </label>
                      </div>

                      {budgetEnabled ? (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">฿</span>
                          <input
                            type="number"
                            value={budgetValue}
                            onChange={(e) => setBudgetValue(e.target.value)}
                            className="w-full h-10 pl-8 pr-4 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                            min="0"
                            max="100000"
                            step="10"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-500 italic">
                          ใช้ค่าเริ่มต้น (฿{editPlan.defaults.monthly_budget_thb}/เดือน)
                        </p>
                      )}
                    </div>
                  )}

                  {/* Rate Limits Tab */}
                  {activeTab === 'rates' && (
                    <div className="space-y-4">
                      {RATE_FIELDS.map((field) => {
                        const state = rateOverrides[field.key] || { enabled: false, value: String(editPlan.defaults[field.defaultKey]) };
                        return (
                          <div key={field.key} className="flex items-center gap-4 p-3 bg-neutral-800/50 rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{field.label}</p>
                              <p className="text-xs text-neutral-400">Default: {editPlan.defaults[field.defaultKey]} req/min</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={state.enabled}
                                onChange={(e) => {
                                  setRateOverrides(prev => ({
                                    ...prev,
                                    [field.key]: { ...state, enabled: e.target.checked },
                                  }));
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
                            </label>
                            {state.enabled && (
                              <div className="w-24">
                                <input
                                  type="number"
                                  value={state.value}
                                  onChange={(e) => {
                                    setRateOverrides(prev => ({
                                      ...prev,
                                      [field.key]: { ...state, value: e.target.value },
                                    }));
                                  }}
                                  className="w-full h-8 px-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                                  min="1"
                                  max="10000"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Model Access Tab */}
                  {activeTab === 'models' && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        {([
                          { id: 'default' as const, label: 'ตาม Tier' },
                          { id: 'whitelist' as const, label: 'Whitelist' },
                          { id: 'blocklist' as const, label: 'Blocklist' },
                        ]).map((mode) => (
                          <button
                            key={mode.id}
                            onClick={() => {
                              setModelAccessMode(mode.id);
                              if (mode.id === 'default') setSelectedModels([]);
                            }}
                            className={cn(
                              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors border',
                              modelAccessMode === mode.id
                                ? 'bg-primary-500/10 border-primary-500/50 text-primary-400'
                                : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:text-white'
                            )}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>

                      {modelAccessMode === 'default' && (
                        <p className="text-sm text-neutral-500 italic">
                          ผู้ใช้จะเข้าถึงโมเดลตาม tier ของแต่ละโมเดลปกติ
                        </p>
                      )}

                      {modelAccessMode !== 'default' && (
                        <div className="space-y-2">
                          <p className="text-xs text-neutral-400">
                            {modelAccessMode === 'whitelist'
                              ? 'เลือกโมเดลที่อนุญาตให้ plan นี้ใช้:'
                              : 'เลือกโมเดลที่ต้องการบล็อกจาก plan นี้:'}
                          </p>
                          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                            {availableModels.map((model) => {
                              const isSelected = selectedModels.includes(model.id);
                              return (
                                <button
                                  key={model.id}
                                  onClick={() => toggleModelSelection(model.id)}
                                  className={cn(
                                    'flex items-center gap-2 p-2 rounded-lg border text-left text-sm transition-colors',
                                    isSelected
                                      ? modelAccessMode === 'whitelist'
                                        ? 'bg-green-500/10 border-green-500/50 text-green-400'
                                        : 'bg-red-500/10 border-red-500/50 text-red-400'
                                      : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:text-white'
                                  )}
                                >
                                  <div className={cn(
                                    'h-4 w-4 rounded border flex items-center justify-center shrink-0',
                                    isSelected
                                      ? modelAccessMode === 'whitelist'
                                        ? 'bg-green-500 border-green-500'
                                        : 'bg-red-500 border-red-500'
                                      : 'border-neutral-600'
                                  )}>
                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                  </div>
                                  <div className="truncate">
                                    <p className="truncate">{model.name}</p>
                                    <p className="text-xs text-neutral-500">{model.provider}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div className="mt-6 pt-4 border-t border-neutral-800">
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      หมายเหตุ (สำหรับ admin)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="บันทึกเหตุผลที่ปรับค่า..."
                      rows={2}
                      maxLength={500}
                      className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                    />
                  </div>
                </div>

                {/* Save Error Banner */}
                {saveError && (
                  <div className="mx-6 mb-0 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {saveError}
                  </div>
                )}

                {/* Modal Footer */}
                <div className="flex items-center justify-between p-6 border-t border-neutral-800">
                  <button
                    onClick={handleReset}
                    disabled={saving || !editPlan.has_overrides}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    รีเซ็ตเป็นค่าเริ่มต้น
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white rounded-lg transition-colors"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      บันทึก
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
