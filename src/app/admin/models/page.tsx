'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
  MessageSquare,
  ImageIcon,
  Video,
  Search,
  Loader2,
  ExternalLink,
  Check,
  AlertCircle,
  LayoutGrid,
  List,
  ChevronDown,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAdmin } from '@/hooks/useAdmin';
import { PERMISSIONS } from '@/types/admin';
import { authFetch } from '@/lib/api-client';
import { useRealtime } from '@/hooks/useRealtime';
import { cn } from '@/lib/utils';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string | null;
  icon_url: string | null;
  tier: 'free' | 'starter' | 'pro' | 'premium';
  is_active: boolean;
  daily_limit: number | null;
  hourly_limit: number | null;
  cooldown_seconds: number;
  priority: number;
  context_window: number | null;
  model_type: 'chat' | 'image' | 'video';
  api_provider: 'byteplus' | 'openrouter';
  usage_stats: { requests: number; tokens: number };
  input_cost_per_1k: number | null;
  output_cost_per_1k: number | null;
}

interface OpenRouterModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  context_length: number;
  prompt_cost: number;
  completion_cost: number;
  is_free: boolean;
  modality: string;
  already_added: boolean;
  icon_url: string;
}

const tierColors: Record<string, string> = {
  free: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  starter: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  pro: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
  premium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const tierLabels: Record<string, string> = {
  free: 'ฟรี',
  starter: 'เริ่มต้น',
  pro: 'โปร',
  premium: 'พรีเมียม',
};

const tierDot: Record<string, string> = {
  free: 'bg-emerald-400',
  starter: 'bg-sky-400',
  pro: 'bg-primary-400',
  premium: 'bg-amber-400',
};

const typeConfig = {
  chat: { label: 'แชท', icon: MessageSquare, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
  image: { label: 'สร้างรูป', icon: ImageIcon, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
  video: { label: 'สร้างวิดีโอ', icon: Video, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
} as const;

export default function AdminModelsPage() {
  const { checkPermission } = useAdmin();
  const canToggle = checkPermission(PERMISSIONS.TOGGLE_MODELS);
  const canSetLimits = checkPermission(PERMISSIONS.SET_MODEL_LIMITS);
  const canManage = checkPermission(PERMISSIONS.MANAGE_MODELS);

  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [typeFilter, setTypeFilter] = useState<'all' | 'chat' | 'image' | 'video'>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'starter' | 'pro' | 'premium'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const isFirstLoad = useRef(true);

  const fetchModels = useCallback(async () => {
    try {
      const response = await authFetch('/api/admin/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      if (isFirstLoad.current) {
        setLoading(false);
        isFirstLoad.current = false;
      }
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Real-time: auto-refetch on model config changes
  const modelSubs = useMemo(() => [
    { table: 'ai_models' },
  ], []);
  useRealtime(modelSubs, fetchModels);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchModels();
  };

  const handleToggleModel = async (model: AIModel) => {
    const newActive = !model.is_active;
    // Optimistic update — flip UI instantly
    setModels(prev => prev.map(m =>
      m.id === model.id ? { ...m, is_active: newActive } : m
    ));
    try {
      const response = await authFetch(`/api/admin/models/${model.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newActive }),
      });
      if (!response.ok) {
        // Revert on failure
        setModels(prev => prev.map(m =>
          m.id === model.id ? { ...m, is_active: model.is_active } : m
        ));
      }
    } catch {
      // Revert on error
      setModels(prev => prev.map(m =>
        m.id === model.id ? { ...m, is_active: model.is_active } : m
      ));
    }
  };

  const handleSaveModel = async (model: AIModel) => {
    // Optimistic update — apply instantly
    const prevModels = models;
    setModels(prev => prev.map(m => m.id === model.id ? model : m));
    setEditingModel(null);
    try {
      const response = await authFetch(`/api/admin/models/${model.id}`, {
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
      if (!response.ok) {
        // Revert on failure
        setModels(prevModels);
      }
    } catch {
      setModels(prevModels);
    }
  };

  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm('ลบ model นี้ออกจากระบบ?')) return;
    // Optimistic update — remove instantly
    const prevModels = models;
    setModels(prev => prev.filter(m => m.id !== modelId));
    try {
      const response = await authFetch(`/api/admin/models/${modelId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        // Revert on failure
        setModels(prevModels);
      }
    } catch {
      setModels(prevModels);
    }
  };

  const handleModelAdded = () => {
    setShowAddModal(false);
    fetchModels();
  };

  // Quick tier change directly from the table
  const handleQuickTierChange = async (model: AIModel, newTier: AIModel['tier']) => {
    const oldTier = model.tier;
    // Optimistic update
    setModels(prev => prev.map(m =>
      m.id === model.id ? { ...m, tier: newTier } : m
    ));
    try {
      const response = await authFetch(`/api/admin/models/${model.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier }),
      });
      if (!response.ok) {
        setModels(prev => prev.map(m =>
          m.id === model.id ? { ...m, tier: oldTier } : m
        ));
      }
    } catch {
      setModels(prev => prev.map(m =>
        m.id === model.id ? { ...m, tier: oldTier } : m
      ));
    }
  };

  // Filtered & searched models
  const filteredModels = useMemo(() => {
    return models.filter(m => {
      if (typeFilter !== 'all' && m.model_type !== typeFilter) return false;
      if (tierFilter !== 'all' && m.tier !== tierFilter) return false;
      if (statusFilter === 'active' && !m.is_active) return false;
      if (statusFilter === 'inactive' && m.is_active) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return m.name.toLowerCase().includes(q)
          || m.id.toLowerCase().includes(q)
          || m.provider.toLowerCase().includes(q);
      }
      return true;
    });
  }, [models, typeFilter, tierFilter, statusFilter, searchQuery]);

  // Group models by API provider (byteplus/openrouter), then by provider name
  const groupedByApiProvider = useMemo(() => {
    const byteplusModels = filteredModels.filter(m => m.api_provider !== 'openrouter');
    const openrouterModels = filteredModels.filter(m => m.api_provider === 'openrouter');

    const groupByProvider = (models: AIModel[]) => {
      const groups: Record<string, AIModel[]> = {};
      models.forEach(m => {
        const key = m.provider || 'Unknown';
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
      });
      return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    };

    return {
      byteplus: { models: byteplusModels, groups: groupByProvider(byteplusModels) },
      openrouter: { models: openrouterModels, groups: groupByProvider(openrouterModels) },
    };
  }, [filteredModels]);

  // Stats
  const stats = useMemo(() => ({
    total: models.length,
    active: models.filter(m => m.is_active).length,
    chat: models.filter(m => m.model_type === 'chat').length,
    image: models.filter(m => m.model_type === 'image').length,
    video: models.filter(m => m.model_type === 'video').length,
    free: models.filter(m => m.tier === 'free').length,
    paid: models.filter(m => m.tier !== 'free').length,
    byteplus: models.filter(m => m.api_provider !== 'openrouter').length,
    openrouter: models.filter(m => m.api_provider === 'openrouter').length,
  }), [models]);

  return (
    <div className="min-h-screen">
      <AdminHeader onRefresh={handleRefresh} isRefreshing={refreshing} />

      <div className="p-6 space-y-5">
        {/* Header with Stats */}
        <div
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">จัดการ AI Models</h1>
            <p className="text-neutral-400 mt-1">
              {stats.total} โมเดล — {stats.active} เปิดใช้งาน
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Stats Pills */}
            <div className="hidden md:flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800/80 border border-neutral-700/50 text-xs text-neutral-300">
                <MessageSquare className="h-3 w-3 text-sky-400" />
                {stats.chat} แชท
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800/80 border border-neutral-700/50 text-xs text-neutral-300">
                <ImageIcon className="h-3 w-3 text-pink-400" />
                {stats.image} รูป
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800/80 border border-neutral-700/50 text-xs text-neutral-300">
                <Video className="h-3 w-3 text-amber-400" />
                {stats.video} วิดีโอ
              </span>
            </div>

            {canManage && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                เพิ่ม Model
              </button>
            )}
          </div>
        </div>

        {/* Toolbar: Search + Filters + View Toggle */}
        <div
          className="flex flex-col sm:flex-row gap-3"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาโมเดล... (ชื่อ, ID, provider)"
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Filter */}
            <div className="flex items-center bg-neutral-900/80 border border-neutral-800 rounded-lg overflow-hidden">
              {(['all', 'chat', 'image', 'video'] as const).map((t) => {
                const Icon = t === 'all' ? Bot : typeConfig[t].icon;
                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
                      typeFilter === t
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-neutral-400 hover:text-white'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">
                      {t === 'all' ? 'ทั้งหมด' : typeConfig[t].label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as typeof tierFilter)}
              className="px-3 py-2 bg-neutral-900/80 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
            >
              <option value="all">ทุกระดับ</option>
              <option value="free">ฟรี</option>
              <option value="starter">฿199</option>
              <option value="pro">฿499</option>
              <option value="premium">฿799</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2 bg-neutral-900/80 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="active">เปิดใช้งาน</option>
              <option value="inactive">ปิดใช้งาน</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-neutral-900/80 border border-neutral-800 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'table' ? 'bg-primary-500/20 text-primary-400' : 'text-neutral-500 hover:text-white'
                )}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'grid' ? 'bg-primary-500/20 text-primary-400' : 'text-neutral-500 hover:text-white'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {(searchQuery || typeFilter !== 'all' || tierFilter !== 'all' || statusFilter !== 'all') && (
          <div className="text-xs text-neutral-500">
            แสดง {filteredModels.length} จาก {models.length} โมเดล
          </div>
        )}

        {/* Content */}
        {loading ? (
          <LoadingSkeleton viewMode={viewMode} />
        ) : viewMode === 'table' ? (
          /* ─── Table View ─── */
          <div className="space-y-6">
            {/* BytePlus Section */}
            {groupedByApiProvider.byteplus.models.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <Zap className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-sm font-semibold text-cyan-300">BytePlus / ในระบบ</span>
                  </div>
                  <span className="text-xs text-neutral-500">{groupedByApiProvider.byteplus.models.length} โมเดล</span>
                  <div className="flex-1 border-t border-neutral-800/50" />
                </div>
                <ModelTable
                  groups={groupedByApiProvider.byteplus.groups}
                  deleting={deleting}
                  onToggle={handleToggleModel}
                  onEdit={setEditingModel}
                  onDelete={handleDeleteModel}
                  onTierChange={handleQuickTierChange}
                  canToggle={canToggle}
                  canSetLimits={canSetLimits}
                  canManage={canManage}
                />
              </div>
            )}

            {/* OpenRouter Section */}
            {groupedByApiProvider.openrouter.models.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <ExternalLink className="h-3.5 w-3.5 text-orange-400" />
                    <span className="text-sm font-semibold text-orange-300">OpenRouter</span>
                  </div>
                  <span className="text-xs text-neutral-500">{groupedByApiProvider.openrouter.models.length} โมเดล</span>
                  <div className="flex-1 border-t border-neutral-800/50" />
                </div>
                <ModelTable
                  groups={groupedByApiProvider.openrouter.groups}
                  deleting={deleting}
                  onToggle={handleToggleModel}
                  onEdit={setEditingModel}
                  onDelete={handleDeleteModel}
                  onTierChange={handleQuickTierChange}
                  canToggle={canToggle}
                  canSetLimits={canSetLimits}
                  canManage={canManage}
                />
              </div>
            )}

            {filteredModels.length === 0 && !loading && (
              <div className="py-16 text-center">
                <Bot className="h-10 w-10 mx-auto mb-3 text-neutral-600" />
                <p className="text-neutral-400">ไม่พบโมเดลที่ตรงกับเงื่อนไข</p>
              </div>
            )}
          </div>
        ) : (
          /* ─── Grid View ─── */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredModels.map((model) => (
              <div
                key={model.id}
                className={cn(
                  'relative p-5 bg-neutral-900/50 border rounded-2xl transition-all duration-200 group',
                  model.is_active
                    ? 'border-neutral-800 hover:border-neutral-700'
                    : 'border-neutral-800/50 opacity-60'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl overflow-hidden bg-neutral-800 shrink-0 flex items-center justify-center">
                      {model.icon_url ? (
                        <img src={model.icon_url} alt={model.name} className="h-10 w-10 object-cover" />
                      ) : (
                        <Bot className="h-5 w-5 text-neutral-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">{model.name}</h3>
                      <p className="text-[11px] text-neutral-500">{model.provider}</p>
                    </div>
                  </div>

                  {canToggle && (
                    <button
                      onClick={() => handleToggleModel(model)}
                      className="relative shrink-0"
                      title={model.is_active ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                    >
                      <div className={cn(
                        'h-5 w-9 rounded-full transition-colors relative',
                        model.is_active ? 'bg-emerald-500/30' : 'bg-neutral-700',
                      )}>
                        <div className={cn(
                          'absolute top-0.5 h-4 w-4 rounded-full transition-all',
                          model.is_active
                            ? 'left-[18px] bg-emerald-400'
                            : 'left-0.5 bg-neutral-500'
                        )} />
                      </div>
                    </button>
                  )}
                </div>

                {/* Model ID */}
                <p className="text-[11px] text-neutral-600 font-mono mb-3 truncate">{model.id}</p>

                {/* Badges */}
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border',
                    typeConfig[model.model_type].bg
                  )}>
                    {(() => {
                      const Icon = typeConfig[model.model_type].icon;
                      return <Icon className="h-3 w-3" />;
                    })()}
                    {typeConfig[model.model_type].label}
                  </span>
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border',
                    tierColors[model.tier]
                  )}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', tierDot[model.tier])} />
                    {tierLabels[model.tier]}
                  </span>
                  {model.api_provider === 'openrouter' && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-orange-500/10 text-orange-400 border-orange-500/20">
                      <ExternalLink className="h-2.5 w-2.5" />
                      OR
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-neutral-800/40 rounded-lg">
                    <div className="flex items-center gap-1.5 text-neutral-500 text-[10px] mb-0.5">
                      <Zap className="h-3 w-3" />
                      Requests
                    </div>
                    <p className="text-sm font-semibold text-white tabular-nums">
                      {model.usage_stats?.requests?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="p-2.5 bg-neutral-800/40 rounded-lg">
                    <div className="flex items-center gap-1.5 text-neutral-500 text-[10px] mb-0.5">
                      <BarChart3 className="h-3 w-3" />
                      Tokens
                    </div>
                    <p className="text-sm font-semibold text-white tabular-nums">
                      {(model.usage_stats?.tokens || 0) > 1000000
                        ? `${(model.usage_stats.tokens / 1000000).toFixed(1)}M`
                        : (model.usage_stats?.tokens || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {canSetLimits && (
                  <div className="mt-3 pt-3 border-t border-neutral-800/60 flex items-center gap-2">
                    <button
                      onClick={() => setEditingModel(model)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      ตั้งค่า
                    </button>
                    {canManage && (
                      <button
                        onClick={() => handleDeleteModel(model.id)}
                        disabled={deleting === model.id}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="ลบ"
                      >
                        {deleting === model.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {filteredModels.length === 0 && !loading && (
              <div className="col-span-full py-16 text-center">
                <Bot className="h-10 w-10 mx-auto mb-3 text-neutral-600" />
                <p className="text-neutral-400">ไม่พบโมเดลที่ตรงกับเงื่อนไข</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingModel && (
          <EditModelModal
            model={editingModel}
            onChange={setEditingModel}
            onSave={handleSaveModel}
            onClose={() => setEditingModel(null)}
          />
        )}
      </AnimatePresence>

      {/* Add Model Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddModelModal
            onClose={() => setShowAddModal(false)}
            onAdded={handleModelAdded}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Model Table (single table with provider group headers as rows) ──────
function ModelTable({
  groups,
  deleting,
  onToggle,
  onEdit,
  onDelete,
  onTierChange,
  canToggle,
  canSetLimits,
  canManage,
}: {
  groups: [string, AIModel[]][];
  deleting: string | null;
  onToggle: (model: AIModel) => void;
  onEdit: (model: AIModel) => void;
  onDelete: (modelId: string) => void;
  onTierChange: (model: AIModel, tier: AIModel['tier']) => void;
  canToggle: boolean;
  canSetLimits: boolean;
  canManage: boolean;
}) {
  const colCount = 7;
  return (
    <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-xl">
      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-[60px]" />
          <col />
          <col className="w-[100px]" />
          <col className="w-[100px]" />
          <col className="w-[110px]" />
          <col className="w-[110px]" />
          <col className="w-[80px]" />
        </colgroup>
        <thead>
          <tr className="border-b border-neutral-800/60">
            <th className="px-4 py-2.5 text-left text-[11px] font-medium text-neutral-500 uppercase tracking-wider">สถานะ</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-medium text-neutral-500 uppercase tracking-wider">โมเดล</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-medium text-neutral-500 uppercase tracking-wider hidden md:table-cell">ประเภท</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-medium text-neutral-500 uppercase tracking-wider">ระดับ</th>
            <th className="px-4 py-2.5 text-right text-[11px] font-medium text-neutral-500 uppercase tracking-wider hidden lg:table-cell">7d Requests</th>
            <th className="px-4 py-2.5 text-right text-[11px] font-medium text-neutral-500 uppercase tracking-wider hidden lg:table-cell">7d Tokens</th>
            <th className="px-4 py-2.5 text-right text-[11px] font-medium text-neutral-500 uppercase tracking-wider">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(([provider, providerModels]) => (
            <React.Fragment key={provider}>
              {/* Provider group header row */}
              <tr className="bg-neutral-800/20">
                <td colSpan={colCount} className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {providerModels[0]?.icon_url && (
                      <img src={providerModels[0].icon_url} alt={provider} className="h-4 w-4 rounded object-cover" />
                    )}
                    <span className="text-xs font-medium text-neutral-400">{provider}</span>
                    <span className="text-[10px] text-neutral-600">{providerModels.length}</span>
                  </div>
                </td>
              </tr>
              {/* Model rows */}
              {providerModels.map((model) => (
                <tr
                  key={model.id}
                  className={cn(
                    'border-t border-neutral-800/40 transition-colors group',
                    model.is_active ? 'hover:bg-white/[0.02]' : 'opacity-50'
                  )}
                >
                  <td className="px-4 py-2.5">
                    {canToggle ? (
                      <button
                        onClick={() => onToggle(model)}
                        className="relative"
                        title={model.is_active ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                      >
                        <div className={cn(
                          'h-5 w-9 rounded-full transition-colors relative',
                          model.is_active ? 'bg-emerald-500/30' : 'bg-neutral-700',
                        )}>
                          <div className={cn(
                            'absolute top-0.5 h-4 w-4 rounded-full transition-all',
                            model.is_active ? 'left-[18px] bg-emerald-400' : 'left-0.5 bg-neutral-500'
                          )} />
                        </div>
                      </button>
                    ) : (
                      <div className={cn('h-2.5 w-2.5 rounded-full', model.is_active ? 'bg-emerald-400' : 'bg-neutral-600')} />
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg overflow-hidden bg-neutral-800 shrink-0 flex items-center justify-center">
                        {model.icon_url ? (
                          <img src={model.icon_url} alt={model.name} className="h-8 w-8 object-cover" />
                        ) : (
                          <Bot className="h-4 w-4 text-neutral-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{model.name}</p>
                        <p className="text-[11px] text-neutral-500 font-mono truncate">{model.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border',
                      typeConfig[model.model_type].bg
                    )}>
                      {(() => { const Icon = typeConfig[model.model_type].icon; return <Icon className="h-3 w-3" />; })()}
                      {typeConfig[model.model_type].label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {canSetLimits && model.is_active ? (
                      <TierSelector value={model.tier} onChange={(tier) => onTierChange(model, tier)} />
                    ) : (
                      <span className={cn('inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium border', tierColors[model.tier])}>
                        {tierLabels[model.tier]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right hidden lg:table-cell">
                    <span className="text-sm text-neutral-300 tabular-nums">
                      {model.usage_stats?.requests?.toLocaleString() || '0'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right hidden lg:table-cell">
                    <span className="text-sm text-neutral-300 tabular-nums">
                      {(model.usage_stats?.tokens || 0) > 1000000
                        ? `${(model.usage_stats.tokens / 1000000).toFixed(1)}M`
                        : (model.usage_stats?.tokens || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {model.is_active && (
                      <div className="flex items-center justify-end gap-1">
                        {canSetLimits && (
                          <button
                            onClick={() => onEdit(model)}
                            className="p-1.5 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors opacity-0 group-hover:opacity-100"
                            title="ตั้งค่า"
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {canManage && (
                          <button
                            onClick={() => onDelete(model.id)}
                            disabled={deleting === model.id}
                            className="p-1.5 rounded-md text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                            title="ลบ"
                          >
                            {deleting === model.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tier Selector (inline dropdown) ─────────────────────
function TierSelector({
  value,
  onChange,
}: {
  value: AIModel['tier'];
  onChange: (tier: AIModel['tier']) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUp(spaceBelow < 160);
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors',
          tierColors[value],
          'hover:brightness-110 cursor-pointer'
        )}
      >
        <span className={cn('h-1.5 w-1.5 rounded-full', tierDot[value])} />
        {tierLabels[value]}
        <ChevronDown className={cn('h-2.5 w-2.5 opacity-60 transition-transform', isOpen && openUp && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className={cn(
                'absolute left-0 z-50 bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden shadow-xl min-w-[110px]',
                openUp ? 'bottom-full mb-1' : 'top-full mt-1'
              )}
            >
              {(['free', 'starter', 'pro', 'premium'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => {
                    onChange(tier);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors',
                    value === tier
                      ? 'bg-primary-500/10 text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', tierDot[tier])} />
                  {tierLabels[tier]}
                  {value === tier && <Check className="h-3 w-3 ml-auto text-primary-400" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────
function LoadingSkeleton({ viewMode }: { viewMode: 'grid' | 'table' }) {
  if (viewMode === 'table') {
    return (
      <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-xl overflow-hidden">
        <div className="animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-neutral-800/40">
              <div className="h-5 w-9 bg-neutral-800 rounded-full" />
              <div className="h-8 w-8 bg-neutral-800 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-neutral-800 rounded w-32" />
                <div className="h-2.5 bg-neutral-800/60 rounded w-48" />
              </div>
              <div className="h-5 w-14 bg-neutral-800 rounded" />
              <div className="h-5 w-14 bg-neutral-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-56 bg-neutral-900/50 border border-neutral-800 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

// ─── Edit Model Modal ────────────────────────────────────
function EditModelModal({
  model,
  onChange,
  onSave,
  onClose,
}: {
  model: AIModel;
  onChange: (m: AIModel) => void;
  onSave: (m: AIModel) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {model.icon_url && (
              <img src={model.icon_url} alt={model.name} className="h-8 w-8 rounded-lg object-cover" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">{model.name}</h3>
              <p className="text-xs text-neutral-500 font-mono">{model.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Tier */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">ระดับ</label>
            <div className="flex gap-2">
              {(['free', 'starter', 'pro', 'premium'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => onChange({ ...model, tier })}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                    model.tier === tier
                      ? tierColors[tier]
                      : 'border-neutral-700 text-neutral-400 hover:text-white'
                  )}
                >
                  {tierLabels[tier]}
                </button>
              ))}
            </div>
          </div>

          {/* Limits Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Daily Limit</label>
              <input
                type="number"
                value={model.daily_limit || ''}
                onChange={(e) => onChange({ ...model, daily_limit: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="ไม่จำกัด"
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Hourly Limit</label>
              <input
                type="number"
                value={model.hourly_limit || ''}
                onChange={(e) => onChange({ ...model, hourly_limit: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="ไม่จำกัด"
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Cooldown (วินาที)</label>
              <input
                type="number"
                value={model.cooldown_seconds}
                onChange={(e) => onChange({ ...model, cooldown_seconds: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Priority</label>
              <input
                type="number"
                value={model.priority}
                onChange={(e) => onChange({ ...model, priority: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded-lg transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={() => onSave(model)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              บันทึก
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Add Model Modal (OpenRouter Search) ─────────────────
function AddModelModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<OpenRouterModel[]>([]);
  const [searching, setSearching] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedModel, setSelectedModel] = useState<OpenRouterModel | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [newTier, setNewTier] = useState<'free' | 'starter' | 'pro' | 'premium'>('pro');
  const [newName, setNewName] = useState('');

  const searchModels = useCallback(async (query: string) => {
    setSearching(true);
    setError(null);
    try {
      const response = await authFetch(`/api/admin/models/openrouter?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.models || []);
        setTotalResults(data.total || 0);
      } else {
        setError('ไม่สามารถดึงข้อมูลจาก OpenRouter ได้');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    searchModels('');
  }, [searchModels]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      searchModels(value);
    }, 300);
  };

  const handleSelectModel = (model: OpenRouterModel) => {
    setSelectedModel(model);
    setNewName(model.name);
    setNewTier(model.is_free ? 'free' : 'starter');
    setError(null);
    setSuccess(false);
  };

  const handleAddModel = async () => {
    if (!selectedModel) return;
    setAdding(true);
    setError(null);

    try {
      const response = await authFetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedModel.id,
          name: newName || selectedModel.name,
          provider: selectedModel.provider,
          description: selectedModel.description?.slice(0, 500) || `${selectedModel.provider} model via OpenRouter`,
          icon_url: selectedModel.icon_url || null,
          tier: newTier,
          context_window: selectedModel.context_length || null,
          input_cost_per_1k: selectedModel.prompt_cost ? selectedModel.prompt_cost * 1000 : null,
          output_cost_per_1k: selectedModel.completion_cost ? selectedModel.completion_cost * 1000 : null,
          priority: 50,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setResults(results.map(r =>
          r.id === selectedModel.id ? { ...r, already_added: true } : r
        ));
        setTimeout(() => { onAdded(); }, 800);
      } else {
        const data = await response.json();
        setError(data.error || 'ไม่สามารถเพิ่ม model ได้');
      }
    } catch {
      setError('เกิดข้อผิดพลาด');
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-neutral-800">
          <div>
            <h3 className="text-lg font-semibold text-white">เพิ่ม Model จาก OpenRouter</h3>
            <p className="text-sm text-neutral-400 mt-1">
              ค้นหาและเพิ่ม AI model ({totalResults} models)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-neutral-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="ค้นหา model... เช่น gpt-4, claude, llama"
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              autoFocus
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 animate-spin" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Results List */}
          <div className={cn(
            'overflow-y-auto border-r border-neutral-800 transition-all',
            selectedModel ? 'w-1/2' : 'w-full'
          )}>
            {error && !selectedModel && (
              <div className="p-4 text-center text-red-400 text-sm">
                <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                {error}
              </div>
            )}

            {results.length === 0 && !searching && (
              <div className="p-8 text-center text-neutral-500">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>ไม่พบ model ที่ตรงกัน</p>
              </div>
            )}

            {results.map((model) => (
              <button
                key={model.id}
                onClick={() => handleSelectModel(model)}
                disabled={model.already_added}
                className={cn(
                  'w-full text-left p-4 border-b border-neutral-800/50 transition-colors',
                  model.already_added
                    ? 'opacity-50 cursor-not-allowed bg-neutral-800/20'
                    : selectedModel?.id === model.id
                    ? 'bg-primary-500/10 border-l-2 border-l-primary-500'
                    : 'hover:bg-neutral-800/50'
                )}
              >
                <div className="flex items-start gap-2.5">
                  {model.icon_url ? (
                    <img src={model.icon_url} alt={model.provider} className="h-7 w-7 rounded-md object-cover shrink-0 mt-0.5" />
                  ) : (
                    <div className="h-7 w-7 rounded-md bg-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-4 w-4 text-neutral-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-white text-sm truncate">{model.name}</p>
                      {model.already_added && (
                        <span className="shrink-0 text-xs text-green-400 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          เพิ่มแล้ว
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 font-mono truncate mt-0.5">{model.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-neutral-400">{model.provider}</span>
                  {model.context_length > 0 && (
                    <span className="text-xs text-neutral-500">{(model.context_length / 1000).toFixed(0)}K ctx</span>
                  )}
                  {model.is_free ? (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">Free</span>
                  ) : (
                    <span className="text-xs text-neutral-500">${(model.prompt_cost * 1000000).toFixed(2)}/M tok</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Selected Model Config */}
          {selectedModel && (
            <div className="w-1/2 p-4 overflow-y-auto">
              <h4 className="font-semibold text-white mb-1">{selectedModel.name}</h4>
              <p className="text-xs text-neutral-500 font-mono mb-3">{selectedModel.id}</p>

              {selectedModel.description && (
                <p className="text-sm text-neutral-400 mb-4 line-clamp-3">{selectedModel.description}</p>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">ชื่อแสดง</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">ระดับ</label>
                  <div className="flex gap-2">
                    {(['free', 'starter', 'pro', 'premium'] as const).map((tier) => (
                      <button
                        key={tier}
                        onClick={() => setNewTier(tier)}
                        className={cn(
                          'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                          newTier === tier
                            ? tierColors[tier]
                            : 'border-neutral-700 text-neutral-400 hover:text-white'
                        )}
                      >
                        {tierLabels[tier]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-neutral-400">
                    <span>Provider</span>
                    <span className="text-white">{selectedModel.provider}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Context</span>
                    <span className="text-white">{selectedModel.context_length > 0 ? `${(selectedModel.context_length / 1000).toFixed(0)}K` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Input Cost</span>
                    <span className="text-white">{selectedModel.is_free ? 'Free' : `$${(selectedModel.prompt_cost * 1000000).toFixed(2)}/M`}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Output Cost</span>
                    <span className="text-white">{selectedModel.is_free ? 'Free' : `$${(selectedModel.completion_cost * 1000000).toFixed(2)}/M`}</span>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400 flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0" />
                    เพิ่ม model สำเร็จ!
                  </div>
                )}

                <button
                  onClick={handleAddModel}
                  disabled={adding || success || selectedModel.already_added}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    success
                      ? 'bg-green-500/20 text-green-400'
                      : selectedModel.already_added
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      : 'bg-primary-500 hover:bg-primary-600 text-white'
                  )}
                >
                  {adding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : success ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {success ? 'เพิ่มแล้ว' : selectedModel.already_added ? 'เพิ่มอยู่ในระบบแล้ว' : 'เพิ่ม Model'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
