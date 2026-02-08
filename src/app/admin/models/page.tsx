'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Power,
  Settings,
  Zap,
  Clock,
  BarChart3,
  Plus,
  X,
  Save,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { PERMISSIONS } from '@/types/admin';
import { cn } from '@/lib/utils';

interface AIModel {
  id: string;
  model_id: string;
  name: string;
  provider: string;
  description: string | null;
  icon: string | null;
  tier: 'free' | 'pro' | 'enterprise';
  is_active: boolean;
  daily_limit: number | null;
  hourly_limit: number | null;
  cooldown_seconds: number;
  priority: number;
  context_length: number | null;
  usage_stats: { requests: number; tokens: number };
}

export default function AdminModelsPage() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchModels = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchModels();
  };

  const handleToggleModel = async (model: AIModel) => {
    try {
      const response = await fetch(`/api/admin/models/${model.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !model.is_active }),
      });

      if (response.ok) {
        setModels(models.map(m =>
          m.id === model.id ? { ...m, is_active: !m.is_active } : m
        ));
      }
    } catch (error) {
      console.error('Failed to toggle model:', error);
    }
  };

  const handleSaveModel = async (model: AIModel) => {
    try {
      const response = await fetch(`/api/admin/models/${model.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daily_limit: model.daily_limit,
          hourly_limit: model.hourly_limit,
          cooldown_seconds: model.cooldown_seconds,
          priority: model.priority,
          tier: model.tier,
        }),
      });

      if (response.ok) {
        setModels(models.map(m => m.id === model.id ? model : m));
        setEditingModel(null);
      }
    } catch (error) {
      console.error('Failed to save model:', error);
    }
  };

  const tierColors = {
    free: 'bg-green-500/10 text-green-400 border-green-500/20',
    pro: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
    enterprise: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
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
            <h1 className="text-2xl font-bold text-white">จัดการ AI Models</h1>
            <p className="text-neutral-400 mt-1">
              จัดการ AI Models ทั้งหมด {models.length} รายการ
            </p>
          </div>
          <PermissionGate permission={PERMISSIONS.MANAGE_MODELS}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              เพิ่ม Model
            </motion.button>
          </PermissionGate>
        </motion.div>

        {/* Models Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 bg-neutral-900/50 border border-neutral-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model, index) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
                className={cn(
                  'relative p-6 bg-neutral-900/50 border rounded-2xl transition-all duration-200',
                  model.is_active
                    ? 'border-neutral-700 hover:border-primary-500/50'
                    : 'border-neutral-800 opacity-60'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-neutral-800 flex items-center justify-center">
                      {model.icon ? (
                        <Image src={model.icon} alt={model.name} fill className="object-cover" />
                      ) : (
                        <Bot className="h-6 w-6 text-neutral-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{model.name}</h3>
                      <p className="text-sm text-neutral-400">{model.provider}</p>
                    </div>
                  </div>

                  {/* Toggle */}
                  <PermissionGate permission={PERMISSIONS.TOGGLE_MODELS}>
                    <button
                      onClick={() => handleToggleModel(model)}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        model.is_active
                          ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                          : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'
                      )}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                  </PermissionGate>
                </div>

                {/* Tier Badge */}
                <span className={cn(
                  'inline-flex px-2 py-1 rounded-full text-xs font-medium border',
                  tierColors[model.tier]
                )}>
                  {model.tier.charAt(0).toUpperCase() + model.tier.slice(1)}
                </span>

                {/* Description */}
                {model.description && (
                  <p className="mt-3 text-sm text-neutral-400 line-clamp-2">
                    {model.description}
                  </p>
                )}

                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="p-3 bg-neutral-800/50 rounded-lg">
                    <div className="flex items-center gap-2 text-neutral-400 text-xs mb-1">
                      <Zap className="h-3 w-3" />
                      Requests (7d)
                    </div>
                    <p className="text-lg font-semibold text-white">
                      {model.usage_stats?.requests?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-800/50 rounded-lg">
                    <div className="flex items-center gap-2 text-neutral-400 text-xs mb-1">
                      <BarChart3 className="h-3 w-3" />
                      Tokens (7d)
                    </div>
                    <p className="text-lg font-semibold text-white">
                      {(model.usage_stats?.tokens || 0) > 1000000
                        ? `${(model.usage_stats.tokens / 1000000).toFixed(1)}M`
                        : (model.usage_stats?.tokens || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Limits */}
                <div className="mt-4 space-y-2 text-sm">
                  {model.daily_limit && (
                    <div className="flex items-center justify-between text-neutral-400">
                      <span>Daily Limit</span>
                      <span className="text-white">{model.daily_limit.toLocaleString()}</span>
                    </div>
                  )}
                  {model.cooldown_seconds > 0 && (
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Cooldown
                      </span>
                      <span className="text-white">{model.cooldown_seconds}s</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <PermissionGate permission={PERMISSIONS.SET_MODEL_LIMITS}>
                  <div className="mt-4 pt-4 border-t border-neutral-800">
                    <button
                      onClick={() => setEditingModel(model)}
                      className="flex items-center justify-center gap-2 w-full py-2 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      ตั้งค่า
                    </button>
                  </div>
                </PermissionGate>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingModel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setEditingModel(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  ตั้งค่า {editingModel.name}
                </h3>
                <button
                  onClick={() => setEditingModel(null)}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Tier */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    ระดับ
                  </label>
                  <div className="flex gap-2">
                    {(['free', 'pro', 'enterprise'] as const).map((tier) => (
                      <button
                        key={tier}
                        onClick={() => setEditingModel({ ...editingModel, tier })}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                          editingModel.tier === tier
                            ? tierColors[tier]
                            : 'border-neutral-700 text-neutral-400 hover:text-white'
                        )}
                      >
                        {tier.charAt(0).toUpperCase() + tier.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Daily Limit */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Daily Limit (ต่อผู้ใช้)
                  </label>
                  <input
                    type="number"
                    value={editingModel.daily_limit || ''}
                    onChange={(e) => setEditingModel({
                      ...editingModel,
                      daily_limit: e.target.value ? parseInt(e.target.value) : null
                    })}
                    placeholder="ไม่จำกัด"
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>

                {/* Hourly Limit */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Hourly Limit (ต่อผู้ใช้)
                  </label>
                  <input
                    type="number"
                    value={editingModel.hourly_limit || ''}
                    onChange={(e) => setEditingModel({
                      ...editingModel,
                      hourly_limit: e.target.value ? parseInt(e.target.value) : null
                    })}
                    placeholder="ไม่จำกัด"
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>

                {/* Cooldown */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Cooldown (วินาที)
                  </label>
                  <input
                    type="number"
                    value={editingModel.cooldown_seconds}
                    onChange={(e) => setEditingModel({
                      ...editingModel,
                      cooldown_seconds: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Priority (ลำดับการแสดงผล)
                  </label>
                  <input
                    type="number"
                    value={editingModel.priority}
                    onChange={(e) => setEditingModel({
                      ...editingModel,
                      priority: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditingModel(null)}
                    className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => handleSaveModel(editingModel)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    บันทึก
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
